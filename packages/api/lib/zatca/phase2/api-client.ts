/**
 * ZATCA Phase 2 — API Client
 *
 * HTTP client for communicating with the ZATCA Fatoora e-invoicing API.
 * Supports: Compliance CSID, Production CSID, Clearance, Reporting.
 *
 * Uses native fetch (available in Node.js 18+).
 */

import { ZATCA_URLS, ZATCA_PATHS, type ZatcaEnvironment } from "./constants";

function getBaseUrl(): string {
	const env = (process.env.ZATCA_ENVIRONMENT || "simulation") as ZatcaEnvironment;
	return ZATCA_URLS[env] || ZATCA_URLS.sandbox;
}

// ─── Shared fetch helper ────────────────────────────────────────────────

interface ZatcaFetchOptions {
	method: "POST" | "GET" | "PATCH";
	body?: unknown;
	auth?: { username: string; password: string };
	otp?: string;
	/** ClearanceStatus header: "0" for reporting, "1" for clearance */
	clearanceStatus?: "0" | "1";
}

interface ZatcaFetchResult {
	ok: boolean;
	status: number;
	data: any;
	responseText: string;
}

async function zatcaFetch(path: string, options: ZatcaFetchOptions): Promise<ZatcaFetchResult> {
	const url = `${getBaseUrl()}${path}`;

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		Accept: "application/json",
		"Accept-Language": "en",
		"Accept-Version": "V2",
	};

	if (options.auth) {
		const token = Buffer.from(
			`${options.auth.username}:${options.auth.password}`,
		).toString("base64");
		headers.Authorization = `Basic ${token}`;
	}

	if (options.otp) {
		headers.OTP = options.otp;
	}

	if (options.clearanceStatus) {
		headers["Clearance-Status"] = options.clearanceStatus;
	}

	const bodyJson = options.body ? JSON.stringify(options.body) : undefined;

	// DEBUG — log full request for ZATCA troubleshooting
	console.log("[ZATCA API] Request:", options.method, url);
	console.log("[ZATCA API] Headers:", JSON.stringify(headers));
	if (bodyJson) console.log("[ZATCA API] Body:", bodyJson.substring(0, 200));

	const response = await fetch(url, {
		method: options.method,
		headers,
		body: bodyJson,
	});

	const responseText = await response.text();
	let data: any = null;
	try {
		data = JSON.parse(responseText);
	} catch {
		// Non-JSON response — keep responseText for error messages
	}

	// 2xx = success. Also treat 208 (Already Reported) and 409 (Already Reported) as success (idempotency).
	const isSuccess = response.ok || response.status === 208 || response.status === 409;

	if (!isSuccess) {
		console.error(`[ZATCA API] ${options.method} ${path} → ${response.status}`);
		console.error("[ZATCA API] Response body:", responseText.substring(0, 1000));
		console.error("[ZATCA API] Response headers:", JSON.stringify(
			Object.fromEntries(response.headers.entries()),
		));
	}

	if (response.status === 202) {
		console.warn(`[ZATCA API] ${path} → 202 (accepted with warnings)`);
	}
	if (response.status === 208 || response.status === 409) {
		console.warn(`[ZATCA API] ${path} → ${response.status} (already reported — treating as success)`);
	}
	if (response.status === 303) {
		console.warn(`[ZATCA API] ${path} → 303 (See Other — wrong endpoint for this invoice type)`);
	}

	return { ok: isSuccess, status: response.status, data, responseText };
}

// ─── Result types ───────────────────────────────────────────────────────

export interface ZatcaCSIDResult {
	success: boolean;
	csid?: string;
	secret?: string;
	requestId?: string;
	httpStatus?: number;
	errors?: Array<{ code?: string; message: string }>;
}

