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
			content: { elements: getQuotationElements() },
			settings: { ...DEFAULT_TEMPLATE_SETTINGS },
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
			content: { elements: getInvoiceElements() },
			settings: { ...DEFAULT_TEMPLATE_SETTINGS },
		},
	});
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
