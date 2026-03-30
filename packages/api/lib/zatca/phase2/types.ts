/**
 * ZATCA Phase 2 TypeScript Types
 * All interfaces for CSR, XML, signing, and submission
 */

/** Invoice data required to build UBL 2.1 XML */
export interface ZatcaInvoiceData {
	// --- Identifiers ---
	uuid: string;
	invoiceNumber: string;
	issueDate: string; // YYYY-MM-DD
	issueTime: string; // HH:MM:SS

	/** 388=invoice, 381=credit note, 383=debit note */
	invoiceTypeCode: "388" | "381" | "383";

	/** true = B2C (simplified), false = B2B (standard) */
	isSimplified: boolean;

	// --- Seller ---
	seller: ZatcaParty;

	// --- Buyer (required for B2B, optional for B2C) ---
	buyer?: ZatcaBuyer;

	// --- Line Items ---
	lineItems: ZatcaLineItem[];

	// --- Totals ---
	totals: ZatcaTotals;

	// --- Billing Reference (for credit/debit notes only) ---
	billingReference?: {
		invoiceNumber: string;
		invoiceUuid?: string;
	};

	// --- Hash Chain ---
	previousInvoiceHash: string; // PIH — Base64 SHA-256
	invoiceCounter: number; // Cumulative counter
}

export interface ZatcaParty {
	name: string;
	taxNumber: string; // 15 digits VAT number
	crNumber?: string; // Commercial Registration number
	address: ZatcaAddress;
}

export interface ZatcaBuyer {
	name: string;
	taxNumber?: string;
	address?: Partial<ZatcaAddress>;
}

export interface ZatcaAddress {
	street?: string;
	buildingNumber?: string;
	city: string;
	postalCode?: string;
	district?: string;
	countryCode: string; // "SA"
}

export interface ZatcaLineItem {
	id: string;
	name: string;
	quantity: number;
	unitPrice: number; // Before tax
	discount?: number; // Discount amount
	taxCategory: "S" | "Z" | "E" | "O";
	taxPercent: number; // 15, 0, etc.
	lineTotal: number; // quantity * unitPrice - discount
}

export interface ZatcaTotals {
	subtotal: number;
	totalDiscount: number;
	taxableAmount: number;
	taxAmount: number;
	totalWithVat: number;
	prepaidAmount?: number;
	payableAmount: number;
}

/** Result of signing an invoice */
export interface SigningResult {
	signedXml: string;
	invoiceHash: string; // Base64 SHA-256
	signature: string; // Base64 digital signature
	qrCode: string; // Base64 TLV (9 tags)
}

/** Result of CSR generation */
export interface CSRResult {
	csr: string; // Base64 DER CSR
	privateKey: string; // PEM private key
	publicKey: string; // PEM public key
}

/** Result of ZATCA onboarding (compliance or production CSID) */
export interface OnboardingResult {
	csid: string; // Base64 certificate
	secret: string; // API secret
	requestId: string;
}

/** Input for CSR generation */
export interface CSRInput {
	organizationName: string;
	vatNumber: string; // 15 digits
	/** "1100" = both, "1000" = standard only, "0100" = simplified only */
	invoiceType?: "1100" | "1000" | "0100";
	serialNumber?: string;
}

/** Input for enhanced QR code (9 tags) */
export interface EnhancedQRInput {
	sellerName: string;
	vatNumber: string;
	timestamp: string; // ISO 8601
	totalWithVat: string; // 2 decimal places
	vatAmount: string; // 2 decimal places
	invoiceHash: string; // Base64 SHA-256
	digitalSignature: string; // Base64 ECDSA signature
	publicKey: string; // Base64 public key (DER)
	certificateSignature: string; // Base64 certificate stamp
}
