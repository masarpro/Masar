"use client";

import { Fragment, memo, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { HeaderComponent } from "../components/HeaderComponent";
import { DocumentMetaComponent } from "../components/DocumentMetaComponent";
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
	introduction?: string;
	termsAndConditions?: string;
	contentBlocks?: Array<{
		title: string;
		content: string;
		position: "BEFORE_TABLE" | "AFTER_TABLE";
	}>;
}

export interface InvoiceData {
	invoiceNo: string;
	issueDate: Date | string;
	dueDate: Date | string;
	issuedAt?: Date | string | null;
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
	remainingAmount?: number;
	paymentTerms?: string;
	notes?: string;
	sellerTaxNumber?: string;
	// ZATCA
	qrCode?: string | null;
	zatcaUuid?: string | null;
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

export interface BankData {
	bankName?: string | null;
	accountName?: string | null;
	iban?: string | null;
	accountNumber?: string | null;
	swiftCode?: string | null;
}

export interface TemplateConfig {
	elements?: TemplateElement[];
	settings?: {
		backgroundColor?: string;
		primaryColor?: string;
		secondaryColor?: string;
		fontFamily?: string;
		fontSize?: string;
		vatPercent?: number;
		currency?: string;
		logoSize?: number;
		logoBackground?: boolean;
		headerImage?: string;
		footerImage?: string;
		showWatermark?: boolean;
		watermarkOpacity?: number;
	};
}

// بيانات مخصصة للعناصر القابلة للتعديل
export interface CustomElementData {
	[elementId: string]: {
		content?: string;
		label?: string;
		[key: string]: unknown;
	};
}

interface TemplateRendererProps {
	data: QuotationData | InvoiceData;
	template: TemplateConfig;
	organization?: OrganizationData;
	documentType?: "quotation" | "invoice";
	className?: string;
	// بيانات مخصصة للعناصر (مثل النص الحر)
	customElementData?: CustomElementData;
	// Bank accounts for bank selection
	banks?: Array<{ id: string; name: string; bankName?: string | null; iban?: string | null; accountNumber?: string | null }>;
	// Interactive mode props
	interactive?: boolean;
	selectedElementId?: string | null;
	onElementClick?: (elementId: string | null) => void;
	// Additional content rendered after body (inside print table layout)
	afterBody?: React.ReactNode;
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

export const TemplateRenderer = memo(function TemplateRenderer({
	data,
	template,
	organization,
	documentType,
	className = "",
	customElementData = {},
	banks,
	interactive = false,
	selectedElementId = null,
	onElementClick,
	afterBody,
}: TemplateRendererProps) {
	const t = useTranslations();
	const locale = useLocale();

	// Extract template configuration
	const elements = template?.elements || [];
	const settings = template?.settings || {};

	// Helper: الحصول على محتوى العنصر (من البيانات المخصصة أو الإعدادات الافتراضية)
	const getElementContent = (elementId: string, defaultContent?: string) => {
		return customElementData[elementId]?.content ?? defaultContent ?? "";
	};

	// Get settings with defaults
	const primaryColor = settings.primaryColor || "#3b82f6";
	const secondaryColor = settings.secondaryColor;
	const backgroundColor = settings.backgroundColor || "#ffffff";
	const fontFamily = settings.fontFamily || "inherit";
	const currency = settings.currency || "SAR";
	const vatPercent = settings.vatPercent || data.vatPercent || 15;
	const logoSize = settings.logoSize ?? 64;
	const logoBackground = false;
	const headerImage = settings.headerImage;
	const footerImage = settings.footerImage;
	const showWatermark = settings.showWatermark;
	const watermarkOpacity = settings.watermarkOpacity ?? 5;

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
		commercialReg: (organization as any)?.commercialReg,
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
		invoiceType: isInvoice(data) ? data.invoiceType : undefined,
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
	const paidAmount = isInvoice(data) ? Number(data.paidAmount ?? 0) : 0;
	const totals = {
		subtotal: Number(data.subtotal),
		discountPercent: Number(data.discountPercent),
		discountAmount: Number(data.discountAmount),
		vatPercent: Number(data.vatPercent) || vatPercent,
		vatAmount: Number(data.vatAmount),
		total: Number(data.totalAmount),
		paidAmount,
		remainingAmount: Number(data.totalAmount) - paidAmount,
	};

	// Prepare terms
	const terms = {
		paymentTerms: data.paymentTerms,
		deliveryTerms: !isInvoice(data) ? (data as QuotationData).deliveryTerms : undefined,
		warrantyTerms: !isInvoice(data) ? (data as QuotationData).warrantyTerms : undefined,
	};

	// Bank details — use selected bank if available, otherwise fall back to organization defaults
	const getBankDetails = () => {
		// Check if any bankDetails element has a selectedBankId
		const bankElement = elements.find((el) => el.type === "bankDetails" && el.enabled);
		const selectedBankId = bankElement?.settings?.selectedBankId as string | undefined;

		if (selectedBankId && banks?.length) {
			const selectedBank = banks.find((b) => b.id === selectedBankId);
			if (selectedBank) {
				return {
					bankName: selectedBank.bankName || selectedBank.name || undefined,
					accountName: selectedBank.name || undefined,
					iban: selectedBank.iban || undefined,
					accountNumber: selectedBank.accountNumber || undefined,
					swiftCode: undefined,
				};
			}
		}

		return {
			bankName: locale === "ar" ? organization?.bankName : organization?.bankNameEn || organization?.bankName,
			accountName: organization?.accountName,
			iban: organization?.iban,
			accountNumber: organization?.accountNumber,
			swiftCode: organization?.swiftCode,
		};
	};

	const bankDetails = getBankDetails();

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
						secondaryColor={secondaryColor}
						documentInfo={documentInfo}
						logoSize={logoSize}
						logoBackground={logoBackground}
						qrCode={isInvoice(data) ? data.qrCode : null}
					/>
				);

			case "documentMeta":
				return (
					<DocumentMetaComponent
						key={element.id}
						settings={elementSettings as any}
						documentInfo={documentInfo}
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						documentType={docType}
					/>
				);

			case "clientInfo":
				return (
					<ClientInfoComponent
						key={element.id}
						settings={elementSettings as any}
						clientInfo={clientInfo}
						companyInfo={companyInfo}
						documentInfo={documentInfo}
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						qrCode={isInvoice(data) ? data.qrCode : null}
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
				if (docType === "quotation") {
					return null;
				}
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
						secondaryColor={secondaryColor}
					/>
				);

			case "text": {
				// Handle info-bar layout (used by Bold Professional template)
				const textSettings = elementSettings as {
					layout?: string;
					background?: string;
					textColor?: string;
					fontSize?: string;
					fields?: string[];
					dividerColor?: string;
					padding?: string;
					content?: string;
					label?: string;
				};

				if (textSettings.layout === "info-bar") {
					const barFields = textSettings.fields || [];
					const fieldValues: Record<string, string> = {
						invoiceType: documentInfo.invoiceType || t("finance.templates.preview.invoice"),
						issueDate: documentInfo.date,
						dueDate: documentInfo.validUntil,
					};
					const fieldLabels: Record<string, string> = {
						invoiceType: t("finance.invoices.invoiceType"),
						issueDate: t("finance.templates.preview.date"),
						dueDate: t("finance.templates.preview.validUntil"),
					};

					return (
						<div
							key={element.id}
							className="flex items-center justify-around"
							style={{
								background: textSettings.background || primaryColor,
								color: textSettings.textColor || "#ffffff",
								fontSize: textSettings.fontSize || "12px",
								padding: textSettings.padding || "8px 28px",
							}}
						>
							{barFields.map((field, i) => (
								<Fragment key={field}>
									{i > 0 && (
										<div
											className="w-px self-stretch"
											style={{
												background:
													textSettings.dividerColor ||
													"rgba(255,255,255,0.3)",
											}}
										/>
									)}
									<div>
										<span className="opacity-70">
											{fieldLabels[field] || field}:
										</span>{" "}
										<strong>{fieldValues[field] || ""}</strong>
									</div>
								</Fragment>
							))}
						</div>
					);
				}

				const textContent = getElementContent(
					element.id,
					textSettings.content
				);
				const textLabel = textSettings.label;
				return (
					<div key={element.id} className="py-4">
						{textLabel && (
							<h4 className="text-sm font-medium text-slate-700 mb-2">
								{textLabel}
							</h4>
						)}
						<p className="text-slate-600 whitespace-pre-line">
							{textContent ||
								(interactive
									? t("finance.templates.editor.elementTypes.text")
									: "")}
						</p>
					</div>
				);
			}

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
						{/* NOTE: <img> used intentionally — print/template context where next/Image optimization doesn't apply */}
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
		const minHeight = (element.settings?.minHeight as number) || 0;

		return (
			<div
				key={element.id}
				className={`relative cursor-pointer transition-all rounded-lg ${
					isSelected
						? "ring-2 ring-primary ring-offset-2 bg-primary/5"
						: "hover:ring-1 hover:ring-primary/50"
				}`}
				style={{
					minHeight: minHeight > 0 ? `${minHeight}px` : undefined,
					paddingBottom: minHeight > 0 ? `${Math.min(minHeight / 4, 20)}px` : undefined,
				}}
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
				{/* Height indicator when resized */}
				{isSelected && minHeight > 0 && (
					<div className="absolute -top-2 end-2 bg-sky-500 text-white text-xs px-2 py-0.5 rounded-full z-10">
						+{minHeight}px
					</div>
				)}
				{content}
			</div>
		);
	};

