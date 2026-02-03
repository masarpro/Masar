"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Printer, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDate } from "../../lib/utils";
import { Currency } from "../shared/Currency";

interface QuotationPreviewProps {
	organizationId: string;
	organizationSlug: string;
	quotationId: string;
}

export function QuotationPreview({
	organizationId,
	organizationSlug,
	quotationId,
}: QuotationPreviewProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance/quotations`;

	const { data: quotation, isLoading } = useQuery(
		orpc.finance.quotations.getById.queryOptions({
			input: { organizationId, id: quotationId },
		}),
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (!quotation) {
		return (
			<div className="text-center py-20">
				<p className="text-slate-500">{t("finance.quotations.notFound")}</p>
			</div>
		);
	}

	const handlePrint = () => {
		window.print();
	};

	return (
		<div className="space-y-4">
			{/* Actions Bar - Hide on print */}
			<div className="flex items-center justify-between print:hidden">
				<Link href={basePath}>
					<Button variant="outline" className="rounded-xl">
						<ArrowLeft className="h-4 w-4 me-2" />
						{t("common.back")}
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

			{/* Preview Content */}
			<Card className="rounded-2xl max-w-4xl mx-auto print:shadow-none print:rounded-none">
				<CardContent className="p-8 print:p-4">
					{/* Header */}
					<div className="flex justify-between items-start mb-8 pb-8 border-b">
						<div>
							<h1 className="text-2xl font-bold text-slate-900">
								{t("finance.quotations.title")}
							</h1>
							<p className="text-lg font-semibold text-primary mt-1">
								{quotation.quotationNo}
							</p>
						</div>
						<div className="text-end">
							<p className="text-sm text-slate-500">
								{t("finance.quotations.date")}
							</p>
							<p className="font-medium">{formatDate(quotation.createdAt)}</p>
							<p className="text-sm text-slate-500 mt-2">
								{t("finance.quotations.validUntil")}
							</p>
							<p className="font-medium">{formatDate(quotation.validUntil)}</p>
						</div>
					</div>

					{/* Client Info */}
					<div className="mb-8">
						<h2 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
							{t("finance.quotations.clientInfo")}
						</h2>
						<p className="font-semibold text-lg">{quotation.clientName}</p>
						{quotation.clientCompany && (
							<p className="text-slate-600">{quotation.clientCompany}</p>
						)}
						{quotation.clientAddress && (
							<p className="text-slate-600">{quotation.clientAddress}</p>
						)}
						{quotation.clientPhone && (
							<p className="text-slate-600">{quotation.clientPhone}</p>
						)}
						{quotation.clientEmail && (
							<p className="text-slate-600">{quotation.clientEmail}</p>
						)}
						{quotation.clientTaxNumber && (
							<p className="text-slate-600">
								{t("finance.quotations.taxNumber")}: {quotation.clientTaxNumber}
							</p>
						)}
					</div>

					{/* Items Table */}
					<table className="w-full mb-8">
						<thead>
							<tr className="border-b border-slate-200">
								<th className="py-3 text-start text-sm font-medium text-slate-500">
									{t("finance.items.description")}
								</th>
								<th className="py-3 text-center text-sm font-medium text-slate-500">
									{t("finance.items.quantity")}
								</th>
								<th className="py-3 text-center text-sm font-medium text-slate-500">
									{t("finance.items.unit")}
								</th>
								<th className="py-3 text-center text-sm font-medium text-slate-500">
									{t("finance.items.unitPrice")}
								</th>
								<th className="py-3 text-end text-sm font-medium text-slate-500">
									{t("finance.items.total")}
								</th>
							</tr>
						</thead>
						<tbody>
							{quotation.items.map((item, index) => (
								<tr key={item.id} className="border-b border-slate-100">
									<td className="py-3">{item.description}</td>
									<td className="py-3 text-center">{item.quantity}</td>
									<td className="py-3 text-center">{item.unit || "-"}</td>
									<td className="py-3 text-center">
										<Currency amount={item.unitPrice} />
									</td>
									<td className="py-3 text-end font-medium">
										<Currency amount={item.totalPrice} />
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{/* Totals */}
					<div className="flex justify-end mb-8">
						<div className="w-64 space-y-2">
							<div className="flex justify-between">
								<span className="text-slate-600">
									{t("finance.summary.subtotal")}
								</span>
								<span><Currency amount={quotation.subtotal} /></span>
							</div>
							{quotation.discountAmount > 0 && (
								<div className="flex justify-between text-red-600">
									<span>
										{t("finance.summary.discount")} ({quotation.discountPercent}%)
									</span>
									<span>-<Currency amount={quotation.discountAmount} /></span>
								</div>
							)}
							<div className="flex justify-between">
								<span className="text-slate-600">
									{t("finance.summary.vat")} ({quotation.vatPercent}%)
								</span>
								<span><Currency amount={quotation.vatAmount} /></span>
							</div>
							<div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-lg">
								<span>{t("finance.summary.total")}</span>
								<span className="text-primary">
									<Currency amount={quotation.totalAmount} />
								</span>
							</div>
						</div>
					</div>

					{/* Terms */}
					{(quotation.paymentTerms ||
						quotation.deliveryTerms ||
						quotation.warrantyTerms) && (
						<div className="border-t border-slate-200 pt-6 space-y-4">
							{quotation.paymentTerms && (
								<div>
									<h3 className="font-medium text-slate-900 mb-1">
										{t("finance.quotations.paymentTerms")}
									</h3>
									<p className="text-sm text-slate-600 whitespace-pre-wrap">
										{quotation.paymentTerms}
									</p>
								</div>
							)}
							{quotation.deliveryTerms && (
								<div>
									<h3 className="font-medium text-slate-900 mb-1">
										{t("finance.quotations.deliveryTerms")}
									</h3>
									<p className="text-sm text-slate-600 whitespace-pre-wrap">
										{quotation.deliveryTerms}
									</p>
								</div>
							)}
							{quotation.warrantyTerms && (
								<div>
									<h3 className="font-medium text-slate-900 mb-1">
										{t("finance.quotations.warrantyTerms")}
									</h3>
									<p className="text-sm text-slate-600 whitespace-pre-wrap">
										{quotation.warrantyTerms}
									</p>
								</div>
							)}
						</div>
					)}

					{/* Notes */}
					{quotation.notes && (
						<div className="mt-6 pt-6 border-t border-slate-200">
							<h3 className="font-medium text-slate-900 mb-1">
								{t("finance.quotations.notes")}
							</h3>
							<p className="text-sm text-slate-600 whitespace-pre-wrap">
								{quotation.notes}
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
