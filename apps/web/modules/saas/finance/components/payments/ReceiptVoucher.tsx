"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Printer, ArrowLeft, Download } from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { Currency } from "../shared/Currency";

interface ReceiptVoucherProps {
	organizationId: string;
	organizationSlug: string;
	paymentId: string;
}

export function ReceiptVoucher({
	organizationId,
	organizationSlug,
	paymentId,
}: ReceiptVoucherProps) {
	const t = useTranslations();
	const router = useRouter();
	const printRef = useRef<HTMLDivElement>(null);

	// Fetch payment
	const { data: paymentData, isLoading } = useQuery(
		orpc.finance.orgPayments.getById.queryOptions({
			input: { organizationId, id: paymentId },
		}),
	);

	const payment = paymentData?.payment;

	const handlePrint = () => {
		window.print();
	};

	const getPaymentMethodLabel = (method: string) => {
		return t(`finance.payments.methods.${method.toLowerCase()}`);
	};

	// Convert number to Arabic words
	const numberToArabicWords = (num: number): string => {
		const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
		const tens = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
		const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];
		const thousands = ["", "ألف", "ألفان", "ثلاثة آلاف", "أربعة آلاف", "خمسة آلاف", "ستة آلاف", "سبعة آلاف", "ثمانية آلاف", "تسعة آلاف"];

		if (num === 0) return "صفر";

		const intPart = Math.floor(num);
		const decPart = Math.round((num - intPart) * 100);

		let result = "";

		// Thousands
		const thousandsPart = Math.floor(intPart / 1000);
		if (thousandsPart > 0 && thousandsPart < 10) {
			result += thousands[thousandsPart] + " ";
		} else if (thousandsPart >= 10) {
			result += thousandsPart.toString() + " ألف ";
		}

		// Hundreds
		const hundredsPart = Math.floor((intPart % 1000) / 100);
		if (hundredsPart > 0) {
			result += hundreds[hundredsPart] + " ";
		}

		// Tens and ones
		const tensPart = Math.floor((intPart % 100) / 10);
		const onesPart = intPart % 10;

		if (tensPart === 1 && onesPart > 0) {
			// Special case for 11-19
			result += ones[onesPart] + " عشر ";
		} else {
			if (onesPart > 0) {
				result += ones[onesPart] + " ";
			}
			if (tensPart > 1) {
				result += (onesPart > 0 ? "و" : "") + tens[tensPart] + " ";
			} else if (tensPart === 1) {
				result += "عشرة ";
			}
		}

		result += "ريال";

		if (decPart > 0) {
			result += " و" + decPart + " هللة";
		}

		return result.trim();
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (!payment) {
		return (
			<div className="text-center py-20">
				<p className="text-slate-500">{t("finance.payments.notFound")}</p>
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

			{/* Receipt Voucher */}
			<div ref={printRef} className="print:m-0">
				<Card className="rounded-2xl print:rounded-none print:shadow-none print:border-2 print:border-black max-w-2xl mx-auto">
					<CardContent className="p-8">
						{/* Header */}
						<div className="text-center border-b-2 border-dashed border-slate-300 pb-6 mb-6">
							<h1 className="text-2xl font-bold text-slate-900 mb-2">
								{t("finance.receipt.title")}
							</h1>
							<p className="text-lg text-slate-600">Receipt Voucher</p>
						</div>

						{/* Receipt Number and Date */}
						<div className="flex justify-between mb-8">
							<div className="text-center">
								<p className="text-sm text-slate-500 mb-1">{t("finance.receipt.number")}</p>
								<p className="text-xl font-bold text-primary">{payment.paymentNo}</p>
							</div>
							<div className="text-center">
								<p className="text-sm text-slate-500 mb-1">{t("finance.receipt.date")}</p>
								<p className="text-xl font-bold">{formatDate(new Date(payment.date))}</p>
							</div>
						</div>

						{/* Amount Box */}
						<div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-8 border-2 border-green-200 dark:border-green-800">
							<div className="text-center">
								<p className="text-sm text-slate-500 mb-2">{t("finance.receipt.amount")}</p>
								<p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-4">
									<Currency amount={Number(payment.amount)} />
								</p>
								<p className="text-sm text-slate-600 dark:text-slate-400">
									{numberToArabicWords(Number(payment.amount))}
								</p>
							</div>
						</div>

						{/* Details Grid */}
						<div className="space-y-4 mb-8">
							{/* Client */}
							<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
								<span className="text-slate-500">{t("finance.receipt.receivedFrom")}</span>
								<span className="font-medium">
									{payment.client?.name || payment.clientName || "-"}
								</span>
							</div>

							{/* Payment Method */}
							<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
								<span className="text-slate-500">{t("finance.receipt.paymentMethod")}</span>
								<span className="font-medium">
									{getPaymentMethodLabel(payment.paymentMethod)}
								</span>
							</div>

							{/* Reference Number */}
							{payment.referenceNo && (
								<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
									<span className="text-slate-500">{t("finance.receipt.referenceNo")}</span>
									<span className="font-medium font-mono">{payment.referenceNo}</span>
								</div>
							)}

							{/* Deposited To */}
							<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
								<span className="text-slate-500">{t("finance.receipt.depositedTo")}</span>
								<span className="font-medium">{payment.destinationAccount?.name}</span>
							</div>

							{/* Project */}
							{payment.project && (
								<div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
									<span className="text-slate-500">{t("finance.receipt.project")}</span>
									<span className="font-medium">{payment.project.name}</span>
								</div>
							)}

							{/* Description */}
							{payment.description && (
								<div className="py-3">
									<span className="text-slate-500 block mb-2">{t("finance.receipt.description")}</span>
									<p className="text-slate-700 dark:text-slate-300">{payment.description}</p>
								</div>
							)}
						</div>

						{/* Signatures */}
						<div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-dashed border-slate-300">
							<div className="text-center">
								<div className="h-16 border-b border-slate-300 mb-2" />
								<p className="text-sm text-slate-500">{t("finance.receipt.receiverSignature")}</p>
							</div>
							<div className="text-center">
								<div className="h-16 border-b border-slate-300 mb-2" />
								<p className="text-sm text-slate-500">{t("finance.receipt.cashierSignature")}</p>
							</div>
						</div>

						{/* Footer */}
						<div className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
							<p>{t("finance.receipt.generatedOn")} {formatDate(new Date())}</p>
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
					div[ref="printRef"],
					div[ref="printRef"] * {
						visibility: visible;
					}
					div[ref="printRef"] {
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