	// Render quotation-only content sections (introduction, content blocks, T&C)
	const renderQuotationBeforeTable = () => {
		if (docType !== "quotation") return null;
		const qData = data as QuotationData;
		const beforeBlocks = qData.contentBlocks?.filter((b) => b.position === "BEFORE_TABLE") || [];
		if (!qData.introduction && beforeBlocks.length === 0) return null;

		return (
			<Fragment key="quotation-before-table">
				{qData.introduction && (
					<div className="px-6 py-3">
						<p className="text-sm whitespace-pre-line leading-relaxed">{qData.introduction}</p>
					</div>
				)}
				{beforeBlocks.map((block, idx) => (
					<div key={`before-block-${idx}`} className="px-6 py-3">
						<h4 className="text-sm font-semibold mb-1.5">{block.title}</h4>
						<p className="text-sm whitespace-pre-line leading-relaxed text-muted-foreground">{block.content}</p>
					</div>
				))}
			</Fragment>
		);
	};

	const renderQuotationAfterTotals = () => {
		if (docType !== "quotation") return null;
		const qData = data as QuotationData;
		const afterBlocks = qData.contentBlocks?.filter((b) => b.position === "AFTER_TABLE") || [];
		if (!qData.termsAndConditions && afterBlocks.length === 0) return null;

		return (
			<Fragment key="quotation-after-totals">
				{afterBlocks.map((block, idx) => (
					<div key={`after-block-${idx}`} className="px-6 py-3">
						<h4 className="text-sm font-semibold mb-1.5">{block.title}</h4>
						<p className="text-sm whitespace-pre-line leading-relaxed text-muted-foreground">{block.content}</p>
					</div>
				))}
				{qData.termsAndConditions && (
					<div className="px-6 py-3 border-t border-slate-200">
						<h4 className="text-sm font-semibold mb-1.5" style={{ color: primaryColor }}>
							{t("pricing.quotations.termsAndConditions")}
						</h4>
						<p className="text-sm whitespace-pre-line leading-relaxed text-muted-foreground">{qData.termsAndConditions}</p>
					</div>
				)}
			</Fragment>
		);
	};

