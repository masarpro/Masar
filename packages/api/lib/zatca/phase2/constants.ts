/**
 * ZATCA Phase 2 Constants
 * URLs, namespaces, tax categories, and CSR configuration
 */

// ZATCA API endpoints per environment
// sandbox (developer-portal): accepts OTP 123345 — currently blocked by WAF (2026-03)
// simulation: requires real OTP from Fatoora portal — CSR accepted ✅
// production: live environment
export const ZATCA_URLS = {
	sandbox: "https://gw-fatoora.zatca.gov.sa/e-invoicing/developer-portal",
	simulation: "https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation",
	production: "https://gw-fatoora.zatca.gov.sa/e-invoicing/core",
} as const;

// ZATCA API paths
export const ZATCA_PATHS = {
	complianceCSID: "/compliance",
	productionCSID: "/production/CSIDs",
	complianceInvoice: "/compliance/invoices",
	clearance: "/invoices/clearance/single",
	reporting: "/invoices/reporting/single",
} as const;

// UBL 2.1 Namespaces
export const UBL_NAMESPACES = {
	invoice: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
	cac: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
	cbc: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
	ext: "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
	sig: "urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2",
	sac: "urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2",
	sbc: "urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2",
	ds: "http://www.w3.org/2000/09/xmldsig#",
	xades: "http://uri.etsi.org/01903/v1.3.2#",
} as const;

// ZATCA Tax Categories (UN/CEFACT 5305)
export const TAX_CATEGORIES = {
	STANDARD: { code: "S", percent: 15 },
	ZERO_RATED: { code: "Z", percent: 0 },
	EXEMPT: { code: "E", percent: 0 },
	NOT_SUBJECT: { code: "O", percent: 0 },
} as const;

// ZATCA tax scheme
export const TAX_SCHEME_ID = "VAT";

// Currency
export const DEFAULT_CURRENCY = "SAR";

// CSR config for Saudi Arabia (per ZATCA Technical Guidelines Section 4.1)
export const CSR_CONFIG = {
	country: "SA",
	organizationUnit: "Masar Platform",
	commonName: "MASAR-EGS",
	serialNumber: "1-Masar|2-EGS1|3-",
	registeredAddress: "Jeddah",
	businessCategory: "Construction",
} as const;

// ZATCA OID for invoice type extension in CSR
export const ZATCA_CSR_OID = "2.16.840.1.114513";

// Initial Previous Invoice Hash (Base64 of SHA-256 of "0")
// This is the PIH for the very first invoice in the chain
export const INITIAL_PIH =
	"NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYmUxYjE3ZTExNzA5";

// UBL profile ID for ZATCA
export const UBL_PROFILE_ID = "reporting:1.0";

// Invoice type codes (UN/CEFACT 1001)
export const INVOICE_TYPE_CODES = {
	INVOICE: "388",
	CREDIT_NOTE: "381",
	DEBIT_NOTE: "383",
} as const;

// Invoice type subtype name patterns
// Format: "02NNNNN" (simplified) or "01NNNNN" (standard)
// Digit 3: third-party (1=yes, 0=no)
// Digit 4: nominal (1=yes, 0=no)
// Digit 5: export (1=yes, 0=no)
// Digit 6: summary (1=yes, 0=no)
// Digit 7: self-billed (1=yes, 0=no)
export const INVOICE_SUBTYPE = {
	STANDARD: "0100000",
	SIMPLIFIED: "0200000",
} as const;

// ZATCA environment type
export type ZatcaEnvironment = keyof typeof ZATCA_URLS;

// Sandbox testing — OTP can be any 6-digit number in sandbox mode.
// The sandbox Swagger page provides dummy credentials for initial testing.
export const SANDBOX_DEFAULTS = {
	otp: "123345",
} as const;
