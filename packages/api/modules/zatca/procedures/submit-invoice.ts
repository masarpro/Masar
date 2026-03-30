// ZATCA Submit Invoice — إرسال فاتورة لزاتكا (Clearance أو Reporting)

import { db, orgAuditLog } from "@repo/database";
import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";
import {
	buildInvoiceXml,
	signInvoice,
	decryptSecret,
	clearInvoice,
	reportInvoice,
	INVOICE_TYPE_CODES,
} from "../../../lib/zatca/phase2";
import type { ZatcaInvoiceData } from "../../../lib/zatca/phase2";
import { generateZatcaQRImage } from "../../../lib/zatca";

export const submitInvoice = subscriptionProcedure
	.route({
		method: "POST",
		path: "/zatca/invoices/submit",
		tags: ["ZATCA"],
		summary: "Submit an invoice to ZATCA for clearance or reporting",
	})
	.input(
		z.object({
			organizationId: idString(),
			invoiceId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		// 1. Load invoice with items
		const invoice = await db.financeInvoice.findFirst({
			where: { id: input.invoiceId, organizationId: input.organizationId },
			include: {
				items: { orderBy: { sortOrder: "asc" } },
				client: { select: { taxNumber: true } },
			},
		});

		if (!invoice) {
			throw new ORPCError("NOT_FOUND", { message: "الفاتورة غير موجودة" });
		}

		if (invoice.status !== "ISSUED") {
			throw new ORPCError("BAD_REQUEST", {
				message: "يجب إصدار الفاتورة أولاً قبل إرسالها لزاتكا",
			});
		}

		if (
			invoice.zatcaSubmissionStatus === "CLEARED" ||
			invoice.zatcaSubmissionStatus === "REPORTED"
		) {
			throw new ORPCError("BAD_REQUEST", {
				message: "الفاتورة أُرسلت لزاتكا مسبقاً",
			});
		}

		// 2. Load organization
		const org = await db.organization.findUnique({
			where: { id: input.organizationId },
			select: {
				name: true,
				taxNumber: true,
				commercialRegister: true,
				address: true,
				city: true,
			},
		});

		if (!org?.taxNumber) {
			throw new ORPCError("BAD_REQUEST", {
				message: "الرقم الضريبي مطلوب في إعدادات المنظمة",
			});
		}

		const cleanTaxNumber = org.taxNumber.replace(/[\s-]/g, "");

		// 3. Determine invoice type (B2B vs B2C)
		const clientTaxNumber = invoice.client?.taxNumber || invoice.clientTaxNumber;
		const isSimplified = !clientTaxNumber;
		const zatcaInvoiceType = isSimplified ? "SIMPLIFIED" : "STANDARD";

		// 4. Find active device
		const device = await db.zatcaDevice.findFirst({
			where: {
				organizationId: input.organizationId,
				invoiceType: zatcaInvoiceType,
				status: "ACTIVE",
			},
		});

		if (!device) {
			throw new ORPCError("BAD_REQUEST", {
				message: `فعّل الربط مع زاتكا لـ${isSimplified ? "الفواتير المبسّطة" : "الفواتير الضريبية"} أولاً`,
			});
		}

		if (!device.csidCertificate || !device.csidSecret || !device.privateKey) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "بيانات الشهادة غير مكتملة. أعد التسجيل.",
			});
		}

		// 5. Atomically increment counter and get previous hash
		const updatedDevice = await db.zatcaDevice.update({
			where: { id: device.id },
			data: { invoiceCounter: { increment: 1 } },
			select: { invoiceCounter: true, previousInvoiceHash: true },
		});

		const counterValue = updatedDevice.invoiceCounter;
		const previousHash = updatedDevice.previousInvoiceHash;

		// 6. Determine invoice type code
		let invoiceTypeCode: "388" | "381" | "383" = "388";
		if (invoice.invoiceType === "CREDIT_NOTE") invoiceTypeCode = "381";
		else if (invoice.invoiceType === "DEBIT_NOTE") invoiceTypeCode = "383";

		// 7. Build ZatcaInvoiceData
		const invoiceData: ZatcaInvoiceData = {
			uuid: invoice.zatcaUuid || crypto.randomUUID(),
			invoiceNumber: invoice.invoiceNo,
			issueDate: invoice.issueDate.toISOString().split("T")[0]!,
			issueTime:
				invoice.issuedAt?.toISOString().split("T")[1]?.replace(/\.\d+Z/, "") ||
				"00:00:00",
			invoiceTypeCode,
			isSimplified,
			seller: {
				name: invoice.sellerName || org.name,
				taxNumber: invoice.sellerTaxNumber || cleanTaxNumber,
				crNumber: org.commercialRegister ?? undefined,
				address: {
					street: invoice.sellerAddress || org.address || undefined,
					city: org.city || "Jeddah",
					countryCode: "SA",
				},
			},
			buyer: clientTaxNumber
				? {
						name: invoice.clientName,
						taxNumber: clientTaxNumber,
						address: invoice.clientAddress
							? { street: invoice.clientAddress, countryCode: "SA" }
							: undefined,
					}
				: isSimplified
					? undefined
					: { name: invoice.clientName },
			lineItems: invoice.items.map((item, idx) => ({
				id: String(idx + 1),
				name: item.description,
				quantity: Number(item.quantity),
				unitPrice: Number(item.unitPrice),
				taxCategory: "S" as const,
				taxPercent: Number(invoice.vatPercent),
				lineTotal: Number(item.totalPrice),
			})),
			totals: {
				subtotal: Number(invoice.subtotal),
				totalDiscount: Number(invoice.discountAmount),
				taxableAmount: Number(invoice.subtotal) - Number(invoice.discountAmount),
				taxAmount: Number(invoice.vatAmount),
				totalWithVat: Number(invoice.totalAmount),
				payableAmount: Number(invoice.totalAmount) - Number(invoice.paidAmount),
			},
			billingReference: invoice.relatedInvoiceId
				? { invoiceNumber: invoice.invoiceNo }
				: undefined,
			previousInvoiceHash: previousHash,
			invoiceCounter: counterValue,
		};

		// 8. Build XML + Sign
		const xml = buildInvoiceXml(invoiceData);
		const privateKey = decryptSecret(device.privateKey);
		const signed = signInvoice(
			xml,
			privateKey,
			device.csidCertificate,
			device.publicKey!,
		);

		// 9. Submit to ZATCA
		const csidSecret = decryptSecret(device.csidSecret);
		const signedXmlBase64 = Buffer.from(signed.signedXml).toString("base64");

		const submissionType = isSimplified ? "reporting" : "clearance";
		const zatcaResult = isSimplified
			? await reportInvoice(
					signedXmlBase64,
					signed.invoiceHash,
					invoiceData.uuid,
					device.csidCertificate,
					csidSecret,
				)
			: await clearInvoice(
					signedXmlBase64,
					signed.invoiceHash,
					invoiceData.uuid,
					device.csidCertificate,
					csidSecret,
				);

		// 10. Determine submission status
		let submissionStatus: "CLEARED" | "REPORTED" | "REJECTED" | "FAILED";
		if (zatcaResult.success) {
			submissionStatus = isSimplified ? "REPORTED" : "CLEARED";
		} else if (zatcaResult.errors && zatcaResult.errors.length > 0) {
			submissionStatus = "REJECTED";
		} else {
			submissionStatus = "FAILED";
		}

		// 11. Generate QR image from enhanced QR
		let qrCodeImage: string | undefined;
		if (signed.qrCode) {
			try {
				qrCodeImage = await generateZatcaQRImage(signed.qrCode);
			} catch {
				// Non-critical — log but don't fail
			}
		}

		// 12. Save submission record
		const submission = await db.zatcaSubmission.create({
			data: {
				organizationId: input.organizationId,
				invoiceId: invoice.id,
				deviceId: device.id,
				submissionType,
				invoiceHash: signed.invoiceHash,
				xmlContent: xml,
				signedXmlContent: signed.signedXml,
				status: submissionStatus,
				zatcaResponse: zatcaResult as any,
				clearedXml: zatcaResult.clearedInvoice
					? Buffer.from(zatcaResult.clearedInvoice, "base64").toString("utf-8")
					: null,
				zatcaWarnings: zatcaResult.warnings as any,
				zatcaErrors: zatcaResult.errors as any,
			},
		});

		// 13. Update invoice
		await db.financeInvoice.update({
			where: { id: invoice.id },
			data: {
				zatcaInvoiceType: zatcaInvoiceType,
				zatcaSubmissionStatus: submissionStatus,
				zatcaCounterValue: counterValue,
				zatcaPreviousHash: previousHash,
				zatcaXml: xml,
				zatcaClearedXml: zatcaResult.clearedInvoice
					? Buffer.from(zatcaResult.clearedInvoice, "base64").toString("utf-8")
					: null,
				zatcaHash: signed.invoiceHash,
				zatcaSignature: signed.signature,
				qrCode: qrCodeImage || invoice.qrCode,
				zatcaSubmittedAt: new Date(),
				zatcaClearedAt: zatcaResult.success ? new Date() : null,
			},
		});

		// 14. Update device PIH
		await db.zatcaDevice.update({
			where: { id: device.id },
			data: { previousInvoiceHash: signed.invoiceHash },
		});

		// 15. Audit log
		orgAuditLog({
			organizationId: input.organizationId,
			userId: context.user.id,
			action: "INVOICE_UPDATED",
			entity: "FinanceInvoice",
			entityId: invoice.id,
			details: {
				action: "zatca_submit",
				submissionType,
				status: submissionStatus,
				submissionId: submission.id,
			},
		});

		return {
			success: zatcaResult.success,
			submissionId: submission.id,
			status: submissionStatus,
			warnings: zatcaResult.warnings,
			errors: zatcaResult.errors,
		};
	});