	// Classify elements into header / body / footer groups
	const PDF_HEADER_TYPES = new Set(["header", "documentMeta"]);
	const PDF_FOOTER_TYPES = new Set(["footer"]);

	const { headerEls, bodyEls, footerEls } = useMemo(() => {
		const h: TemplateElement[] = [];
		const b: TemplateElement[] = [];
		const f: TemplateElement[] = [];
		for (const el of defaultElements) {
			if (PDF_HEADER_TYPES.has(el.type)) h.push(el);
			else if (PDF_FOOTER_TYPES.has(el.type)) f.push(el);
			else b.push(el);
		}
		return { headerEls: h, bodyEls: b, footerEls: f };
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultElements]);

	// Render header elements (simple — no grouping logic needed)
	const renderHeaderElements = () => {
		return headerEls.map((el) => renderInteractiveElement(el));
	};

	// Render footer elements (simple)
	const renderFooterElements = () => {
		return footerEls.map((el) => renderInteractiveElement(el));
	};

	// Render body elements with grouping logic (totals + qrCode side by side, quotation injections)
	const renderBodyGroupedElements = () => {
		const result: React.ReactNode[] = [];
		let i = 0;
		while (i < bodyEls.length) {
			const el = bodyEls[i];
			const nextEl = i + 1 < bodyEls.length ? bodyEls[i + 1] : null;

			// Inject quotation introduction + before-table blocks before itemsTable
			if (el.type === "itemsTable") {
				result.push(renderQuotationBeforeTable());
			}

			// If totals followed by qrCode, render them side by side
			// In RTL: first child goes to the right, so totals (flex-1) goes right, qrCode goes left
			// We want: qrCode on the right, totals on the left → so in RTL flex: totals first, qrCode second
			if (el.type === "totals" && nextEl?.type === "qrCode" && el.enabled && nextEl.enabled) {
				result.push(
					<div key={`group-${el.id}-${nextEl.id}`} className="flex items-start justify-between">
						<div className="shrink-0 pt-4">
							{renderInteractiveElement(nextEl)}
						</div>
						<div className="shrink-0 pt-4">
							{renderInteractiveElement(el)}
						</div>
					</div>
				);
				// Inject quotation after-totals content
				result.push(renderQuotationAfterTotals());
				i += 2;
				continue;
			}

			result.push(renderInteractiveElement(el));

			// Inject quotation after-totals content (standalone totals case)
			if (el.type === "totals" && !(nextEl?.type === "qrCode" && nextEl.enabled)) {
				result.push(renderQuotationAfterTotals());
			}

			i++;
		}
		return result;
	};

