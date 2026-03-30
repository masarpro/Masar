/**
 * ZATCA Phase 2 — Service Layer
 *
 * Orchestrates ZATCA processing for invoice issuance.
 * Decides Phase 1 (simple QR) vs Phase 2 (XML + Sign + Submit).
 *
 * Silent Failure Pattern:
 * - B2C (Simplified): if ZATCA fails, invoice still issues with basic QR
 * - B2B (Standard): invoice issues but marked as PENDING/FAILED for retry
 * - Phase 1 orgs: untouched — same basic QR as before
 */

import { generateZatcaQR, generateZatcaQRImage } from "../index";
import {
	buildInvoiceXml,
	signInvoice,
	decryptSecret,
	clearInvoice,
	reportInvoice,
} from "./index";
import type { ZatcaInvoiceData } from "./types";
import type { PrismaClient } from "@repo/database/prisma/generated/client";

// ─── Result type ────────────────────────────────────────────────────────

export interface ZatcaProcessResult {
	phase: 1 | 2;
	qrCode?: string;
	zatcaUuid: string;
	zatcaHash?: string;
	zatcaSignature?: string;
	zatcaXml?: string;
	zatcaClearedXml?: string;
	zatcaInvoiceType?: "STANDARD" | "SIMPLIFIED";
	zatcaSubmissionStatus: "NOT_APPLICABLE" | "CLEARED" | "REPORTED" | "REJECTED" | "FAILED" | "PENDING";
	zatcaCounterValue?: number;
	zatcaPreviousHash?: string;
	zatcaSubmittedAt?: Date;
	zatcaClearedAt?: Date;
	zatcaWarnings?: Array<{ code?: string; message?: string }>;
	zatcaErrors?: Array<{ code?: string; message?: string }>;
}

// ─── Input types ────────────────────────────────────────────────────────

interface InvoiceForZatca {
	id: string;
	invoiceNo: string;
	invoiceType: string;
	issueDate: Date;
	issuedAt?: Date | null;
	subtotal: any; // Prisma Decimal
	discountAmount: any;
	vatPercent: any;
	vatAmount: any;
	totalAmount: any;
	paidAmount: any;
	clientName: string;
	clientTaxNumber?: string | null;
	clientAddress?: string | null;
	sellerName?: string | null;
	sellerTaxNumber?: string | null;
	sellerAddress?: string | null;
	zatcaUuid?: string | null;
	relatedInvoiceId?: string | null;
	qrCode?: string | null;
	items: Array<{
		description: string;
		quantity: any;
		unitPrice: any;
		totalPrice: any;
		sortOrder: number;
	}>;
	client?: { taxNumber?: string | null } | null;
}

interface SellerInfo {
	name: string;
	taxNumber: string;
	crNumber?: string;
	address?: string;
	city?: string;
}

/**
 * Process an invoice for ZATCA — called after invoice issuance.
 *
 * Automatically determines Phase 1 vs Phase 2 based on whether the
 * organization has an active ZatcaDevice.
 *
 * @param db - Prisma client instance
 * @param invoice - The issued invoice with items
 * @param organizationId - Organization ID
 * @param seller - Seller info (name, tax number, address)
 * @returns ZatcaProcessResult with QR code and ZATCA metadata
 */
