/**
 * ZATCA Phase 2 — Retry Failed Submissions
 *
 * Called from a cron job to retry FAILED/REJECTED submissions.
 * B2C Reporting has a 24-hour window per ZATCA rules.
 *
 * Rules:
 * - Max 5 retry attempts per submission
 * - Minimum 5 minutes between attempts
 * - Only retries FAILED status (not REJECTED — those need manual fix)
 * - Batch size: 50 per run
 */

import {
	buildInvoiceXml,
	signInvoice,
	decryptSecret,
	clearInvoice,
	reportInvoice,
} from "./index";
import type { ZatcaInvoiceData } from "./types";
import { generateZatcaQRImage } from "../index";
import type { PrismaClient } from "@repo/database/prisma/generated/client";

interface RetryResult {
	total: number;
	succeeded: number;
	failed: number;
	skipped: number;
}

export async function retryFailedSubmissions(db: PrismaClient): Promise<RetryResult> {
	const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

	// Find eligible submissions
	const failedSubmissions = await db.zatcaSubmission.findMany({
		where: {
			status: "FAILED",
			attempts: { lt: 5 },
			lastAttemptAt: { lt: fiveMinutesAgo },
		},
		include: {
			invoice: {
				include: {
					items: { orderBy: { sortOrder: "asc" } },
					client: { select: { taxNumber: true } },
				},
			},
			device: true,
		},
		take: 50,
		orderBy: { lastAttemptAt: "asc" },
	});

	const result: RetryResult = {
		total: failedSubmissions.length,
		succeeded: 0,
		failed: 0,
		skipped: 0,
	};

	for (const submission of failedSubmissions) {
		const { device, invoice } = submission;

		// Skip if device is no longer active
		if (device.status !== "ACTIVE" || !device.csidCertificate || !device.csidSecret || !device.privateKey || !device.publicKey) {
			result.skipped++;
			continue;
		}

		// Get org info
		const org = await db.organization.findUnique({
			where: { id: submission.organizationId },
			select: { name: true, taxNumber: true, commercialRegister: true, address: true, city: true },
		});

		if (!org?.taxNumber) {
			result.skipped++;
			continue;
		}

		const cleanTaxNumber = org.taxNumber.replace(/[\s-]/g, "");
		const clientTaxNumber = invoice.client?.taxNumber || invoice.clientTaxNumber;
		const isSimplified = !clientTaxNumber;

		try {
			// Determine invoice type code
			let invoiceTypeCode: "388" | "381" | "383" = "388";
			if (invoice.invoiceType === "CREDIT_NOTE") invoiceTypeCode = "381";
			else if (invoice.invoiceType === "DEBIT_NOTE") invoiceTypeCode = "383";

			// Use original counter and PIH
			const counterValue = invoice.zatcaCounterValue ?? device.invoiceCounter;
			const previousHash = invoice.zatcaPreviousHash ?? device.previousInvoiceHash;

			const invoiceData: ZatcaInvoiceData = {
				uuid: invoice.zatcaUuid || crypto.randomUUID(),
				invoiceNumber: invoice.invoiceNo,
				issueDate: invoice.issueDate.toISOString().split("T")[0]!,
				issueTime: invoice.issuedAt?.toISOString().split("T")[1]?.replace(/\.\d+Z/, "") || "00:00:00",
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
							address: invoice.clientAddress ? { street: invoice.clientAddress, countryCode: "SA" } : undefined,
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

			// Build XML + Sign
			const xml = buildInvoiceXml(invoiceData);
			const privateKey = decryptSecret(device.privateKey);
			const signed = signInvoice(xml, privateKey, device.csidCertificate, device.publicKey);

			// Submit to ZATCA
			const csidSecret = decryptSecret(device.csidSecret);
			const signedXmlBase64 = Buffer.from(signed.signedXml).toString("base64");

			const zatcaResult = isSimplified
				? await reportInvoice(signedXmlBase64, signed.invoiceHash, invoiceData.uuid, device.csidCertificate, csidSecret)
				: await clearInvoice(signedXmlBase64, signed.invoiceHash, invoiceData.uuid, device.csidCertificate, csidSecret);

			let newStatus: "CLEARED" | "REPORTED" | "REJECTED" | "FAILED";
			if (zatcaResult.success) {
				newStatus = isSimplified ? "REPORTED" : "CLEARED";
			} else if (zatcaResult.errors?.length) {
				newStatus = "REJECTED";
			} else {
				newStatus = "FAILED";
			}

			// Generate QR
			let qrCode: string | undefined;
			if (signed.qrCode) {
				try { qrCode = await generateZatcaQRImage(signed.qrCode); } catch {}
			}

			// Update submission
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

			// Update invoice
			await db.financeInvoice.update({
				where: { id: invoice.id },
				data: {
					zatcaSubmissionStatus: newStatus,
					zatcaHash: signed.invoiceHash,
					zatcaSignature: signed.signature,
					zatcaXml: xml,
					zatcaClearedXml: zatcaResult.clearedInvoice
						? Buffer.from(zatcaResult.clearedInvoice, "base64").toString("utf-8")
						: undefined,
					qrCode: qrCode || invoice.qrCode || undefined,
					zatcaSubmittedAt: new Date(),
					zatcaClearedAt: zatcaResult.success ? new Date() : undefined,
				},
			});

			// Update PIH on success
			if (zatcaResult.success) {
				await db.zatcaDevice.update({
					where: { id: device.id },
					data: { previousInvoiceHash: signed.invoiceHash },
				});
			}

			if (zatcaResult.success) {
				result.succeeded++;
			} else {
				result.failed++;
			}
		} catch (error) {
			console.error(`[ZATCA Retry] Submission ${submission.id} failed:`, error);

			await db.zatcaSubmission.update({
				where: { id: submission.id },
				data: {
					attempts: { increment: 1 },
					lastAttemptAt: new Date(),
					zatcaErrors: [{ message: error instanceof Error ? error.message : String(error) }] as any,
				},
			});

			result.failed++;
		}
	}

	return result;
}
