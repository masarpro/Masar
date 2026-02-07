"use client";

import { useTranslations, useLocale } from "next-intl";
import { HeaderComponent } from "../components/HeaderComponent";
import { ClientInfoComponent } from "../components/ClientInfoComponent";
import { ItemsTableComponent } from "../components/ItemsTableComponent";
import { TotalsComponent } from "../components/TotalsComponent";
import { TermsComponent } from "../components/TermsComponent";
import { SignatureComponent } from "../components/SignatureComponent";
import { BankDetailsComponent } from "../components/BankDetailsComponent";
import { QRCodeElement } from "./elements/QRCodeElement";
import { FooterElement } from "./elements/FooterElement";
import type { TemplateElement } from "../TemplateCanvas";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface QuotationData {
	quotationNo: string;
	createdAt: Date | string;
	validUntil: Date | string;
	status: string;
	clientName: string;
	clientCompany?: string;
	clientPhone?: string;
	clientEmail?: string;
	clientAddress?: string;
	clientTaxNumber?: string;
	items: Array<{
		description: string;
		quantity: number;
		unit?: string;
		unitPrice: number;
		totalPrice: number;
	}>;
	subtotal: number;
	discountPercent: number;
	discountAmount: number;
	vatPercent: number;
	vatAmount: number;
	totalAmount: number;
	paymentTerms?: string;
	deliveryTerms?: string;
	warrantyTerms?: string;
	notes?: string;
}

export interface InvoiceData {
	invoiceNo: string;
	issueDate: Date | string;
	dueDate: Date | string;
	status: string;
	invoiceType: string;
	clientName: string;
	clientCompany?: string;
	clientPhone?: string;
	clientEmail?: string;
	clientAddress?: string;
	clientTaxNumber?: string;
	items: Array<{
		description: string;
		quantity: number;
		unit?: string;
		unitPrice: number;
		totalPrice: number;
	}>;
	subtotal: number;
	discountPercent: number;
	discountAmount: number;
	vatPercent: number;
	vatAmount: number;
	totalAmount: number;
	paidAmount?: number;
	paymentTerms?: string;
	notes?: string;
	sellerTaxNumber?: string;
}

export interface OrganizationData {
	name?: string;
	nameAr?: string;
	nameEn?: string;
	logo?: string;
	address?: string;
	addressAr?: string;
	addressEn?: string;
	phone?: string;
	email?: string;
	website?: string;
	taxNumber?: string;
	commercialReg?: string;
	// Bank details
	bankName?: string;
	bankNameEn?: string;
	accountName?: string;
	iban?: string;
	accountNumber?: string;
	swiftCode?: string;
	// Print settings
	headerText?: string;
	footerText?: string;
	thankYouMessage?: string;
}

export interface TemplateConfig {
	elements?: TemplateElement[];
	settings?: {
		backgroundColor?: string;
		primaryColor?: string;
		fontFamily?: string;
		fontSize?: string;
		vatPercent?: number;
		currency?: string;
	};
}

