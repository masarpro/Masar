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
		// Card layout
		layout?: "default" | "left-aligned" | "card";
		background?: string;
		borderColor?: string;
		borderRadius?: string;
		width?: string;
		// Total styling
		totalBackground?: string;
		totalTextColor?: string;
		totalAmountColor?: string;
		totalBorderTop?: string;
		totalFontSize?: string;
		totalColor?: string;
		totalDivider?: "line" | "gradient";
		totalDividerGradient?: string;
		// Paid/Remaining
		showPaidAmount?: boolean;
		showRemainingAmount?: boolean;
		paidColor?: string;
		remainingColor?: string;
	};
	totals?: {
		subtotal: number;
		discountPercent?: number;
		discountAmount?: number;
		vatPercent?: number;
		vatAmount?: number;
		total: number;
		paidAmount?: number;
		remainingAmount?: number;
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
		layout = "default",
		background,
		borderColor: cardBorderColor,
		borderRadius = "0",
		width,
		totalBackground,
		totalTextColor,
		totalAmountColor,
		totalBorderTop,
		totalFontSize,
		totalColor,
		totalDivider,
		totalDividerGradient,
		showPaidAmount = false,
		showRemainingAmount = false,
		paidColor = "#16a34a",
		remainingColor = "#dc2626",
	} = settings;

	const defaultTotals = {
		subtotal: 15000,
		discountPercent: 5,
		discountAmount: 750,
		vatPercent: 15,
		vatAmount: 2137.5,
		total: 16387.5,
		paidAmount: 0,
		remainingAmount: 16387.5,
	};

	const displayTotals = totals || defaultTotals;
	const paid = displayTotals.paidAmount ?? 0;
	const remaining =
		displayTotals.remainingAmount ?? displayTotals.total - paid;

	const formatPercent = (value: number) => {
		return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
			style: "percent",
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(value / 100);
	};

	// Determine alignment
	const justifyClass =
		layout === "left-aligned" ? "justify-start" : "justify-end";

	// Card wrapper styles
	const isCard = layout === "card";
	const containerWidth = width || "320px";

	// Build total row style
	const totalRowStyle: React.CSSProperties = {};
	if (highlightTotal) {
		totalRowStyle.backgroundColor =
			totalBackground || primaryColor;
		totalRowStyle.color = totalTextColor || "#ffffff";
		totalRowStyle.borderRadius = "6px";
	}
	if (totalBorderTop) {
		totalRowStyle.borderTop = totalBorderTop;
	}

	return (
		<div className="py-4">
			<div className={`flex ${justifyClass}`}>
				<div
					style={{
						width: containerWidth,
						background: isCard ? background || "transparent" : undefined,
						border:
							isCard && cardBorderColor
								? `1px solid ${cardBorderColor}`
								: undefined,
						borderRadius: isCard ? borderRadius : undefined,
						padding: isCard ? "12px 16px" : undefined,
					}}
					className="space-y-2"
				>
					{/* Subtotal */}
					<div className="flex justify-between py-2 border-b border-slate-200">
						<span className="text-slate-600">
							{t("finance.templates.preview.subtotal")}
						</span>
						<span className="font-medium text-slate-900" dir="ltr">
							<Currency
								amount={displayTotals.subtotal}
															/>
						</span>
					</div>

					{/* Discount */}
					{showDiscount &&
						displayTotals.discountPercent &&
						displayTotals.discountPercent > 0 && (
							<div className="flex justify-between py-2 border-b border-slate-200">
								<span className="text-slate-600">
									{t("finance.templates.preview.discount")} (
									{formatPercent(displayTotals.discountPercent)})
								</span>
								<span className="font-medium text-red-600" dir="ltr">
									-
									<Currency
										amount={displayTotals.discountAmount || 0}
																			/>
								</span>
							</div>
						)}

					{/* VAT */}
					{showVat &&
						displayTotals.vatPercent &&
						displayTotals.vatPercent > 0 && (
							<div className="flex justify-between py-2 border-b border-slate-200">
								<span className="text-slate-600">
									{t("finance.templates.preview.vat")} (
									{formatPercent(displayTotals.vatPercent)})
								</span>
								<span className="font-medium text-slate-900" dir="ltr">
									<Currency
										amount={displayTotals.vatAmount || 0}
																			/>
								</span>
							</div>
						)}

					{/* Gradient divider */}
					{totalDivider === "gradient" && totalDividerGradient && (
						<div
							className="h-0.5 rounded-full my-1"
							style={{ background: totalDividerGradient }}
						/>
					)}

					{/* Total */}
					<div
						className={`flex justify-between py-3 px-4 ${highlightTotal && !totalBorderTop ? "text-white" : ""}`}
						style={{
							...totalRowStyle,
							fontSize: totalFontSize || undefined,
						}}
					>
						<span
							className={`font-semibold ${highlightTotal ? "" : "text-slate-900"}`}
						>
							{t("finance.templates.preview.totalAmount")}
						</span>
						<span
							className={`font-bold text-lg ${highlightTotal ? "" : "text-slate-900"}`}
							style={{
								color: totalAmountColor || totalColor || undefined,
							}}
							dir="ltr"
						>
							<Currency
								amount={displayTotals.total}
															/>
						</span>
					</div>

					{/* Paid Amount */}
					{showPaidAmount && paid > 0 && (
						<div className="flex justify-between py-1 text-sm">
							<span className="text-slate-500">
								{t("finance.invoices.paid")}
							</span>
							<span style={{ color: paidColor }} dir="ltr">
								<Currency amount={paid} />
							</span>
						</div>
					)}

					{/* Remaining Amount */}
					{showRemainingAmount && remaining > 0 && (
						<div className="flex justify-between py-1 text-sm">
							<span className="text-slate-500">
								{t("finance.invoices.remaining")}
							</span>
							<span
								className="font-bold"
								style={{ color: remainingColor }}
								dir="ltr"
							>
								<Currency amount={remaining} />
							</span>
						</div>
					)}

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
