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
	const env = (process.env.ZATCA_ENVIRONMENT || "sandbox") as ZatcaEnvironment;
	return ZATCA_URLS[env] || ZATCA_URLS.sandbox;
}

// ─── Shared fetch helper ────────────────────────────────────────────────

interface ZatcaFetchOptions {
	method: "POST" | "GET";
	body?: unknown;
	auth?: { username: string; password: string };
	otp?: string;
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

	if (!response.ok) {
		console.error(`[ZATCA API] ${options.method} ${path} → ${response.status}`);
		console.error("[ZATCA API] Response body:", responseText.substring(0, 1000));
		console.error("[ZATCA API] Response headers:", JSON.stringify(
			Object.fromEntries(response.headers.entries()),
		));
	}

	return { ok: response.ok, status: response.status, data, responseText };
}

// ─── Result types ───────────────────────────────────────────────────────

export interface ZatcaCSIDResult {
	success: boolean;
	csid?: string;
	secret?: string;
	requestId?: string;
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
	// Diagnostic logging (helps debug sandbox rejections)
	console.log("[ZATCA] === Compliance CSID Request ===");
	console.log("[ZATCA] URL:", `${getBaseUrl()}${ZATCA_PATHS.complianceCSID}`);
	console.log("[ZATCA] CSR length:", csrBase64.length);
	console.log("[ZATCA] CSR first 80:", csrBase64.substring(0, 80));
	console.log("[ZATCA] Has PEM header:", csrBase64.includes("-----BEGIN"));
	console.log("[ZATCA] Has newlines:", csrBase64.includes("\n"));
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
			requestId: result.data.requestID,
		};
	}

	return {
		success: false,
		errors:
			result.data?.errors ||
			result.data?.validationResults?.errorMessages ||
			[{ message: result.data?.message || result.responseText?.substring(0, 300) || `HTTP ${result.status}` }],
	};
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
		body: { compliance_request_id: complianceRequestId },
		auth: { username: complianceCsid, password: complianceSecret },
	});

	if (result.ok && result.data) {
		return {
			success: true,
			csid: result.data.binarySecurityToken,
			secret: result.data.secret,
			requestId: result.data.requestID,
		};
	}

	return {
		success: false,
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
	});

	return {
		success: result.ok,
		status: result.data?.reportingStatus,
		warnings: result.data?.validationResults?.warningMessages,
		errors: result.data?.validationResults?.errorMessages,
	};
}
