"use client";

import { useTranslations, useLocale } from "next-intl";
import { Currency } from "../../shared/Currency";
import { getAmountInWords } from "../../../lib/default-templates";

interface TotalsComponentProps {
	settings: {
		showDiscount?: boolean;
		showVat?: boolean;
		showAmountInWords?: boolean;
		highlightTotal?: boolean;
	};
	totals?: {
		subtotal: number;
		discountPercent?: number;
		discountAmount?: number;
		vatPercent?: number;
		vatAmount?: number;
		total: number;
	};
	primaryColor?: string;
	currency?: string;
}

export function TotalsComponent({
	settings,
	totals,
	primaryColor = "#3b82f6",
	currency = "SAR",
}: TotalsComponentProps) {
	const t = useTranslations();
	const locale = useLocale();
	const {
		showDiscount = true,
		showVat = true,
		showAmountInWords = false,
		highlightTotal = true,
	} = settings;

	const defaultTotals = {
		subtotal: 15000,
		discountPercent: 5,
		discountAmount: 750,
		vatPercent: 15,
		vatAmount: 2137.5,
		total: 16387.5,
	};

	const displayTotals = totals || defaultTotals;

	// Format percentage for display
	const formatPercent = (value: number) => {
		return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
			style: "percent",
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(value / 100);
	};

	return (
		<div className="py-4">
			<div className="flex justify-end">
				<div className="w-80 space-y-2">
					{/* Subtotal */}
					<div className="flex justify-between py-2 border-b border-slate-200">
						<span className="text-slate-600">
							{t("finance.templates.preview.subtotal")}
						</span>
						<span className="font-medium text-slate-900" dir="ltr">
							<Currency amount={displayTotals.subtotal} currency={currency} />
						</span>
					</div>

					{/* Discount */}
					{showDiscount && displayTotals.discountPercent && displayTotals.discountPercent > 0 && (
						<div className="flex justify-between py-2 border-b border-slate-200">
							<span className="text-slate-600">
								{t("finance.templates.preview.discount")} ({formatPercent(displayTotals.discountPercent)})
							</span>
							<span className="font-medium text-red-600" dir="ltr">
								-<Currency amount={displayTotals.discountAmount || 0} currency={currency} />
							</span>
						</div>
					)}

					{/* VAT */}
					{showVat && displayTotals.vatPercent && displayTotals.vatPercent > 0 && (
						<div className="flex justify-between py-2 border-b border-slate-200">
							<span className="text-slate-600">
								{t("finance.templates.preview.vat")} ({formatPercent(displayTotals.vatPercent)})
							</span>
							<span className="font-medium text-slate-900" dir="ltr">
								<Currency amount={displayTotals.vatAmount || 0} currency={currency} />
							</span>
						</div>
					)}

					{/* Total */}
					<div
						className={`flex justify-between py-3 px-4 ${highlightTotal ? "rounded-xl text-white" : "border-t-2 border-slate-300"}`}
						style={highlightTotal ? { backgroundColor: primaryColor } : {}}
					>
						<span className={`font-semibold ${highlightTotal ? "" : "text-slate-900"}`}>
							{t("finance.templates.preview.totalAmount")}
						</span>
						<span className={`font-bold text-lg ${highlightTotal ? "" : "text-slate-900"}`} dir="ltr">
							<Currency amount={displayTotals.total} currency={currency} />
						</span>
					</div>

					{/* Amount in Words */}
					{showAmountInWords && (
						<div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
							<p className="text-xs text-slate-500 mb-1">
								{t("finance.templates.preview.amountInWords")}
							</p>
							<p className="text-sm text-slate-700 font-medium">
								{getAmountInWords(displayTotals.total, locale)}
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
