import { db } from "../client";
import type { FinanceTemplateType } from "../generated/client";

/**
 * Template element interface
 */
interface TemplateElement {
	id: string;
	type: string;
	enabled: boolean;
	order: number;
	settings: Record<string, unknown>;
}

/**
 * Template settings interface
 */
interface TemplateSettings {
	backgroundColor: string;
	primaryColor: string;
	fontFamily: string;
	fontSize: string;
	lineHeight: string;
	pageSize: "A4" | "Letter";
	orientation: "portrait" | "landscape";
	margins: string;
	vatPercent: number;
	currency: string;
}

/**
 * Generate unique ID for template elements
 */
const generateId = () =>
	`el_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * Default settings for all templates
 */
const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
	backgroundColor: "#ffffff",
	primaryColor: "#3b82f6",
	fontFamily: "Cairo",
	fontSize: "14px",
	lineHeight: "1.6",
	pageSize: "A4",
	orientation: "portrait",
	margins: "20mm",
	vatPercent: 15,
	currency: "SAR",
};

/**
 * Get professional quotation template elements
 */
function getQuotationElements(): TemplateElement[] {
	return [
		{
			id: generateId(),
			type: "header",
			enabled: true,
			order: 1,
			settings: {
				showLogo: true,
				showCompanyName: true,
				showAddress: true,
				showBilingualName: true,
				layout: "modern",
			},
		},
		{
			id: generateId(),
			type: "clientInfo",
			enabled: true,
			order: 2,
			settings: {
				showTaxNumber: true,
				showEmail: true,
				showPhone: true,
				showCompanyName: true,
			},
		},
		{
			id: generateId(),
			type: "itemsTable",
			enabled: true,
			order: 3,
			settings: {
				showQuantity: true,
				showUnit: true,
				showUnitPrice: true,
				showRowNumbers: true,
				alternatingColors: true,
			},
		},
		{
			id: generateId(),
			type: "totals",
			enabled: true,
			order: 4,
			settings: {
				showDiscount: true,
				showVat: true,
				showAmountInWords: true,
				highlightTotal: true,
			},
		},
		{
			id: generateId(),
			type: "terms",
			enabled: true,
			order: 5,
			settings: {
				showPaymentTerms: true,
				showDeliveryTerms: true,
				showWarrantyTerms: true,
				showValidityNote: true,
				validityDays: 30,
			},
		},
		{
			id: generateId(),
			type: "signature",
			enabled: true,
			order: 6,
			settings: {
				showDate: true,
				showStampArea: true,
				twoColumns: true,
			},
		},
		{
			id: generateId(),
			type: "bankDetails",
			enabled: true,
			order: 7,
			settings: {
				showBankName: true,
				showIban: true,
				showAccountName: true,
				showSwiftCode: false,
			},
		},
		{
			id: generateId(),
			type: "qrCode",
			enabled: true,
			order: 8,
			settings: {
				size: "medium",
				showZatcaCompliance: true,
			},
		},
		{
			id: generateId(),
			type: "footer",
			enabled: true,
			order: 9,
			settings: {
				showThankYouMessage: true,
				showYear: true,
			},
		},
	];
}

/**
 * Get professional invoice template elements
 */
function getInvoiceElements(): TemplateElement[] {
	return [
		{
			id: generateId(),
			type: "header",
			enabled: true,
			order: 1,
			settings: {
				showLogo: true,
				showCompanyName: true,
				showAddress: true,
				showBilingualName: true,
				layout: "modern",
			},
		},
		{
			id: generateId(),
			type: "clientInfo",
			enabled: true,
			order: 2,
			settings: {
				showTaxNumber: true,
				showEmail: true,
				showPhone: true,
				showCompanyName: true,
			},
		},
		{
			id: generateId(),
			type: "itemsTable",
			enabled: true,
			order: 3,
			settings: {
				showQuantity: true,
				showUnit: true,
				showUnitPrice: true,
				showRowNumbers: true,
				alternatingColors: true,
			},
		},
		{
			id: generateId(),
			type: "totals",
			enabled: true,
			order: 4,
			settings: {
				showDiscount: true,
				showVat: true,
				showAmountInWords: true,
				highlightTotal: true,
			},
		},
		{
			id: generateId(),
			type: "bankDetails",
			enabled: true,
			order: 5,
			settings: {
				showBankName: true,
				showIban: true,
				showAccountName: true,
				showSwiftCode: false,
			},
		},
		{
			id: generateId(),
			type: "terms",
			enabled: true,
			order: 6,
			settings: {
				showPaymentTerms: true,
				showDeliveryTerms: false,
				showWarrantyTerms: false,
			},
		},
		{
			id: generateId(),
			type: "signature",
			enabled: true,
			order: 7,
			settings: {
				showDate: true,
				showStampArea: true,
				twoColumns: true,
			},
		},
		{
			id: generateId(),
			type: "qrCode",
			enabled: true,
			order: 8,
			settings: {
				size: "medium",
				showZatcaCompliance: true,
			},
		},
		{
			id: generateId(),
			type: "footer",
			enabled: true,
			order: 9,
			settings: {
				showThankYouMessage: true,
				showYear: true,
			},
		},
	];
}

/**
 * Create default finance templates for an organization
 * This function should be called after creating a new organization
 *
 * @param organizationId - The organization ID
 * @param createdById - The user ID who created the organization
 */
export async function createDefaultTemplatesForOrganization(
	organizationId: string,
	createdById: string,
): Promise<void> {
	// Check if templates already exist for this organization
	const existingTemplates = await db.financeTemplate.count({
		where: { organizationId },
	});

	// Skip if templates already exist
	if (existingTemplates > 0) {
		return;
	}

	// Create professional quotation template
	await db.financeTemplate.create({
		data: {
			organizationId,
			createdById,
			name: "قالب عرض سعر مهني",
			description: "قالب احترافي ثنائي اللغة مناسب للأعمال الدولية",
			templateType: "QUOTATION" as FinanceTemplateType,
			isDefault: true,
			content: { elements: getQuotationElements() } as any,
			settings: { ...DEFAULT_TEMPLATE_SETTINGS } as any,
		},
	});

	// Create professional invoice template
	await db.financeTemplate.create({
		data: {
			organizationId,
			createdById,
			name: "قالب فاتورة مهني",
			description:
				"قالب فاتورة احترافي متوافق مع متطلبات هيئة الزكاة والضريبة",
			templateType: "INVOICE" as FinanceTemplateType,
			isDefault: true,
			content: { elements: getInvoiceElements() } as any,
			settings: { ...DEFAULT_TEMPLATE_SETTINGS } as any,
		},
	});

	// Create additional invoice templates
	const additionalTemplates = getAdditionalInvoiceTemplates();
	for (const tmpl of additionalTemplates) {
		await db.financeTemplate.create({
			data: {
				organizationId,
				createdById,
				name: tmpl.name,
				description: tmpl.description,
				templateType: "INVOICE" as FinanceTemplateType,
				isDefault: false,
				content: { elements: tmpl.elements } as any,
				settings: tmpl.settings as any,
			},
		});
	}
}

/**
 * Seed additional invoice templates for an existing organization
 * (Only adds templates that don't already exist by name)
 */
export async function seedAdditionalInvoiceTemplates(
	organizationId: string,
	createdById: string,
): Promise<number> {
	const additionalTemplates = getAdditionalInvoiceTemplates();
	let created = 0;

	for (const tmpl of additionalTemplates) {
		const existing = await db.financeTemplate.findFirst({
			where: {
				organizationId,
				name: tmpl.name,
				templateType: "INVOICE",
			},
		});

		if (!existing) {
			await db.financeTemplate.create({
				data: {
					organizationId,
					createdById,
					name: tmpl.name,
					description: tmpl.description,
					templateType: "INVOICE" as FinanceTemplateType,
					isDefault: false,
					content: { elements: tmpl.elements } as any,
					settings: tmpl.settings as any,
				},
			});
			created++;
		}
	}

	return created;
}

/**
 * Create default templates for all organizations that don't have any
 * This is useful for migrating existing organizations
 */
export async function createDefaultTemplatesForAllOrganizations(): Promise<{
	created: number;
	skipped: number;
}> {
	// Get all organizations
	const organizations = await db.organization.findMany({
		select: {
			id: true,
			members: {
				where: { role: "owner" },
				take: 1,
				select: { userId: true },
			},
		},
	});

	let created = 0;
	let skipped = 0;

	for (const org of organizations) {
		// Check if organization has templates
		const existingCount = await db.financeTemplate.count({
			where: { organizationId: org.id },
		});

		if (existingCount > 0) {
			skipped++;
			continue;
		}

		// Find an owner or the first member to use as createdBy
		const createdById = org.members[0]?.userId;
		if (!createdById) {
			skipped++;
			continue;
		}

		try {
			await createDefaultTemplatesForOrganization(org.id, createdById);
			created++;
		} catch {
			skipped++;
		}
	}

	return { created, skipped };
}

/**
 * Seed additional invoice templates for ALL organizations.
 * Calls seedAdditionalInvoiceTemplates for each org (idempotent — checks by name).
 */
export async function seedAdditionalInvoiceTemplatesForAll(): Promise<{
	seeded: number;
	skipped: number;
	totalCreated: number;
}> {
	const organizations = await db.organization.findMany({
		select: {
			id: true,
			members: {
				where: { role: "owner" },
				take: 1,
				select: { userId: true },
			},
		},
	});

	let seeded = 0;
	let skipped = 0;
	let totalCreated = 0;

	for (const org of organizations) {
		const createdById = org.members[0]?.userId;
		if (!createdById) {
			skipped++;
			continue;
		}

		try {
			const created = await seedAdditionalInvoiceTemplates(
				org.id,
				createdById,
			);
			if (created > 0) {
				seeded++;
				totalCreated += created;
			} else {
				skipped++;
			}
		} catch {
			skipped++;
		}
	}

	return { seeded, skipped, totalCreated };
}

// ═══════════════════════════════════════════════════════════════════════════
// ADDITIONAL INVOICE TEMPLATE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

interface AdditionalTemplate {
	name: string;
	description: string;
	elements: TemplateElement[];
	settings: Record<string, unknown>;
}

function getAdditionalInvoiceTemplates(): AdditionalTemplate[] {
	return [
		{
			name: "الكلاسيكي الفاخر",
			description:
				"تصميم أنيق بأسلوب كلاسيكي مع لمسات ذهبية — مثالي للشركات التي تريد إظهار الفخامة والاحترافية",
			settings: {
				backgroundColor: "#ffffff",
				primaryColor: "#1a1a2e",
				secondaryColor: "#c9a84c",
				fontFamily: "Cairo",
				fontSize: "14px",
				lineHeight: "1.6",
				pageSize: "A4",
				orientation: "portrait",
				margins: "20mm",
				vatPercent: 15,
				currency: "SAR",
			},
			elements: [
				{ id: "el_classic_header", type: "header", enabled: true, order: 1, settings: { showLogo: true, showCompanyName: true, showAddress: true, showBilingualName: true, showTaxNumber: true, showCrNumber: true, showPhone: true, showEmail: true, layout: "classic", accentStyle: "gradient-line", titleSize: "large", subtitleText: "TAX INVOICE", subtitleStyle: "gold-caps" } },
				{ id: "el_classic_invoicemeta", type: "clientInfo", enabled: true, order: 2, settings: { showInvoiceNumber: true, showInvoiceType: true, showIssueDate: true, showDueDate: true, showStatus: true, showTaxNumber: true, showEmail: true, showPhone: true, showCompanyName: true, showAddress: true, layout: "bordered-right", clientBackground: "#f8f7f4", borderColor: "#c9a84c", labelStyle: "gold-small" } },
				{ id: "el_classic_items", type: "itemsTable", enabled: true, order: 3, settings: { showRowNumbers: true, showQuantity: true, showUnit: true, showUnitPrice: true, showTotal: true, alternatingColors: true, headerBackground: "#1a1a2e", headerTextColor: "#ffffff", alternateRowColor: "#fafaf8", rowNumberColor: "#c9a84c", borderRadius: "4px" } },
				{ id: "el_classic_totals", type: "totals", enabled: true, order: 4, settings: { showDiscount: true, showVat: true, showAmountInWords: false, highlightTotal: true, totalBackground: "#1a1a2e", totalTextColor: "#ffffff", totalAmountColor: "#c9a84c", showPaidAmount: true, showRemainingAmount: true, paidColor: "#16a34a", remainingColor: "#dc2626", layout: "left-aligned", width: "220px" } },
				{ id: "el_classic_bank", type: "bankDetails", enabled: true, order: 5, settings: { showBankName: true, showIban: true, showAccountName: true, layout: "card", background: "#f8f7f4", borderRadius: "6px" } },
				{ id: "el_classic_terms", type: "terms", enabled: true, order: 6, settings: { showPaymentTerms: true, showDeliveryTerms: false, showWarrantyTerms: false, showNotes: true, layout: "card", background: "#f8f7f4", borderRadius: "6px" } },
				{ id: "el_classic_qr", type: "qrCode", enabled: true, order: 7, settings: { size: "medium", showZatcaCompliance: true, showLabel: true, labelText: "رمز الفاتورة الضريبية", borderRadius: "6px", background: "#f0f0f0" } },
				{ id: "el_classic_signature", type: "signature", enabled: true, order: 8, settings: { showDate: false, showStampArea: true, twoColumns: false, lineColor: "#1a1a2e", labelAr: "التوقيع والختم" } },
				{ id: "el_classic_footer", type: "footer", enabled: true, order: 9, settings: { showThankYouMessage: false, showYear: false, showCompanyInfo: true, showPageNumber: true, accentStyle: "gradient-line", textColor: "#aaaaaa" } },
			],
		},
		{
			name: "العصري البسيط",
			description:
				"تصميم عصري نظيف مع شريط جانبي برتقالي — مثالي للشركات العصرية",
			settings: {
				backgroundColor: "#ffffff",
				primaryColor: "#f97316",
				secondaryColor: "#0f172a",
				fontFamily: "Cairo",
				fontSize: "14px",
				lineHeight: "1.6",
				pageSize: "A4",
				orientation: "portrait",
				margins: "20mm",
				vatPercent: 15,
				currency: "SAR",
			},
			elements: [
				{ id: "el_modern_header", type: "header", enabled: true, order: 1, settings: { showLogo: true, showCompanyName: true, showAddress: true, showBilingualName: true, showTaxNumber: true, showPhone: true, showEmail: true, layout: "modern", accentStyle: "sidebar", sidebarWidth: "6px", sidebarGradient: "linear-gradient(180deg, #f97316, #ea580c)", titleSize: "xlarge", showTypeBadge: true, typeBadgeBackground: "#fff7ed", typeBadgeColor: "#ea580c" } },
				{ id: "el_modern_invoicemeta", type: "clientInfo", enabled: true, order: 2, settings: { showInvoiceNumber: true, showIssueDate: true, showDueDate: true, showTaxNumber: true, showEmail: false, showPhone: true, showCompanyName: true, showAddress: true, layout: "two-cards", invoiceCardBackground: "#fafafa", clientCardBackground: "#fff7ed", clientCardBorder: "3px solid #f97316", borderSide: "right", labelStyle: "orange-uppercase", borderRadius: "8px" } },
				{ id: "el_modern_items", type: "itemsTable", enabled: true, order: 3, settings: { showRowNumbers: true, showQuantity: true, showUnit: true, showUnitPrice: true, showTotal: true, alternatingColors: true, headerStyle: "underline", headerBorderColor: "#f97316", headerBorderWidth: "2px", headerTextColor: "#94a3b8", alternateRowColor: "#fafafa", rowNumberStyle: "circle", rowNumberBackground: "#fff7ed", rowNumberColor: "#f97316", borderSpacing: "3px" } },
				{ id: "el_modern_totals", type: "totals", enabled: true, order: 4, settings: { showDiscount: true, showVat: true, showAmountInWords: false, highlightTotal: true, layout: "card", background: "#fafafa", borderRadius: "8px", totalBorderTop: "2px solid #f97316", totalFontSize: "13px", totalColor: "#f97316", showPaidAmount: true, showRemainingAmount: true, paidColor: "#16a34a", remainingColor: "#dc2626", width: "230px" } },
				{ id: "el_modern_bank", type: "bankDetails", enabled: true, order: 5, settings: { showBankName: true, showIban: true, showAccountName: false, layout: "bordered", borderColor: "#f0f0f0", borderRadius: "6px" } },
				{ id: "el_modern_terms", type: "terms", enabled: true, order: 6, settings: { showPaymentTerms: true, showDeliveryTerms: false, showWarrantyTerms: false, showNotes: false, layout: "bordered", borderColor: "#f0f0f0", borderRadius: "6px" } },
				{ id: "el_modern_qr", type: "qrCode", enabled: true, order: 7, settings: { size: "small", showZatcaCompliance: false, borderRadius: "8px", borderStyle: "dashed", borderColor: "#e0e0e0", background: "#fafafa" } },
				{ id: "el_modern_footer", type: "footer", enabled: true, order: 8, settings: { showThankYouMessage: true, thankYouText: "شكراً لتعاملكم معنا", showYear: false, showCompanyInfo: true, showPhone: true, showEmail: true, accentStyle: "bottom-bar", barColor: "#f97316", barHeight: "3px", textColor: "#cbd5e1", textAlign: "center" } },
			],
		},
		{
			name: "الاحترافي الجريء",
			description:
				"تصميم جريء واحترافي مع هيدر داكن ولمسات خضراء — مثالي لشركات المقاولات",
			settings: {
				backgroundColor: "#ffffff",
				primaryColor: "#10b981",
				secondaryColor: "#0f172a",
				fontFamily: "Cairo",
				fontSize: "14px",
				lineHeight: "1.6",
				pageSize: "A4",
				orientation: "portrait",
				margins: "20mm",
				vatPercent: 15,
				currency: "SAR",
			},
			elements: [
				{ id: "el_bold_header", type: "header", enabled: true, order: 1, settings: { showLogo: true, showCompanyName: true, showAddress: true, showBilingualName: true, showTaxNumber: true, showPhone: true, layout: "dark-block", blockBackground: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", blockTextColor: "#ffffff", titleSize: "xlarge", subtitleText: "TAX INVOICE", subtitleColor: "#10b981", showInvoiceNumberBadge: true, badgeBackground: "rgba(16,185,129,0.15)", badgeColor: "#10b981" } },
				{ id: "el_bold_metabar", type: "text", enabled: true, order: 2, settings: { layout: "info-bar", background: "#10b981", textColor: "#ffffff", fontSize: "9px", fields: ["invoiceType", "issueDate", "dueDate"], dividerStyle: "vertical-line", dividerColor: "rgba(255,255,255,0.3)", padding: "8px 28px" } },
				{ id: "el_bold_client", type: "clientInfo", enabled: true, order: 3, settings: { showTaxNumber: true, showEmail: true, showPhone: true, showCompanyName: true, showAddress: true, layout: "highlight-card", background: "#f0fdf4", borderColor: "#bbf7d0", borderRadius: "8px", labelStyle: "green-dot", labelColor: "#10b981" } },
				{ id: "el_bold_items", type: "itemsTable", enabled: true, order: 4, settings: { showRowNumbers: true, showQuantity: true, showUnit: true, showUnitPrice: true, showTotal: true, alternatingColors: false, headerBackground: "#0f172a", headerTextColor: "#ffffff", rowNumberColor: "#10b981", rowBorderColor: "#f1f5f9", headerRowNumberColor: "#10b981", borderRadius: "6px" } },
				{ id: "el_bold_totals", type: "totals", enabled: true, order: 5, settings: { showDiscount: true, showVat: true, showAmountInWords: false, highlightTotal: true, layout: "card", background: "#f8fafc", borderColor: "#e2e8f0", borderRadius: "10px", totalDivider: "gradient", totalDividerGradient: "linear-gradient(90deg, #10b981, #059669)", totalFontSize: "13px", totalColor: "#10b981", showPaidAmount: true, showRemainingAmount: true, paidColor: "#16a34a", remainingColor: "#ef4444", width: "220px" } },
				{ id: "el_bold_bank", type: "bankDetails", enabled: true, order: 6, settings: { showBankName: true, showIban: true, showAccountName: false, layout: "inline", fontSize: "8px" } },
				{ id: "el_bold_qr", type: "qrCode", enabled: true, order: 7, settings: { size: "medium", showZatcaCompliance: true, borderRadius: "10px", borderColor: "#e2e8f0", background: "#f8fafc", position: "left" } },
				{ id: "el_bold_terms", type: "terms", enabled: true, order: 8, settings: { showPaymentTerms: true, showNotes: true, layout: "card", background: "#f8fafc", borderRadius: "6px" } },
				{ id: "el_bold_signature", type: "signature", enabled: true, order: 9, settings: { showDate: false, showStampArea: true, twoColumns: false, lineColor: "#0f172a", lineWidth: "2px", labelAr: "التوقيع والختم", labelEn: "Authorized Signature", showBilingualLabel: true } },
				{ id: "el_bold_footer", type: "footer", enabled: true, order: 10, settings: { showThankYouMessage: false, showYear: false, showCompanyInfo: true, showPageNumber: true, layout: "dark-bar", background: "#0f172a", textColor: "#64748b", pageNumberColor: "#10b981" } },
			],
		},
	];
}
