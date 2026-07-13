"use client";

import { useTranslations } from "next-intl";
import { Currency } from "./Currency";

interface AmountSummaryProps {
	subtotal: number;
	discountPercent: number;
	discountAmount: number;
	vatPercent: number;
	vatAmount: number;
	totalAmount: number;
	paidAmount?: number;
	remainingAmount?: number;
}

export function AmountSummary({
	subtotal,
	discountPercent,
	discountAmount,
	vatPercent,
	vatAmount,
	totalAmount,
	paidAmount,
	remainingAmount,
}: AmountSummaryProps) {
	const t = useTranslations();
	const taxableAmount = subtotal - discountAmount;

	return (
		<div className="w-full max-w-sm space-y-2 p-4 rounded-2xl bg-muted/50">
			<div className="flex justify-between text-sm">
				<span className="text-muted-foreground">
					{t("finance.summary.subtotal")}
				</span>
				<span className="font-medium"><Currency amount={subtotal} /></span>
			</div>

			{discountPercent > 0 && (
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">
						{t("finance.summary.discount")} ({discountPercent}%)
					</span>
					<span className="font-medium text-destructive">
						<Currency amount={-Math.abs(discountAmount)} />
					</span>
				</div>
			)}

			{discountPercent > 0 && (
				<div className="flex justify-between text-sm">
					<span className="text-muted-foreground">
						{t("finance.summary.taxableAmount")}
					</span>
					<span className="font-medium"><Currency amount={taxableAmount} /></span>
				</div>
			)}

			<div className="flex justify-between text-sm">
				<span className="text-muted-foreground">
					{t("finance.summary.vat")} ({vatPercent}%)
				</span>
				<span className="font-medium"><Currency amount={vatAmount} /></span>
			</div>

			<div className="border-t border-border pt-2 mt-2">
				<div className="flex justify-between">
					<span className="font-bold text-lg text-foreground">
						{t("finance.summary.total")}
					</span>
					<span className="font-bold text-lg text-primary">
						<Currency amount={totalAmount} />
					</span>
				</div>
			</div>

			{paidAmount != null && paidAmount > 0 && (
				<>
					<div className="flex justify-between text-sm text-success pt-1">
						<span>{t("finance.summary.paidAmount")}</span>
						<span>-<Currency amount={paidAmount} /></span>
					</div>
					<div className="flex justify-between font-bold">
						<span
							className={
								(remainingAmount ?? 0) > 0
									? "text-destructive"
									: "text-success"
							}
						>
							{t("finance.summary.remainingAmount")}
						</span>
						<span
							className={
								(remainingAmount ?? 0) > 0
									? "text-destructive"
									: "text-success"
							}
						>
							<Currency amount={remainingAmount ?? 0} />
						</span>
					</div>
				</>
			)}
		</div>
	);
}
