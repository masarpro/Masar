"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Printer, ArrowLeft, QrCode, CreditCard } from "lucide-react";
import Link from "next/link";
import { formatDate, formatDateTime, isOverdue } from "../../lib/utils";
import { Currency } from "../shared/Currency";
import { StatusBadge } from "../shared/StatusBadge";

interface InvoicePreviewProps {
	organizationId: string;
	organizationSlug: string;
	invoiceId: string;
}

const INVOICE_TYPE_KEYS: Record<string, string> = {
	STANDARD: "standard",
	TAX: "tax",
	SIMPLIFIED: "simplified",
	CREDIT_NOTE: "credit_note",
	DEBIT_NOTE: "debit_note",
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
	const taxableAmount = invoice.subtotal - invoice.discountAmount;
	const isInvoiceOverdue =
		invoice.status !== "PAID" &&
		invoice.status !== "CANCELLED" &&
		isOverdue(invoice.dueDate);

	// QR code should show for any invoice that has a QR code generated
	const showQR = !!invoice.qrCode;

	// Resolve seller info: frozen data → fallback to org finance settings
	const orgSettings = invoice.organizationSettings;
	const displaySellerName = invoice.sellerName || orgSettings?.companyNameAr || "";
	const displaySellerTaxNumber = invoice.sellerTaxNumber || orgSettings?.taxNumber || "";
	const displaySellerAddress = invoice.sellerAddress || orgSettings?.address || "";
	const displaySellerPhone = invoice.sellerPhone || orgSettings?.phone || "";
	const displaySellerCommercialReg = orgSettings?.commercialReg || "";
	const displaySellerEmail = orgSettings?.email || "";

	return (
		<div className="space-y-4">
			{/* Actions Bar - Hide on print */}
			<div className="flex items-center justify-between print:hidden">
				<Link href={`${basePath}/${invoiceId}`}>
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
				</div>
			</div>

			{/* Preview Content — A4-ready */}
			<Card className="rounded-2xl max-w-[210mm] mx-auto print:shadow-none print:rounded-none print:border-none print:max-w-none">
				<CardContent className="p-8 min-h-[297mm] print:p-6 print:text-black">
					{/* ─── Header: Seller info + QR Code ─────────────────── */}
					<div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-300 dark:border-slate-600 print:border-black">
						{/* Seller Information */}
						<div className="space-y-1">
							{displaySellerName && (
								<h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 print:text-black">
									{displaySellerName}
								</h2>
							)}
							{displaySellerTaxNumber && (
								<p className="text-sm text-slate-600 dark:text-slate-400 print:text-gray-700">
									{t("finance.invoices.sellerTaxNumber")}: {displaySellerTaxNumber}
								</p>
							)}
							{displaySellerCommercialReg && (
								<p className="text-sm text-slate-600 dark:text-slate-400 print:text-gray-700">
									{t("finance.invoices.commercialReg")}: {displaySellerCommercialReg}
								</p>
							)}
							{displaySellerAddress && (
								<p className="text-sm text-slate-600 dark:text-slate-400 print:text-gray-700">
									{displaySellerAddress}
								</p>
							)}
							{displaySellerPhone && (
								<p className="text-sm text-slate-600 dark:text-slate-400 print:text-gray-700">
									{displaySellerPhone}
								</p>
							)}
							{displaySellerEmail && (
								<p className="text-sm text-slate-600 dark:text-slate-400 print:text-gray-700">
									{displaySellerEmail}
								</p>
							)}
						</div>

						{/* QR Code — visible for TAX and SIMPLIFIED */}
						{showQR && (
							<div className="bg-white p-3 rounded-xl border border-slate-200 shrink-0 print:border-gray-400 print:rounded-lg">
								<img
									src={invoice.qrCode ?? undefined}
									alt="ZATCA QR Code"
									className="w-32 h-32 print:w-24 print:h-24"
									style={{ minWidth: "5rem", minHeight: "5rem" }}
								/>
							</div>
						)}
					</div>

					{/* ─── Invoice Title & Type ──────────────────────────── */}
					<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
						<div>
							<h3 className="text-xl font-bold text-primary print:text-black">
								{t(`finance.invoices.types.${INVOICE_TYPE_KEYS[invoice.invoiceType] || "standard"}`)}
							</h3>
							<p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1 print:text-black">
								{invoice.invoiceNo}
							</p>
							{/* Status badge — hidden on print */}
							<div className="mt-2 print:hidden">
								<StatusBadge status={invoice.status} type="invoice" />
							</div>
						</div>
						<div className="text-end space-y-1">
							<div>
								<span className="text-sm text-slate-500 dark:text-slate-400 print:text-gray-600">
									{t("finance.invoices.issueDate")}:{" "}
								</span>
								<span className="font-medium text-slate-900 dark:text-slate-100 print:text-black">
									{formatDate(invoice.issueDate)}
								</span>
							</div>
							{/* Issued At — includes time (ZATCA requirement) */}
							{invoice.issuedAt && (
								<div>
									<span className="text-sm text-slate-500 dark:text-slate-400 print:text-gray-600">
										{t("finance.invoices.issuedAtDateTime")}:{" "}
									</span>
									<span className="font-medium text-slate-900 dark:text-slate-100 print:text-black">
										{formatDateTime(invoice.issuedAt)}
									</span>
								</div>
							)}
							<div>
								<span className="text-sm text-slate-500 dark:text-slate-400 print:text-gray-600">
									{t("finance.invoices.dueDate")}:{" "}
								</span>
								<span
									className={`font-medium ${
										isInvoiceOverdue
											? "text-red-600 dark:text-red-400 print:text-red-700"
											: "text-slate-900 dark:text-slate-100 print:text-black"
									}`}
								>
									{formatDate(invoice.dueDate)}
									{isInvoiceOverdue && (
										<span className="text-xs me-2">({t("finance.invoices.overdueLabel")})</span>
									)}
								</span>
							</div>
						</div>
					</div>

					{/* ─── Client Information ────────────────────────────── */}
					<div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl print:bg-gray-50 print:border print:border-gray-300 print:rounded-lg">
						<h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 print:text-gray-600">
							{t("finance.invoices.clientInfo")}
						</h4>
						<p className="font-semibold text-lg text-slate-900 dark:text-slate-100 print:text-black">
							{invoice.clientName}
						</p>
						{invoice.clientCompany && (
							<p className="text-slate-600 dark:text-slate-400 print:text-gray-700">
								{invoice.clientCompany}
							</p>
						)}
						{invoice.clientTaxNumber && (
							<p className="text-slate-600 dark:text-slate-400 print:text-gray-700">
								{t("finance.invoices.taxNumber")}: {invoice.clientTaxNumber}
							</p>
						)}
						{invoice.clientAddress && (
							<p className="text-slate-600 dark:text-slate-400 print:text-gray-700">
								{invoice.clientAddress}
							</p>
						)}
						{invoice.clientPhone && (
							<p className="text-slate-600 dark:text-slate-400 print:text-gray-700">
								{invoice.clientPhone}
							</p>
						)}
						{invoice.clientEmail && (
							<p className="text-slate-600 dark:text-slate-400 print:text-gray-700">
								{invoice.clientEmail}
							</p>
						)}
					</div>

					{/* ─── Items Table ────────────────────────────────────── */}
					<div className="mb-8 overflow-x-auto">
						<table className="w-full">
							<thead>
								<tr className="border-b-2 border-slate-200 dark:border-slate-700 print:border-gray-400">
									<th className="py-3 text-start text-sm font-medium text-slate-500 dark:text-slate-400 w-12 print:text-gray-600">
										#
									</th>
									<th className="py-3 text-start text-sm font-medium text-slate-500 dark:text-slate-400 print:text-gray-600">
										{t("finance.items.description")}
									</th>
									<th className="py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400 print:text-gray-600">
										{t("finance.items.unit")}
									</th>
									<th className="py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400 print:text-gray-600">
										{t("finance.items.quantity")}
									</th>
									<th className="py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400 print:text-gray-600">
										{t("finance.items.unitPrice")}
									</th>
									<th className="py-3 text-end text-sm font-medium text-slate-500 dark:text-slate-400 print:text-gray-600">
										{t("finance.items.total")}
									</th>
								</tr>
							</thead>
							<tbody>
								{invoice.items.map((item, index) => (
									<tr
										key={item.id}
										className="border-b border-slate-100 dark:border-slate-800 print:border-gray-200"
									>
										<td className="py-3 text-slate-500 dark:text-slate-400 print:text-gray-600">
											{index + 1}
										</td>
										<td className="py-3 text-slate-900 dark:text-slate-100 print:text-black">
											{item.description}
										</td>
										<td className="py-3 text-center text-slate-700 dark:text-slate-300 print:text-gray-700">
											{item.unit || "-"}
										</td>
										<td className="py-3 text-center text-slate-700 dark:text-slate-300 print:text-gray-700">
											{item.quantity}
										</td>
										<td className="py-3 text-center text-slate-700 dark:text-slate-300 print:text-gray-700">
											<Currency amount={item.unitPrice} />
										</td>
										<td className="py-3 text-end font-medium text-slate-900 dark:text-slate-100 print:text-black">
											<Currency amount={item.totalPrice} />
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{/* ─── Totals ─────────────────────────────────────────── */}
					<div className="flex justify-end mb-8">
						<div className="w-80 space-y-2">
							{/* Subtotal */}
							<div className="flex justify-between text-slate-700 dark:text-slate-300 print:text-gray-700">
								<span>{t("finance.summary.subtotal")}</span>
								<span className="font-medium">
									<Currency amount={invoice.subtotal} />
								</span>
							</div>

							{/* Discount */}
							{invoice.discountAmount > 0 && (
								<>
									<div className="flex justify-between text-red-600 dark:text-red-400 print:text-red-700">
										<span>
											{t("finance.summary.discount")} (
											{invoice.discountPercent}%)
										</span>
										<span>
											-<Currency amount={invoice.discountAmount} />
										</span>
									</div>
									{/* Taxable Amount */}
									<div className="flex justify-between text-slate-700 dark:text-slate-300 print:text-gray-700">
										<span>{t("finance.summary.taxableAmount")}</span>
										<span className="font-medium">
											<Currency amount={taxableAmount} />
										</span>
									</div>
								</>
							)}

							{/* VAT */}
							<div className="flex justify-between text-slate-700 dark:text-slate-300 print:text-gray-700">
								<span>
									{t("finance.summary.vat")} ({invoice.vatPercent}%)
								</span>
								<span className="font-medium">
									<Currency amount={invoice.vatAmount} />
								</span>
							</div>

							{/* Total */}
							<div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold text-lg print:border-gray-400">
								<span className="text-slate-900 dark:text-slate-100 print:text-black">
									{t("finance.summary.total")}
								</span>
								<span className="text-primary print:text-black">
									<Currency amount={invoice.totalAmount} />
								</span>
							</div>

							{/* Paid / Remaining */}
							{invoice.paidAmount > 0 && (
								<>
									<div className="flex justify-between text-green-600 dark:text-green-400 print:text-green-700">
										<span>{t("finance.invoices.paidAmount")}</span>
										<span>
											-<Currency amount={invoice.paidAmount} />
										</span>
									</div>
									<div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold print:border-gray-400">
										<span
											className={
												remainingAmount > 0
													? "text-amber-600 dark:text-amber-400 print:text-amber-700"
													: "text-green-600 dark:text-green-400 print:text-green-700"
											}
										>
											{t("finance.invoices.remainingAmount")}
										</span>
										<span
											className={
												remainingAmount > 0
													? "text-amber-600 dark:text-amber-400 print:text-amber-700"
													: "text-green-600 dark:text-green-400 print:text-green-700"
											}
										>
											<Currency amount={remainingAmount} />
										</span>
									</div>
								</>
							)}
						</div>
					</div>

					{/* ─── Payments Table ─────────────────────────────────── */}
					{invoice.payments && invoice.payments.length > 0 && (
						<div className="mb-8 border-t border-slate-200 dark:border-slate-700 pt-6 print:border-gray-300">
							<h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2 print:text-black">
								<CreditCard className="h-4 w-4" />
								{t("finance.invoices.payments")}
							</h3>
							<table className="w-full">
								<thead>
									<tr className="border-b border-slate-200 dark:border-slate-700 print:border-gray-300">
										<th className="py-2 text-start text-sm font-medium text-slate-500 dark:text-slate-400 print:text-gray-600">
											{t("finance.invoices.paymentDate")}
										</th>
										<th className="py-2 text-start text-sm font-medium text-slate-500 dark:text-slate-400 print:text-gray-600">
											{t("finance.invoices.paymentMethod")}
										</th>
										<th className="py-2 text-start text-sm font-medium text-slate-500 dark:text-slate-400 print:text-gray-600">
											{t("finance.invoices.referenceNo")}
										</th>
										<th className="py-2 text-end text-sm font-medium text-slate-500 dark:text-slate-400 print:text-gray-600">
											{t("finance.invoices.amount")}
										</th>
									</tr>
								</thead>
								<tbody>
									{invoice.payments.map((payment) => (
										<tr
											key={payment.id}
											className="border-b border-slate-100 dark:border-slate-800 print:border-gray-200"
										>
											<td className="py-2 text-slate-700 dark:text-slate-300 print:text-gray-700">
												{formatDate(payment.paymentDate)}
											</td>
											<td className="py-2 text-slate-700 dark:text-slate-300 print:text-gray-700">
												{payment.paymentMethod || "-"}
											</td>
											<td className="py-2 text-slate-700 dark:text-slate-300 print:text-gray-700">
												{payment.referenceNo || "-"}
											</td>
											<td className="py-2 text-end font-medium text-green-600 dark:text-green-400 print:text-green-700">
												<Currency amount={payment.amount} />
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}

					{/* ─── ZATCA QR Section (bottom, for all tax/simplified) ── */}
					{showQR && (
						<div className="mb-8 border-t border-slate-200 dark:border-slate-700 pt-6 print:border-gray-300">
							<div className="flex items-center gap-4">
								<div className="bg-white p-4 rounded-lg border border-slate-200 print:border-gray-400">
									<img
										src={invoice.qrCode ?? undefined}
										alt="ZATCA QR Code"
										className="w-32 h-32 print:w-24 print:h-24"
										style={{ minWidth: "5rem", minHeight: "5rem" }}
									/>
								</div>
								<div>
									<h3 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2 print:text-black">
										<QrCode className="h-4 w-4" />
										{t("finance.invoices.zatcaQrTitle")}
									</h3>
									<p className="text-sm text-slate-500 dark:text-slate-400 mt-1 print:text-gray-600">
										{t("finance.invoices.zatcaCompliance")}
									</p>
									{invoice.zatcaUuid && (
										<p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-2 break-all print:text-gray-500">
											UUID: {invoice.zatcaUuid}
										</p>
									)}
								</div>
							</div>
						</div>
					)}

					{/* ─── Payment Terms ──────────────────────────────────── */}
					{invoice.paymentTerms && (
						<div className="border-t border-slate-200 dark:border-slate-700 pt-6 mb-4 print:border-gray-300">
							<h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1 print:text-black">
								{t("finance.invoices.paymentTerms")}
							</h3>
							<p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap print:text-gray-700">
								{invoice.paymentTerms}
							</p>
						</div>
					)}

					{/* ─── Notes ──────────────────────────────────────────── */}
					{invoice.notes && (
						<div className="pt-4 border-t border-slate-200 dark:border-slate-700 print:border-gray-300">
							<h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1 print:text-black">
								{t("finance.invoices.notes")}
							</h3>
							<p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap print:text-gray-700">
								{invoice.notes}
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
