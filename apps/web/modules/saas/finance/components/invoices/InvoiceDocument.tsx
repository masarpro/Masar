"use client";

import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import { TemplateRenderer } from "../templates/renderer/TemplateRenderer";
import type {
	InvoiceData as RendererInvoiceData,
	OrganizationData as RendererOrganizationData,
} from "../templates/renderer/TemplateRenderer";
import type { TemplateElement } from "../templates/TemplateCanvas";
import { getInvoiceElements, DEFAULT_TEMPLATE_SETTINGS } from "../../lib/default-templates";
import type { TemplateSettings } from "../../lib/default-templates";
import { Currency } from "../shared/Currency";
import { formatDate } from "../../lib/utils";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface InvoiceDocumentProps {
	invoice: any;
	options?: {
		showWatermark?: boolean;
		printMode?: boolean;
		showPayments?: boolean;
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// Transform Functions
// ═══════════════════════════════════════════════════════════════════════════

function transformInvoiceToRendererData(invoice: any): RendererInvoiceData {
	const paidAmount = Number(invoice.paidAmount ?? 0);
	const totalAmount = Number(invoice.totalAmount ?? 0);

	return {
		invoiceNo: invoice.invoiceNo,
		issueDate: invoice.issueDate,
		dueDate: invoice.dueDate,
		issuedAt: invoice.issuedAt,
		status: invoice.status,
		invoiceType: invoice.invoiceType,
		clientName: invoice.clientName || "",
		clientCompany: invoice.clientCompany || undefined,
		clientPhone: invoice.clientPhone || undefined,
		clientEmail: invoice.clientEmail || undefined,
		clientAddress: invoice.clientAddress || undefined,
		clientTaxNumber: invoice.clientTaxNumber || undefined,
		items: (invoice.items || [])
			.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
			.map((item: any) => ({
				description: item.description,
				quantity: Number(item.quantity),
				unit: item.unit || "",
				unitPrice: Number(item.unitPrice),
				totalPrice: Number(item.totalPrice),
			})),
		subtotal: Number(invoice.subtotal ?? 0),
		discountPercent: Number(invoice.discountPercent ?? 0),
		discountAmount: Number(invoice.discountAmount ?? 0),
		vatPercent: Number(invoice.vatPercent ?? 15),
		vatAmount: Number(invoice.vatAmount ?? 0),
		totalAmount,
		paidAmount,
		remainingAmount: totalAmount - paidAmount,
		paymentTerms: invoice.paymentTerms || undefined,
		notes: invoice.notes || undefined,
		sellerTaxNumber: invoice.sellerTaxNumber || invoice.organizationSettings?.taxNumber || undefined,
		qrCode: invoice.qrCode || null,
		zatcaUuid: invoice.zatcaUuid || null,
	};
}

function transformOrganizationData(invoice: any): RendererOrganizationData {
	const orgSettings = invoice.organizationSettings;

	return {
		name: orgSettings?.companyNameAr || "",
		nameAr: orgSettings?.companyNameAr || undefined,
		nameEn: orgSettings?.companyNameEn || undefined,
		logo: orgSettings?.logo || undefined,
		address: orgSettings?.address || undefined,
		phone: orgSettings?.phone || undefined,
		email: orgSettings?.email || undefined,
		website: orgSettings?.website || undefined,
		taxNumber: orgSettings?.taxNumber || undefined,
		commercialReg: orgSettings?.commercialReg || undefined,
		bankName: orgSettings?.bankName || undefined,
		accountName: orgSettings?.accountName || undefined,
		iban: orgSettings?.iban || undefined,
	};
}

// ═══════════════════════════════════════════════════════════════════════════
// Payments Table
// ═══════════════════════════════════════════════════════════════════════════

function PaymentsTable({
	payments,
	primaryColor,
}: {
	payments: any[];
	primaryColor: string;
}) {
	const t = useTranslations();

	return (
		<div className="mt-4 border-t border-slate-200 pt-4">
			<h4
				className="mb-2 text-sm font-bold flex items-center gap-2"
				style={{ color: primaryColor }}
			>
				<CreditCard className="h-4 w-4" />
				{t("finance.invoices.payments")}
			</h4>
			<table className="w-full text-sm">
				<thead>
					<tr
						className="border-b"
						style={{ borderColor: `${primaryColor}30` }}
					>
						<th className="py-2 text-start text-xs font-medium text-slate-500">
							{t("finance.invoices.paymentDate")}
						</th>
						<th className="py-2 text-start text-xs font-medium text-slate-500">
							{t("finance.invoices.paymentMethod")}
						</th>
						<th className="py-2 text-start text-xs font-medium text-slate-500">
							{t("finance.invoices.referenceNo")}
						</th>
						<th className="py-2 text-end text-xs font-medium text-slate-500">
							{t("finance.invoices.amount")}
						</th>
					</tr>
				</thead>
				<tbody>
					{payments.map((payment: any) => (
						<tr
							key={payment.id}
							className="border-b border-slate-100"
						>
							<td className="py-2 text-slate-700">
								{formatDate(payment.paymentDate)}
							</td>
							<td className="py-2 text-slate-700">
								{payment.paymentMethod || "-"}
							</td>
							<td className="py-2 text-slate-700">
								{payment.referenceNo || "-"}
							</td>
							<td className="py-2 text-end font-medium text-green-600">
								<Currency amount={Number(payment.amount)} />
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function InvoiceDocument({
	invoice,
	options = {},
}: InvoiceDocumentProps) {
	const t = useTranslations();
	const {
		showWatermark = false,
		printMode = false,
		showPayments = true,
	} = options;

	// 1. Determine template elements and settings
	const templateContent = invoice.template?.content as
		| { elements?: TemplateElement[] }
		| null;
	const templateElements = templateContent?.elements || getInvoiceElements();
	const templateSettings = (invoice.template?.settings ||
		DEFAULT_TEMPLATE_SETTINGS) as TemplateSettings;

	// 2. Transform data
	const rendererData = transformInvoiceToRendererData(invoice);
	const rendererOrg = transformOrganizationData(invoice);

	// 3. Build template config for renderer
	const templateConfig = {
		elements: templateElements,
		settings: {
			backgroundColor: templateSettings.backgroundColor,
			primaryColor: templateSettings.primaryColor,
			secondaryColor: templateSettings.secondaryColor,
			fontFamily: templateSettings.fontFamily,
			fontSize: templateSettings.fontSize,
			vatPercent: templateSettings.vatPercent,
			currency: templateSettings.currency,
		},
	};

	const primaryColor = templateSettings.primaryColor || "#3b82f6";

	return (
		<div
			className={`relative ${printMode ? "print:bg-white print:text-black" : ""}`}
			style={{
				fontFamily: templateSettings.fontFamily || "Cairo",
				direction: "rtl",
				colorScheme: "light",
			}}
			dir="rtl"
		>
			{/* Draft watermark */}
			{showWatermark && invoice.status === "DRAFT" && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
					<span className="text-8xl font-bold text-slate-200/50 rotate-[-30deg] select-none">
						{t("finance.invoices.status.draft")}
					</span>
				</div>
			)}

			{/* Template renderer */}
			<TemplateRenderer
				data={rendererData}
				template={templateConfig}
				organization={rendererOrg}
				documentType="invoice"
				interactive={false}
			/>

			{/* Payments table (outside template — not a template element) */}
			{showPayments &&
				invoice.payments &&
				invoice.payments.length > 0 && (
					<div className="px-8 pb-4">
						<PaymentsTable
							payments={invoice.payments}
							primaryColor={primaryColor}
						/>
					</div>
				)}
		</div>
	);
}