interface TemplateRendererProps {
	data: QuotationData | InvoiceData;
	template: TemplateConfig;
	organization?: OrganizationData;
	documentType?: "quotation" | "invoice";
	className?: string;
	// Interactive mode props
	interactive?: boolean;
	selectedElementId?: string | null;
	onElementClick?: (elementId: string | null) => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Check if data is Invoice
// ═══════════════════════════════════════════════════════════════════════════

function isInvoice(data: QuotationData | InvoiceData): data is InvoiceData {
	return "invoiceNo" in data;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATE RENDERER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function TemplateRenderer({
	data,
	template,
	organization,
	documentType,
	className = "",
	interactive = false,
	selectedElementId = null,
	onElementClick,
}: TemplateRendererProps) {
	const t = useTranslations();
	const locale = useLocale();

	// Extract template configuration
	const elements = template?.elements || [];
	const settings = template?.settings || {};

	// Get settings with defaults
	const primaryColor = settings.primaryColor || "#3b82f6";
	const backgroundColor = settings.backgroundColor || "#ffffff";
	const fontFamily = settings.fontFamily || "inherit";
	const currency = settings.currency || "SAR";
	const vatPercent = settings.vatPercent || data.vatPercent || 15;

	// Determine document type
	const docType = documentType || (isInvoice(data) ? "invoice" : "quotation");

	// Sort enabled elements by order
	const sortedElements = [...elements]
		.filter((el) => el.enabled)
		.sort((a, b) => a.order - b.order);

	// Prepare company info for header
	const companyInfo = {
		name: organization?.name || organization?.nameAr || "",
		nameAr: organization?.nameAr || organization?.name,
		nameEn: organization?.nameEn,
		logo: organization?.logo,
		address: locale === "ar"
			? organization?.addressAr || organization?.address
			: organization?.addressEn || organization?.address,
		addressAr: organization?.addressAr || organization?.address,
		addressEn: organization?.addressEn,
		phone: organization?.phone,
		email: organization?.email,
		taxNumber: organization?.taxNumber,
	};

	// Prepare client info
	const clientInfo = {
		name: data.clientName,
		company: data.clientCompany,
		phone: data.clientPhone,
		email: data.clientEmail,
		address: data.clientAddress,
		taxNumber: data.clientTaxNumber,
	};

	// Prepare document info
	const documentInfo = {
		number: isInvoice(data) ? data.invoiceNo : data.quotationNo,
		date: isInvoice(data)
			? new Date(data.issueDate).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")
			: new Date(data.createdAt).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US"),
		validUntil: isInvoice(data)
			? new Date(data.dueDate).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US")
			: new Date(data.validUntil).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US"),
	};

	// Prepare items
	const items = data.items.map((item) => ({
		description: item.description,
		quantity: item.quantity,
		unit: item.unit || t("finance.templates.preview.unit"),
		unitPrice: item.unitPrice,
		totalPrice: item.totalPrice,
	}));

	// Prepare totals
	const totals = {
		subtotal: Number(data.subtotal),
		discountPercent: Number(data.discountPercent),
		discountAmount: Number(data.discountAmount),
		vatPercent: Number(data.vatPercent) || vatPercent,
		vatAmount: Number(data.vatAmount),
		total: Number(data.totalAmount),
	};

	// Prepare terms
	const terms = {
		paymentTerms: data.paymentTerms,
		deliveryTerms: !isInvoice(data) ? (data as QuotationData).deliveryTerms : undefined,
		warrantyTerms: !isInvoice(data) ? (data as QuotationData).warrantyTerms : undefined,
	};

	// Bank details
	const bankDetails = {
		bankName: locale === "ar" ? organization?.bankName : organization?.bankNameEn || organization?.bankName,
		accountName: organization?.accountName,
		iban: organization?.iban,
		accountNumber: organization?.accountNumber,
		swiftCode: organization?.swiftCode,
	};

	// Render individual element
	const renderElement = (element: TemplateElement) => {
		const elementSettings = element.settings || {};

		switch (element.type) {
			case "header":
				return (
					<HeaderComponent
						key={element.id}
						settings={elementSettings as any}
						companyInfo={companyInfo}
						documentType={docType}
						primaryColor={primaryColor}
					/>
				);

			case "clientInfo":
				return (
					<ClientInfoComponent
						key={element.id}
						settings={elementSettings as any}
						clientInfo={clientInfo}
						documentInfo={documentInfo}
						primaryColor={primaryColor}
					/>
				);

			case "itemsTable":
				return (
					<ItemsTableComponent
						key={element.id}
						settings={elementSettings as any}
						items={items}
						primaryColor={primaryColor}
						currency={currency}
					/>
				);

			case "totals":
				return (
					<TotalsComponent
						key={element.id}
						settings={elementSettings as any}
						totals={totals}
						primaryColor={primaryColor}
						currency={currency}
					/>
				);

			case "terms":
				return (
					<TermsComponent
						key={element.id}
						settings={elementSettings as any}
						terms={terms}
						primaryColor={primaryColor}
					/>
				);

			case "signature":
				return (
					<SignatureComponent
						key={element.id}
						settings={elementSettings as any}
						primaryColor={primaryColor}
					/>
				);

			case "bankDetails":
				return (
					<BankDetailsComponent
						key={element.id}
						settings={elementSettings as any}
						bankDetails={bankDetails}
						primaryColor={primaryColor}
					/>
				);

			case "qrCode":
				return (
					<QRCodeElement
						key={element.id}
						settings={elementSettings as any}
						data={data}
						organization={organization}
						primaryColor={primaryColor}
					/>
				);

			case "footer":
				return (
					<FooterElement
						key={element.id}
						settings={elementSettings as any}
						organization={organization}
						primaryColor={primaryColor}
					/>
				);

			case "text":
				return (
					<div key={element.id} className="py-4">
						<p className="text-slate-600">
							{(elementSettings as { content?: string }).content || ""}
						</p>
					</div>
				);

			case "image":
				const imageUrl = (elementSettings as { imageUrl?: string }).imageUrl;
				if (!imageUrl) {
					return (
						<div key={element.id} className="py-4 flex justify-center">
							<div className="w-48 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
								{t("finance.templates.editor.elementTypes.image")}
							</div>
						</div>
					);
				}
				return (
					<div key={element.id} className="py-4 flex justify-center">
						<img src={imageUrl} alt="" className="max-w-full h-auto rounded-lg" />
					</div>
				);

			default:
				return null;
		}
	};

	// Default elements if template is empty
	const defaultElements = sortedElements.length > 0 ? sortedElements : [
		{ id: "1", type: "header", order: 1, enabled: true, settings: {} },
		{ id: "2", type: "clientInfo", order: 2, enabled: true, settings: {} },
		{ id: "3", type: "itemsTable", order: 3, enabled: true, settings: {} },
		{ id: "4", type: "totals", order: 4, enabled: true, settings: {} },
		{ id: "5", type: "terms", order: 5, enabled: true, settings: {} },
		{ id: "6", type: "bankDetails", order: 6, enabled: true, settings: {} },
		{ id: "7", type: "signature", order: 7, enabled: true, settings: {} },
	] as TemplateElement[];

	// Wrap element with interactive container if needed
	const renderInteractiveElement = (element: TemplateElement) => {
		const content = renderElement(element);
		if (!interactive) return content;

		const isSelected = selectedElementId === element.id;
		return (
			<div
				key={element.id}
				className={`relative cursor-pointer transition-all rounded-lg ${
					isSelected
						? "ring-2 ring-primary ring-offset-2 bg-primary/5"
						: "hover:ring-1 hover:ring-primary/50"
				}`}
				onClick={(e) => {
					e.stopPropagation();
					onElementClick?.(element.id);
				}}
			>
				{/* Selection indicator */}
				{isSelected && (
					<div className="absolute -top-2 start-2 bg-primary text-white text-xs px-2 py-0.5 rounded-full z-10">
						{t(`finance.templates.editor.elementTypes.${element.type}`)}
					</div>
				)}
				{content}
			</div>
		);
	};

	return (
		<div
			className={`p-8 ${className}`}
			style={{
				backgroundColor,
				fontFamily,
			}}
			dir={locale === "ar" ? "rtl" : "ltr"}
			onClick={() => interactive && onElementClick?.(null)}
		>
			{defaultElements.map(renderInteractiveElement)}

			{/* Notes section (if present) */}
			{data.notes && (
				<div className="mt-4 pt-4 border-t border-slate-200">
					<h4 className="text-sm font-medium text-slate-700 mb-2">
						{t("finance.quotations.notes")}:
					</h4>
					<p className="text-sm text-slate-600 whitespace-pre-line">{data.notes}</p>
				</div>
			)}

			{/* Thank you message */}
			{organization?.thankYouMessage && (
				<div className="mt-6 text-center">
					<p className="text-sm text-slate-600">{organization.thankYouMessage}</p>
				</div>
			)}
		</div>
	);
}
