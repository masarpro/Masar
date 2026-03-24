"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Printer, ArrowLeft } from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { numberToArabicWords } from "@repo/utils";
import { Currency } from "../shared/Currency";
import { PreviewPageSkeleton } from "@saas/shared/components/skeletons";

interface PaymentVoucherProps {
	organizationId: string;
	organizationSlug: string;
	expenseId: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
	CASH: "نقدي",
	BANK_TRANSFER: "تحويل بنكي",
	CHEQUE: "شيك",
	CREDIT_CARD: "بطاقة ائتمان",
	OTHER: "أخرى",
};

export function PaymentVoucher({
	organizationId,
	organizationSlug,
	expenseId,
}: PaymentVoucherProps) {
	const t = useTranslations();
	const router = useRouter();
	const printRef = useRef<HTMLDivElement>(null);

	const { data: expense, isLoading } = useQuery(
		orpc.finance.expenses.getById.queryOptions({
			input: { organizationId, id: expenseId },
		}),
	);

	const handlePrint = () => {
		window.print();
	};

	if (isLoading) {
		return <PreviewPageSkeleton />;
	}

	if (!expense) {
		return (
			<div className="text-center py-20">
				<p className="text-slate-500">{t("common.notFound")}</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Actions - hidden when printing */}
			<div className="flex items-center justify-between print:hidden">
				<Button
					variant="outline"
					onClick={() => router.back()}
					className="rounded-xl"
				>
					<ArrowLeft className="h-4 w-4 me-2" />
					{t("common.back")}
				</Button>
				<div className="flex gap-2">
					<Button onClick={handlePrint} className="rounded-xl">
						<Printer className="h-4 w-4 me-2" />
						{t("common.print")}
					</Button>
				</div>
			</div>

			{/* Payment Voucher */}
			<div ref={printRef} className="voucher-print-area print:m-0">
				<Card className="rounded-2xl print:rounded-none print:shadow-none print:border-2 print:border-black max-w-[210mm] mx-auto">
					<CardContent className="p-8">
						{/* Header */}
						<div className="text-center border-b-2 border-dashed border-slate-300 pb-6 mb-6">
							<h1 className="text-2xl font-bold text-slate-900 mb-2">
								سند صرف
							</h1>
							<p className="text-lg text-slate-600">Payment Voucher</p>
						</div>

						{/* Voucher Number and Date */}
						<div className="flex justify-between mb-8">
							<div className="text-center">
								<p className="text-sm text-slate-500 mb-1">رقم السند</p>
								<p className="text-xl font-bold text-primary">
									{expense.voucherNo || expense.expenseNo}
								</p>
							</div>
							<div className="text-center">
								<p className="text-sm text-slate-500 mb-1">التاريخ</p>
								<p className="text-xl font-bold">{formatDate(new Date(expense.date))}</p>
							</div>
						</div>

						{/* Amount Box */}
						<div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 mb-8 border-2 border-red-200 dark:border-red-800">
							<div className="text-center">
								<p className="text-sm text-slate-500 mb-2">المبلغ</p>
								<p className="text-4xl font-bold text-red-600 dark:text-red-400 mb-4">
									<Currency amount={Number(expense.amount)} />
								</p>
								<p className="text-sm text-slate-600 dark:text-slate-400">
									{numberToArabicWords(Number(expense.amount))}
								</p>
							</div>
						</div>

						{/* Details Grid */}
						<div className="space-y-4 mb-8">
							{/* Paid To */}
							<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
								<span className="text-slate-500">صُرف إلى</span>
								<span className="font-medium">
									{expense.vendorName || "—"}
								</span>
							</div>

							{/* Description */}
							{expense.description && (
								<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
									<span className="text-slate-500">وذلك عن</span>
									<span className="font-medium">{expense.description}</span>
								</div>
							)}

							{/* Category */}
							<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
								<span className="text-slate-500">التصنيف</span>
								<span className="font-medium">{expense.category}</span>
							</div>

							{/* Payment Method */}
							<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
								<span className="text-slate-500">طريقة الدفع</span>
								<span className="font-medium">
									{PAYMENT_METHOD_LABELS[expense.paymentMethod] ?? expense.paymentMethod}
								</span>
							</div>

							{/* Reference Number */}
							{expense.referenceNo && (
								<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
									<span className="text-slate-500">رقم المرجع</span>
									<span className="font-medium font-mono">{expense.referenceNo}</span>
								</div>
							)}

							{/* Source Account */}
							{expense.sourceAccount && (
								<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
									<span className="text-slate-500">الحساب المصدر</span>
									<span className="font-medium">{expense.sourceAccount.name}</span>
								</div>
							)}

							{/* Project */}
							{expense.project && (
								<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
									<span className="text-slate-500">المشروع</span>
									<span className="font-medium">{expense.project.name}</span>
								</div>
							)}

							{/* Vendor Tax Number */}
							{expense.vendorTaxNumber && (
								<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
									<span className="text-slate-500">الرقم الضريبي للمورد</span>
									<span className="font-medium font-mono">{expense.vendorTaxNumber}</span>
								</div>
							)}
						</div>

						{/* Signatures */}
						<div className="grid grid-cols-3 gap-8 pt-8 border-t-2 border-dashed border-slate-300">
							<div className="text-center">
								<div className="h-16 border-b border-slate-300 mb-2" />
								<p className="text-sm text-slate-500">المحاسب</p>
							</div>
							<div className="text-center">
								<div className="h-16 border-b border-slate-300 mb-2" />
								<p className="text-sm text-slate-500">المدير المالي</p>
							</div>
							<div className="text-center">
								<div className="h-16 border-b border-slate-300 mb-2" />
								<p className="text-sm text-slate-500">المستلم</p>
							</div>
						</div>

						{/* Footer */}
						<div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
							<p>تم التوليد في {formatDate(new Date())}</p>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Print Styles */}
			<style jsx global>{`
				@media print {
					body * {
						visibility: hidden;
					}
					.print\\:hidden {
						display: none !important;
					}
					.voucher-print-area,
					.voucher-print-area * {
						visibility: visible;
					}
					.voucher-print-area {
						position: absolute;
						left: 0;
						top: 0;
						width: 100%;
					}
				}
			`}</style>
		</div>
	);
}