export async function processInvoiceForZatca(
	db: PrismaClient,
	invoice: InvoiceForZatca,
	organizationId: string,
	seller: SellerInfo,
): Promise<ZatcaProcessResult> {
	const zatcaUuid = invoice.zatcaUuid || crypto.randomUUID();
	const cleanTaxNumber = seller.taxNumber.replace(/[\s-]/g, "");

	// ─── Check for active ZATCA Phase 2 device ───────────────────────
	const clientTaxNumber = invoice.client?.taxNumber || invoice.clientTaxNumber;
	const isSimplified = !clientTaxNumber;
	const zatcaInvoiceType = isSimplified ? "SIMPLIFIED" : "STANDARD";

	const device = await db.zatcaDevice.findFirst({
		where: {
			organizationId,
			invoiceType: zatcaInvoiceType,
			status: "ACTIVE",
		},
	});

	if (!device) {
		// ═══ Phase 1: Simple QR only ═══
		return generatePhase1QR(invoice, seller, cleanTaxNumber, zatcaUuid);
	}

	// ═══ Phase 2: XML → Sign → Submit ═══
	if (!device.csidCertificate || !device.csidSecret || !device.privateKey || !device.publicKey) {
		// Device exists but incomplete — fallback to Phase 1
		console.error("[ZATCA] Device missing certificates, falling back to Phase 1");
		return generatePhase1QR(invoice, seller, cleanTaxNumber, zatcaUuid);
	}

	try {
		return await processPhase2(db, invoice, organizationId, seller, device as typeof device & { csidCertificate: string; csidSecret: string; privateKey: string; publicKey: string }, zatcaUuid, isSimplified, zatcaInvoiceType, cleanTaxNumber);
	} catch (error) {
		// ═══ Silent Failure — don't block invoice issuance ═══
		console.error("[ZATCA] Phase 2 processing failed, falling back to Phase 1:", error);

		// Record the failure
		try {
			await db.zatcaSubmission.create({
				data: {
					organizationId,
					invoiceId: invoice.id,
					deviceId: device.id,
					submissionType: isSimplified ? "reporting" : "clearance",
					invoiceHash: "",
					status: "FAILED",
					zatcaErrors: [{ message: error instanceof Error ? error.message : String(error) }] as any,
				},
			});
		} catch {
			// Don't fail if we can't even record the failure
		}

		// Fallback to Phase 1 QR
		const fallback = await generatePhase1QR(invoice, seller, cleanTaxNumber, zatcaUuid);
		return {
			...fallback,
			phase: 2, // Mark as Phase 2 even though it failed (org IS on Phase 2)
			zatcaInvoiceType,
			zatcaSubmissionStatus: "FAILED",
			zatcaErrors: [{ message: error instanceof Error ? error.message : String(error) }],
		};
	}
}

// ─── Phase 1: Simple QR ─────────────────────────────────────────────────

async function generatePhase1QR(
	invoice: InvoiceForZatca,
	seller: SellerInfo,
	cleanTaxNumber: string,
	zatcaUuid: string,
): Promise<ZatcaProcessResult> {
	let qrCode: string | undefined;

	if (cleanTaxNumber && /^\d{15}$/.test(cleanTaxNumber)) {
		try {
			const tlvBase64 = generateZatcaQR({
				sellerName: seller.name,
				vatNumber: cleanTaxNumber,
				timestamp: invoice.issueDate,
				totalWithVat: Number(invoice.totalAmount),
				vatAmount: Number(invoice.vatAmount),
			});
			qrCode = await generateZatcaQRImage(tlvBase64);
		} catch (err) {
			console.error("[ZATCA] Phase 1 QR generation failed:", err);
		}
	}

	return {
		phase: 1,
		qrCode,
		zatcaUuid,
		zatcaSubmissionStatus: "NOT_APPLICABLE",
	};
}

// ─── Phase 2: Full ZATCA processing ─────────────────────────────────────

