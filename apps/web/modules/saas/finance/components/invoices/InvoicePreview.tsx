"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Printer, Download, ArrowLeft, QrCode, CreditCard } from "lucide-react";
import Link from "next/link";
import { formatDate, isOverdue } from "../../lib/utils";
import { Currency } from "../shared/Currency";
import { StatusBadge } from "../shared/StatusBadge";

interface InvoicePreviewProps {
	organizationId: string;
	organizationSlug: string;
	invoiceId: string;
}

const invoiceTypeLabels: Record<string, string> = {
	STANDARD: "فاتورة عادية",
	TAX: "فاتورة ضريبية",
	SIMPLIFIED: "فاتورة مبسطة",
};

export function InvoicePreview({
	organizationId,
	organizationSlug,
	invoiceId,
}: InvoicePreviewProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance/invoices`;

	const { data: invoice, isLoading } = useQuery(
		orpc.finance.invoices.getById.queryOptions({
			input: { organizationId, id: invoiceId },
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

	if (!invoice) {
		return (
			<div className="text-center py-20">
				<p className="text-slate-500 dark:text-slate-400">
					{t("finance.invoices.notFound")}
				</p>
			</div>
		);
	}

	const handlePrint = () => {
		window.print();
	};

	const remainingAmount = invoice.totalAmount - invoice.paidAmount;
	const isInvoiceOverdue =
		invoice.status !== "PAID" &&
		invoice.status !== "CANCELLED" &&
		isOverdue(invoice.dueDate);

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
					<div className="flex justify-between items-start mb-8 pb-8 border-b dark:border-slate-700">
						<div>
							<div className="flex items-center gap-3">
								<h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
									{invoiceTypeLabels[invoice.invoiceType] ||
										t("finance.invoices.title")}
								</h1>
								<StatusBadge status={invoice.status} type="invoice" />
							</div>
							<p className="text-lg font-semibold text-primary mt-1">
								{invoice.invoiceNo}
							</p>
							{invoice.invoiceType === "TAX" && invoice.sellerTaxNumber && (
								<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
									الرقم الضريبي للمنشأة: {invoice.sellerTaxNumber}
								</p>
							)}
						</div>
						<div className="text-end">
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("finance.invoices.issueDate")}
							</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">
								{formatDate(invoice.issueDate)}
							</p>
							<p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
								{t("finance.invoices.dueDate")}
							</p>
							<p
								className={`font-medium ${
									isInvoiceOverdue
										? "text-red-600 dark:text-red-400"
										: "text-slate-900 dark:text-slate-100"
								}`}
							>
								{formatDate(invoice.dueDate)}
								{isInvoiceOverdue && (
									<span className="text-xs me-2">(متأخرة)</span>
								)}
							</p>
						</div>
					</div>

					{/* Client Info */}
					<div className="mb-8">
						<h2 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
							{t("finance.invoices.clientInfo")}
						</h2>
						<p className="font-semibold text-lg text-slate-900 dark:text-slate-100">
							{invoice.clientName}
						</p>
						{invoice.clientCompany && (
							<p className="text-slate-600 dark:text-slate-400">
								{invoice.clientCompany}
							</p>
						)}
						{invoice.clientAddress && (
							<p className="text-slate-600 dark:text-slate-400">
								{invoice.clientAddress}
							</p>
						)}
						{invoice.clientPhone && (
							<p className="text-slate-600 dark:text-slate-400">
								{invoice.clientPhone}
							</p>
						)}
						{invoice.clientEmail && (
							<p className="text-slate-600 dark:text-slate-400">
								{invoice.clientEmail}
							</p>
						)}
						{invoice.clientTaxNumber && (
							<p className="text-slate-600 dark:text-slate-400">
								{t("finance.invoices.taxNumber")}: {invoice.clientTaxNumber}
							</p>
						)}
					</div>

					{/* Items Table */}
					<table className="w-full mb-8">
						<thead>
							<tr className="border-b border-slate-200 dark:border-slate-700">
								<th className="py-3 text-start text-sm font-medium text-slate-500 dark:text-slate-400">
									{t("finance.items.description")}
								</th>
								<th className="py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
									{t("finance.items.quantity")}
								</th>
								<th className="py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
									{t("finance.items.unit")}
								</th>
								<th className="py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
									{t("finance.items.unitPrice")}
								</th>
								<th className="py-3 text-end text-sm font-medium text-slate-500 dark:text-slate-400">
									{t("finance.items.total")}
								</th>
							</tr>
						</thead>
						<tbody>
							{invoice.items.map((item) => (
								<tr
									key={item.id}
									className="border-b border-slate-100 dark:border-slate-800"
								>
									<td className="py-3 text-slate-900 dark:text-slate-100">
										{item.description}
									</td>
									<td className="py-3 text-center text-slate-700 dark:text-slate-300">
										{item.quantity}
									</td>
									<td className="py-3 text-center text-slate-700 dark:text-slate-300">
										{item.unit || "-"}
									</td>
									<td className="py-3 text-center text-slate-700 dark:text-slate-300">
										<Currency amount={item.unitPrice} />
									</td>
									<td className="py-3 text-end font-medium text-slate-900 dark:text-slate-100">
										<Currency amount={item.totalPrice} />
									</td>
								</tr>
							))}
						</tbody>
					</table>

					{/* Totals */}
					<div className="flex justify-end mb-8">
						<div className="w-72 space-y-2">
							<div className="flex justify-between text-slate-700 dark:text-slate-300">
								<span>{t("finance.summary.subtotal")}</span>
								<span><Currency amount={invoice.subtotal} /></span>
							</div>
							{invoice.discountAmount > 0 && (
								<div className="flex justify-between text-red-600 dark:text-red-400">
									<span>
										{t("finance.summary.discount")} ({invoice.discountPercent}%)
									</span>
									<span>-<Currency amount={invoice.discountAmount} /></span>
								</div>
							)}
							<div className="flex justify-between text-slate-700 dark:text-slate-300">
								<span>
									{t("finance.summary.vat")} ({invoice.vatPercent}%)
								</span>
								<span><Currency amount={invoice.vatAmount} /></span>
							</div>
							<div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold text-lg">
								<span className="text-slate-900 dark:text-slate-100">
									{t("finance.summary.total")}
								</span>
								<span className="text-primary">
									<Currency amount={invoice.totalAmount} />
								</span>
							</div>

							{/* Payment Summary */}
							{invoice.paidAmount > 0 && (
								<>
									<div className="flex justify-between text-green-600 dark:text-green-400">
										<span>{t("finance.invoices.paidAmount")}</span>
										<span>-<Currency amount={invoice.paidAmount} /></span>
									</div>
									<div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold">
										<span
											className={
												remainingAmount > 0
													? "text-amber-600 dark:text-amber-400"
													: "text-green-600 dark:text-green-400"
											}
										>
											{t("finance.invoices.remainingAmount")}
										</span>
										<span
											className={
												remainingAmount > 0
													? "text-amber-600 dark:text-amber-400"
													: "text-green-600 dark:text-green-400"
											}
										>
											<Currency amount={remainingAmount} />
										</span>
									</div>
								</>
							)}
						</div>
					</div>

					{/* Payments Table */}
					{invoice.payments && invoice.payments.length > 0 && (
						<div className="mb-8 border-t border-slate-200 dark:border-slate-700 pt-6">
							<h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
								<CreditCard className="h-4 w-4" />
								{t("finance.invoices.payments")}
							</h3>
							<table className="w-full">
								<thead>
									<tr className="border-b border-slate-200 dark:border-slate-700">
										<th className="py-2 text-start text-sm font-medium text-slate-500 dark:text-slate-400">
											{t("finance.invoices.paymentDate")}
										</th>
										<th className="py-2 text-start text-sm font-medium text-slate-500 dark:text-slate-400">
											{t("finance.invoices.paymentMethod")}
										</th>
										<th className="py-2 text-start text-sm font-medium text-slate-500 dark:text-slate-400">
											{t("finance.invoices.referenceNo")}
										</th>
										<th className="py-2 text-end text-sm font-medium text-slate-500 dark:text-slate-400">
											{t("finance.invoices.amount")}
										</th>
									</tr>
								</thead>
								<tbody>
									{invoice.payments.map((payment) => (
										<tr
											key={payment.id}
											className="border-b border-slate-100 dark:border-slate-800"
										>
											<td className="py-2 text-slate-700 dark:text-slate-300">
												{formatDate(payment.paymentDate)}
											</td>
											<td className="py-2 text-slate-700 dark:text-slate-300">
												{payment.paymentMethod || "-"}
											</td>
											<td className="py-2 text-slate-700 dark:text-slate-300">
												{payment.referenceNo || "-"}
											</td>
											<td className="py-2 text-end font-medium text-green-600 dark:text-green-400">
												<Currency amount={payment.amount} />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* ZATCA QR Code for Tax Invoices */}
					{invoice.invoiceType === "TAX" && invoice.qrCode && (
						<div className="mb-8 border-t border-slate-200 dark:border-slate-700 pt-6">
							<div className="flex items-center gap-4">
								<div className="bg-white p-4 rounded-lg border border-slate-200">
									<img
										src={invoice.qrCode}
										alt="ZATCA QR Code"
										className="w-32 h-32"
									/>
								</div>
								<div>
									<h3 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
										<QrCode className="h-4 w-4" />
										رمز الفاتورة الضريبية
									</h3>
									<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
										فاتورة ضريبية متوافقة مع متطلبات هيئة الزكاة والضريبة
										والجمارك
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Payment Terms */}
					{invoice.paymentTerms && (
						<div className="border-t border-slate-200 dark:border-slate-700 pt-6 mb-4">
							<h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
								{t("finance.invoices.paymentTerms")}
							</h3>
							<p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
								{invoice.paymentTerms}
							</p>
						</div>
					)}

					{/* Notes */}
					{invoice.notes && (
						<div className="pt-4 border-t border-slate-200 dark:border-slate-700">
							<h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
								{t("finance.invoices.notes")}
							</h3>
							<p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
								{invoice.notes}
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
