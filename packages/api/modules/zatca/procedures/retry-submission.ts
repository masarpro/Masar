// ZATCA Retry Submission — إعادة إرسال فاتورة مرفوضة أو فاشلة

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
} from "../../../lib/zatca/phase2";
import type { ZatcaInvoiceData } from "../../../lib/zatca/phase2";
import { generateZatcaQRImage } from "../../../lib/zatca";

export const retrySubmission = subscriptionProcedure
	.route({
		method: "POST",
		path: "/zatca/submissions/retry",
		tags: ["ZATCA"],
		summary: "Retry a failed or rejected ZATCA submission",
	})
	.input(
		z.object({
			organizationId: idString(),
			submissionId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(input.organizationId, context.user.id, {
			section: "finance",
			action: "invoices",
		});

		// 1. Load existing submission
		const submission = await db.zatcaSubmission.findFirst({
			where: {
				id: input.submissionId,
				organizationId: input.organizationId,
			},
			include: {
				device: true,
				invoice: {
					include: {
						items: { orderBy: { sortOrder: "asc" } },
						client: { select: { taxNumber: true } },
					},
				},
			},
		});

		if (!submission) {
			throw new ORPCError("NOT_FOUND", { message: "الإرسال غير موجود" });
		}

		if (submission.status !== "REJECTED" && submission.status !== "FAILED") {
			throw new ORPCError("BAD_REQUEST", {
				message: "يمكن إعادة المحاولة فقط للفواتير المرفوضة أو الفاشلة",
			});
		}

		const { device, invoice } = submission;

		if (device.status !== "ACTIVE") {
			throw new ORPCError("BAD_REQUEST", {
				message: "الجهاز غير نشط. أعد التسجيل مع زاتكا.",
			});
		}

		if (!device.csidCertificate || !device.csidSecret || !device.privateKey) {
			throw new ORPCError("INTERNAL_SERVER_ERROR", {
				message: "بيانات الشهادة غير مكتملة",
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
				message: "الرقم الضريبي مطلوب",
			});
		}

		const cleanTaxNumber = org.taxNumber.replace(/[\s-]/g, "");
		const clientTaxNumber = invoice.client?.taxNumber || invoice.clientTaxNumber;
		const isSimplified = !clientTaxNumber;

		// 3. Determine invoice type code
		let invoiceTypeCode: "388" | "381" | "383" = "388";
		if (invoice.invoiceType === "CREDIT_NOTE") invoiceTypeCode = "381";
		else if (invoice.invoiceType === "DEBIT_NOTE") invoiceTypeCode = "383";

		// 4. Use original counter value and PIH (don't increment — same invoice)
		const counterValue = invoice.zatcaCounterValue ?? submission.device.invoiceCounter;
		const previousHash = invoice.zatcaPreviousHash ?? device.previousInvoiceHash;

		// 5. Rebuild invoice data
		const invoiceData: ZatcaInvoiceData = {
			uuid: invoice.zatcaUuid || crypto.randomUUID(),
			invoiceNumber: invoice.invoiceNo,
			issueDate: invoice.issueDate.toISOString().split("T")[0]!,
			issueTime:
				invoice.issuedAt?.toISOString().split("T")[1]?.replace(/\.\d+Z/, "") ||
				"00:00:00",
			invoiceTypeCode,
			isSimplified,
			deliveryDate: !isSimplified ? invoice.issueDate.toISOString().split("T")[0]! : undefined,
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
				: undefined,
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

		// 6. Build XML + Sign
		const xml = buildInvoiceXml(invoiceData);
		const privateKey = decryptSecret(device.privateKey);
		const signed = signInvoice(
			xml,
			privateKey,
			device.csidCertificate,
			device.publicKey!,
		);

		// 7. Submit to ZATCA
		const csidSecret = decryptSecret(device.csidSecret);
		const signedXmlBase64 = Buffer.from(signed.signedXml).toString("base64");

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

		// 8. Determine result
		let newStatus: "CLEARED" | "REPORTED" | "REJECTED" | "FAILED";
		if (zatcaResult.success) {
			newStatus = isSimplified ? "REPORTED" : "CLEARED";
		} else if (zatcaResult.errors && zatcaResult.errors.length > 0) {
			newStatus = "REJECTED";
		} else {
			newStatus = "FAILED";
		}

		// 9. Generate QR image
		let qrCodeImage: string | undefined;
		if (signed.qrCode) {
			try {
				qrCodeImage = await generateZatcaQRImage(signed.qrCode);
			} catch {
				// Non-critical
			}
		}

		// 10. Update submission record
		await db.zatcaSubmission.update({
			where: { id: submission.id },
			data: {
				status: newStatus,
				invoiceHash: signed.invoiceHash,
				xmlContent: xml,
				signedXmlContent: signed.signedXml,
				zatcaResponse: zatcaResult as any,
				clearedXml: zatcaResult.clearedInvoice
					? Buffer.from(zatcaResult.clearedInvoice, "base64").toString("utf-8")
					: null,
				zatcaWarnings: zatcaResult.warnings as any,
				zatcaErrors: zatcaResult.errors as any,
				attempts: { increment: 1 },
				lastAttemptAt: new Date(),
			},
		});

		// 11. Update invoice
		await db.financeInvoice.update({
			where: { id: invoice.id },
			data: {
				zatcaSubmissionStatus: newStatus,
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

		// 12. Update PIH if successful
		if (zatcaResult.success) {
			await db.zatcaDevice.update({
				where: { id: device.id },
				data: { previousInvoiceHash: signed.invoiceHash },
			});
		}

		orgAuditLog({
			organizationId: input.organizationId,
			actorId: context.user.id,
			action: "INVOICE_UPDATED",
			entityType: "FinanceInvoice",
			entityId: invoice.id,
			metadata: {
				action: "zatca_retry",
				submissionId: submission.id,
				status: newStatus,
			},
		});

		return {
			success: zatcaResult.success,
			status: newStatus,
			warnings: zatcaResult.warnings,
			errors: zatcaResult.errors,
		};
	});