export interface ZatcaInvoiceResult {
	success: boolean;
	clearedInvoice?: string;
	status?: string;
	warnings?: Array<{ code?: string; message?: string }>;
	errors?: Array<{ code?: string; message?: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Compliance CSID — first step (sends CSR + OTP)
// ═══════════════════════════════════════════════════════════════════════════

export async function requestComplianceCSID(
	csrBase64: string,
	otp: string,
): Promise<ZatcaCSIDResult> {
	// Diagnostic logging — decode the outer base64 so the checks reflect the
	// actual PEM content, not the wrapper.
	let decodedPem = "";
	try {
		decodedPem = Buffer.from(csrBase64, "base64").toString("utf-8");
	} catch {
		// keep empty — diagnostics will show that
	}
	console.log("[ZATCA] === Compliance CSID Request ===");
	console.log("[ZATCA] URL:", `${getBaseUrl()}${ZATCA_PATHS.complianceCSID}`);
	console.log("[ZATCA] Outer base64 length:", csrBase64.length);
	console.log("[ZATCA] Inner PEM has BEGIN:", decodedPem.includes("-----BEGIN CERTIFICATE REQUEST-----"));
	console.log("[ZATCA] Inner PEM has END:", decodedPem.includes("-----END CERTIFICATE REQUEST-----"));
	console.log("[ZATCA] Inner PEM has newlines:", /\n|\r/.test(decodedPem));
	console.log("[ZATCA] Inner PEM length:", decodedPem.length);
	console.log("[ZATCA] OTP:", otp);

	const result = await zatcaFetch(ZATCA_PATHS.complianceCSID, {
		method: "POST",
		body: { csr: csrBase64 },
		otp,
	});

	if (result.ok && result.data) {
		return {
			success: true,
			csid: result.data.binarySecurityToken,
			secret: result.data.secret,
			requestId: coerceRequestId(result.data.requestID),
			httpStatus: result.status,
		};
	}

	return {
		success: false,
		httpStatus: result.status,
		errors:
			result.data?.errors ||
			result.data?.validationResults?.errorMessages ||
			[{ message: result.data?.message || result.responseText?.substring(0, 300) || `HTTP ${result.status}` }],
	};
}

/**
 * ZATCA returns `requestID` as a JSON number (e.g. 1777912080975). The TS
 * surface and Prisma column are both `string`, so coerce at the API boundary
 * to keep every downstream caller (5 upsert sites) honest.
 */
function coerceRequestId(value: unknown): string | undefined {
	if (value === null || value === undefined) return undefined;
	return String(value);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Compliance Invoice Check — send test invoice
// ═══════════════════════════════════════════════════════════════════════════

export async function submitComplianceInvoice(
	signedXmlBase64: string,
	invoiceHash: string,
	uuid: string,
	csid: string,
	secret: string,
): Promise<ZatcaInvoiceResult> {
	const result = await zatcaFetch(ZATCA_PATHS.complianceInvoice, {
		method: "POST",
		body: { invoiceHash, uuid, invoice: signedXmlBase64 },
		auth: { username: csid, password: secret },
	});

	return {
		success: result.ok,
		status: result.data?.clearanceStatus || result.data?.reportingStatus,
		warnings: result.data?.validationResults?.warningMessages,
		errors: result.data?.validationResults?.errorMessages,
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Production CSID — after compliance check passes
// ═══════════════════════════════════════════════════════════════════════════

export async function requestProductionCSID(
	complianceRequestId: string,
	complianceCsid: string,
	complianceSecret: string,
): Promise<ZatcaCSIDResult> {
	const result = await zatcaFetch(ZATCA_PATHS.productionCSID, {
		method: "POST",
		body: { compliance_request_id: String(complianceRequestId) },
		auth: { username: complianceCsid, password: complianceSecret },
	});

	if (result.ok && result.data) {
		return {
			success: true,
			csid: result.data.binarySecurityToken,
			secret: result.data.secret,
			requestId: coerceRequestId(result.data.requestID),
			httpStatus: result.status,
		};
	}

	return {
		success: false,
		httpStatus: result.status,
		errors:
			result.data?.errors ||
			result.data?.validationResults?.errorMessages ||
			[{ message: result.data?.message || result.responseText?.substring(0, 300) || `HTTP ${result.status}` }],
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Clearance — B2B standard tax invoice
// ═══════════════════════════════════════════════════════════════════════════

export async function clearInvoice(
	signedXmlBase64: string,
	invoiceHash: string,
	uuid: string,
	csid: string,
	secret: string,
): Promise<ZatcaInvoiceResult> {
	const result = await zatcaFetch(ZATCA_PATHS.clearance, {
		method: "POST",
		body: { invoiceHash, uuid, invoice: signedXmlBase64 },
		auth: { username: csid, password: secret },
		clearanceStatus: "1",
	});

	return {
		success: result.ok,
		clearedInvoice: result.data?.clearedInvoice,
		status: result.data?.clearanceStatus,
		warnings: result.data?.validationResults?.warningMessages,
		errors: result.data?.validationResults?.errorMessages,
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Reporting — B2C simplified invoice
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 3b. Production CSID Renewal — PATCH (when certificate expires)
// ═══════════════════════════════════════════════════════════════════════════

export async function renewProductionCSID(
	csrBase64: string,
	otp: string,
	currentCsid: string,
	currentSecret: string,
): Promise<ZatcaCSIDResult> {
	const result = await zatcaFetch(ZATCA_PATHS.productionCSID, {
		method: "PATCH",
		body: { csr: csrBase64 },
		auth: { username: currentCsid, password: currentSecret },
		otp,
	});

	if (result.ok && result.data) {
		return {
			success: true,
			csid: result.data.binarySecurityToken,
			secret: result.data.secret,
			requestId: coerceRequestId(result.data.requestID),
			httpStatus: result.status,
		};
	}

	// 428 NOT_COMPLIANT — returns temporary compliance certificate
	if (result.status === 428 && result.data?.binarySecurityToken) {
		console.warn("[ZATCA API] Renewal returned 428 NOT_COMPLIANT — temporary certificate issued");
		return {
			success: false,
			httpStatus: result.status,
			csid: result.data.binarySecurityToken,
			secret: result.data.secret,
			requestId: coerceRequestId(result.data.requestID),
			errors: result.data?.errors || [{ message: "NOT_COMPLIANT — compliance required before renewal" }],
		};
	}

	return {
		success: false,
		httpStatus: result.status,
		errors:
			result.data?.errors ||
			result.data?.validationResults?.errorMessages ||
			[{ message: result.data?.message || result.responseText?.substring(0, 300) || `HTTP ${result.status}` }],
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Reporting — B2C simplified invoice
// ═══════════════════════════════════════════════════════════════════════════

export async function reportInvoice(
	signedXmlBase64: string,
	invoiceHash: string,
	uuid: string,
	csid: string,
	secret: string,
): Promise<ZatcaInvoiceResult> {
	const result = await zatcaFetch(ZATCA_PATHS.reporting, {
		method: "POST",
		body: { invoiceHash, uuid, invoice: signedXmlBase64 },
		auth: { username: csid, password: secret },
		clearanceStatus: "0",
	});

	return {
		success: result.ok,
		status: result.data?.reportingStatus,
		warnings: result.data?.validationResults?.warningMessages,
		errors: result.data?.validationResults?.errorMessages,
	};
}