	return (
		<div
			className={`relative ${className}`}
			style={{
				backgroundColor,
				fontFamily,
			}}
			dir={locale === "ar" ? "rtl" : "ltr"}
			onClick={() => interactive && onElementClick?.(null)}
		>
			{/* Watermark overlay */}
			{showWatermark && organization?.logo && (
				<div
					className="absolute inset-0 flex items-center justify-center pointer-events-none"
					data-watermark
				>
					<img
						src={organization.logo}
						alt=""
						className="w-64 h-64 object-contain"
						style={{ opacity: watermarkOpacity / 100 }}
					/>
				</div>
			)}

			{/* Table layout: thead/tfoot repeat on every printed page */}
			<table data-layout-table style={{ width: "100%", borderCollapse: "collapse", minHeight: "297mm" }}>
				<thead>
					<tr>
						<td style={{ padding: 0, border: "none" }}>
							<div data-pdf-header>
								{headerImage && (
									<img src={headerImage} alt="" className="w-full block" />
								)}
								<div className={`px-14 ${headerImage ? "pt-4" : "pt-10"}`}>
									{renderHeaderElements()}
								</div>
							</div>
						</td>
					</tr>
				</thead>
				<tfoot>
					<tr>
						<td style={{ padding: 0, border: "none" }}>
							<div data-pdf-footer>
								<div className={`px-14 ${footerImage ? "pb-4" : "pb-10"}`}>
									{renderFooterElements()}
								</div>
								{footerImage && (
									<img src={footerImage} alt="" className="w-full block" />
								)}
							</div>
						</td>
					</tr>
				</tfoot>
				<tbody>
					<tr>
						<td style={{ padding: 0, border: "none", verticalAlign: "top" }}>
							<div data-pdf-body>
								<div className="px-14">
									{renderBodyGroupedElements()}

									{data.notes && (
										<div className="mt-4 pt-4 border-t border-slate-200">
											<h4 className="text-sm font-medium text-slate-700 mb-2">
												{t("finance.quotations.notes")}:
											</h4>
											<p className="text-sm text-slate-600 whitespace-pre-line">{data.notes}</p>
										</div>
									)}

									{organization?.thankYouMessage && (
										<div className="mt-6 text-center">
											<p className="text-sm text-slate-600">{organization.thankYouMessage}</p>
										</div>
									)}
								</div>
							</div>

							{afterBody}
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
});