async function processPhase2(
	db: PrismaClient,
	invoice: InvoiceForZatca,
	organizationId: string,
	seller: SellerInfo,
	device: {
		id: string;
		csidCertificate: string;
		csidSecret: string;
		privateKey: string;
		publicKey: string;
		invoiceCounter: number;
		previousInvoiceHash: string;
	},
	zatcaUuid: string,
	isSimplified: boolean,
	zatcaInvoiceType: "STANDARD" | "SIMPLIFIED",
	cleanTaxNumber: string,
): Promise<ZatcaProcessResult> {
	// 1. Atomically increment counter
	const updatedDevice = await db.zatcaDevice.update({
		where: { id: device.id },
		data: { invoiceCounter: { increment: 1 } },
		select: { invoiceCounter: true, previousInvoiceHash: true },
	});

	const counterValue = updatedDevice.invoiceCounter;
	const previousHash = updatedDevice.previousInvoiceHash;

	// 2. Determine invoice type code
	let invoiceTypeCode: "388" | "381" | "383" = "388";
	if (invoice.invoiceType === "CREDIT_NOTE") invoiceTypeCode = "381";
	else if (invoice.invoiceType === "DEBIT_NOTE") invoiceTypeCode = "383";

	// 3. Build ZatcaInvoiceData
	const clientTaxNumber = invoice.client?.taxNumber || invoice.clientTaxNumber;
	const invoiceData: ZatcaInvoiceData = {
		uuid: zatcaUuid,
		invoiceNumber: invoice.invoiceNo,
		issueDate: invoice.issueDate.toISOString().split("T")[0]!,
		issueTime:
			invoice.issuedAt?.toISOString().split("T")[1]?.replace(/\.\d+Z/, "") || "00:00:00",
		invoiceTypeCode,
		isSimplified,
		seller: {
			name: seller.name,
			taxNumber: cleanTaxNumber,
			crNumber: seller.crNumber,
			address: {
				street: seller.address || undefined,
				city: seller.city || "Jeddah",
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

	// 4. Build XML + Sign
	const xml = buildInvoiceXml(invoiceData);
	const privateKey = decryptSecret(device.privateKey);
	const signed = signInvoice(xml, privateKey, device.csidCertificate, device.publicKey);

	// 5. Submit to ZATCA
	const csidSecret = decryptSecret(device.csidSecret);
	const signedXmlBase64 = Buffer.from(signed.signedXml).toString("base64");

	const zatcaResult = isSimplified
		? await reportInvoice(
				signedXmlBase64,
				signed.invoiceHash,
				zatcaUuid,
				device.csidCertificate,
				csidSecret,
			)
		: await clearInvoice(
				signedXmlBase64,
				signed.invoiceHash,
				zatcaUuid,
				device.csidCertificate,
				csidSecret,
			);

	// 6. Determine status
	let submissionStatus: "CLEARED" | "REPORTED" | "REJECTED" | "FAILED";
	if (zatcaResult.success) {
		submissionStatus = isSimplified ? "REPORTED" : "CLEARED";
	} else if (zatcaResult.errors && zatcaResult.errors.length > 0) {
		submissionStatus = "REJECTED";
	} else {
		submissionStatus = "FAILED";
	}

	// 7. Generate QR image
	let qrCode: string | undefined;
	if (signed.qrCode) {
		try {
			qrCode = await generateZatcaQRImage(signed.qrCode);
		} catch {
			// Non-critical
		}
	}

	// 8. Save submission record
	await db.zatcaSubmission.create({
		data: {
			organizationId,
			invoiceId: invoice.id,
			deviceId: device.id,
			submissionType: isSimplified ? "reporting" : "clearance",
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

	// 9. Update device PIH
	await db.zatcaDevice.update({
		where: { id: device.id },
		data: { previousInvoiceHash: signed.invoiceHash },
	});

	return {
		phase: 2,
		qrCode,
		zatcaUuid,
		zatcaHash: signed.invoiceHash,
		zatcaSignature: signed.signature,
		zatcaXml: xml,
		zatcaClearedXml: zatcaResult.clearedInvoice
			? Buffer.from(zatcaResult.clearedInvoice, "base64").toString("utf-8")
			: undefined,
		zatcaInvoiceType,
		zatcaSubmissionStatus: submissionStatus,
		zatcaCounterValue: counterValue,
		zatcaPreviousHash: previousHash,
		zatcaSubmittedAt: new Date(),
		zatcaClearedAt: zatcaResult.success ? new Date() : undefined,
		zatcaWarnings: zatcaResult.warnings,
		zatcaErrors: zatcaResult.errors,
	};
}
