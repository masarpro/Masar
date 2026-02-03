"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Printer, Download, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { HeaderComponent } from "./components/HeaderComponent";
import { ClientInfoComponent } from "./components/ClientInfoComponent";
import { ItemsTableComponent } from "./components/ItemsTableComponent";
import { TotalsComponent } from "./components/TotalsComponent";
import { TermsComponent } from "./components/TermsComponent";
import { SignatureComponent } from "./components/SignatureComponent";
import { BankDetailsComponent } from "./components/BankDetailsComponent";
import type { TemplateElement } from "./TemplateCanvas";

interface TemplatePreviewProps {
	organizationId: string;
	organizationSlug: string;
	templateId: string;
}

interface TemplateSettings {
	backgroundColor?: string;
	primaryColor?: string;
	fontFamily?: string;
	fontSize?: string;
	vatPercent?: number;
	currency?: string;
}

export function TemplatePreview({
	organizationId,
	organizationSlug,
	templateId,
}: TemplatePreviewProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance/templates`;

	const { data: template, isLoading } = useQuery(
		orpc.finance.templates.getById.queryOptions({
			input: { organizationId, id: templateId },
		}),
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
					<p className="text-muted-foreground">{t("common.loading")}</p>
				</div>
			</div>
		);
	}

	if (!template) {
		return (
			<div className="text-center py-20">
				<p className="text-slate-500">{t("finance.templates.notFound")}</p>
				<Link href={basePath}>
					<Button variant="outline" className="mt-4 rounded-xl">
						<ArrowLeft className="h-4 w-4 me-2" />
						{t("common.back")}
					</Button>
				</Link>
			</div>
		);
	}

	const handlePrint = () => {
		window.print();
	};

	const content = template.content as { elements?: TemplateElement[] } | null;
	const elements = content?.elements || [];
	const settings = (template.settings || {}) as TemplateSettings;
	const sortedElements = [...elements]
		.filter((el) => el.enabled)
		.sort((a, b) => a.order - b.order);

	const primaryColor = settings.primaryColor || "#3b82f6";
	const backgroundColor = settings.backgroundColor || "#ffffff";
	const fontFamily = settings.fontFamily || "inherit";
	const currency = settings.currency || "SAR";
	const vatPercent = settings.vatPercent || 15;

	const renderElement = (element: TemplateElement) => {
		const elementSettings = element.settings || {};

		switch (element.type) {
			case "header":
				return (
					<HeaderComponent
						key={element.id}
						settings={elementSettings as { showLogo?: boolean; showCompanyName?: boolean; showAddress?: boolean }}
						primaryColor={primaryColor}
					/>
				);
			case "clientInfo":
				return (
					<ClientInfoComponent
						key={element.id}
						settings={elementSettings as { showTaxNumber?: boolean; showEmail?: boolean; showPhone?: boolean }}
						primaryColor={primaryColor}
					/>
				);
			case "itemsTable":
				return (
					<ItemsTableComponent
						key={element.id}
						settings={elementSettings as { showQuantity?: boolean; showUnit?: boolean; showUnitPrice?: boolean }}
						primaryColor={primaryColor}
						currency={currency}
					/>
				);
			case "totals":
				return (
					<TotalsComponent
						key={element.id}
						settings={elementSettings as { showDiscount?: boolean; showVat?: boolean }}
						totals={{
							subtotal: 15000,
							discountPercent: 5,
							discountAmount: 750,
							vatPercent: vatPercent,
							vatAmount: (15000 - 750) * (vatPercent / 100),
							total: (15000 - 750) * (1 + vatPercent / 100),
						}}
						primaryColor={primaryColor}
						currency={currency}
					/>
				);
			case "terms":
				return (
					<TermsComponent
						key={element.id}
						settings={elementSettings as { showPaymentTerms?: boolean; showDeliveryTerms?: boolean; showWarrantyTerms?: boolean }}
						primaryColor={primaryColor}
					/>
				);
			case "signature":
				return (
					<SignatureComponent
						key={element.id}
						settings={elementSettings as { showDate?: boolean }}
						primaryColor={primaryColor}
					/>
				);
			case "qrCode":
				return (
					<div key={element.id} className="py-4 flex justify-center">
						<div
							className="w-32 h-32 border-2 rounded-lg flex items-center justify-center text-slate-400"
							style={{ borderColor: primaryColor }}
						>
							QR Code
						</div>
					</div>
				);
			case "footer":
				return (
					<div
						key={element.id}
						className="py-4 mt-8 border-t text-center text-sm text-slate-500"
						style={{ borderColor: primaryColor }}
					>
						<p>{t("finance.templates.preview.companyName")} - {new Date().getFullYear()}</p>
					</div>
				);
			case "text":
				return (
					<div key={element.id} className="py-4">
						<p className="text-slate-600">
							{(elementSettings as { content?: string }).content || t("finance.templates.editor.elementDescriptions.text")}
						</p>
					</div>
				);
			case "image":
				return (
					<div key={element.id} className="py-4 flex justify-center">
						<div className="w-48 h-32 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
							{t("finance.templates.editor.elementTypes.image")}
						</div>
					</div>
				);
			case "bankDetails":
				return (
					<BankDetailsComponent
						key={element.id}
						settings={elementSettings as { showBankName?: boolean; showIban?: boolean; showAccountName?: boolean; showSwiftCode?: boolean }}
						primaryColor={primaryColor}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div className="space-y-4">
			{/* Actions Bar - Hide on print */}
			<div className="flex items-center justify-between print:hidden">
				<Link href={`${basePath}/${templateId}`}>
					<Button variant="outline" className="rounded-xl">
						<ArrowLeft className="h-4 w-4 me-2" />
						{t("finance.templates.editor.title")}
					</Button>
				</Link>
				<div className="flex gap-2">
					<Button variant="outline" onClick={handlePrint} className="rounded-xl">
						<Printer className="h-4 w-4 me-2" />
						{t("finance.actions.print")}
					</Button>
					<Button className="rounded-xl">
						<Download className="h-4 w-4 me-2" />
						{t("finance.actions.downloadPdf")}
					</Button>
				</div>
			</div>

			{/* Template Name */}
			<div className="text-center print:hidden">
				<h2 className="text-lg font-semibold text-slate-900">{template.name}</h2>
				<p className="text-sm text-slate-500">
					{t(`finance.templates.types.${template.templateType.toLowerCase()}`)}
				</p>
			</div>

			{/* Preview Content */}
			<Card className="rounded-2xl max-w-4xl mx-auto print:shadow-none print:rounded-none print:border-none">
				<CardContent
					className="p-8 print:p-4"
					style={{
						backgroundColor,
						fontFamily,
					}}
				>
					{sortedElements.length === 0 ? (
						<div className="text-center py-20 text-slate-500">
							<p>{t("finance.templates.editor.dropHint")}</p>
						</div>
					) : (
						sortedElements.map(renderElement)
					)}
				</CardContent>
			</Card>
		</div>
	);
}
