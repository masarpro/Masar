"use client";

import { Card } from "@ui/components/card";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import { useBiDirectionalPricing } from "../hooks/useBiDirectionalPricing";
import { BiDirectionalPriceInput } from "../inputs/BiDirectionalPriceInput";
import { MarkupMethodSelector } from "../inputs/MarkupMethodSelector";
import type { MarkupMethod, QuantityItem } from "../types";

interface Props {
	item: QuantityItem;
	globalMarkupPercent: number;
}

const fmt = (n: number) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(n);

export function PricingSection({ item, globalMarkupPercent }: Props) {
	const pricing = useBiDirectionalPricing(item);
	const effectiveQty = Number(item.effectiveQuantity ?? 0);
	const unitCost = pricing.materialUnitPrice + pricing.laborUnitPrice;
	const totalCost = unitCost * effectiveQty;
	const isProfit = pricing.profitAmount >= 0;

	const handleToggleCustomMarkup = (custom: boolean) => {
		if (custom) {
			pricing.updateField(
				"markup_percent",
				pricing.markupPercent || globalMarkupPercent,
			);
		} else {
			// Use the dedicated revert path — bi-directional solver would
			// otherwise re-set hasCustomMarkup=true.
			pricing.revertToGlobal();
		}
	};

	const handleMethodChange = (method: MarkupMethod) => {
		if (method === "percentage") {
			pricing.updateField(
				"markup_percent",
				pricing.markupPercent || globalMarkupPercent,
			);
		} else if (method === "fixed_amount") {
			pricing.updateField(
				"markup_fixed_amount",
				pricing.markupFixedAmount || Math.max(5, unitCost * 0.3),
			);
		} else if (method === "manual_price") {
			pricing.updateField(
				"manual_unit_price",
				pricing.sellUnitPrice || unitCost,
			);
		}
	};

	// markup % — actual stored value for percentage; implied for manual_price.
	const displayMarkupPercent =
		pricing.markupMethod === "manual_price"
			? pricing.impliedMarkupPercent
			: pricing.markupPercent;

	return (
		<Card className="border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900 dark:bg-violet-950/20">
			<div className="space-y-4">
				{/* Header row — title + custom-markup toggle */}
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div className="flex flex-col gap-0.5">
						<h4 className="text-sm font-semibold text-violet-700 dark:text-violet-300">
							📊 الربح والسعر النهائي
						</h4>
						{!pricing.hasCustomMarkup && (
							<p className="text-[11px] text-muted-foreground">
								يتبع الهامش العام للدراسة (
								{globalMarkupPercent.toFixed(0)}%)
							</p>
						)}
					</div>
					<div className="flex items-center gap-2">
						<Switch
							id={`custom-markup-${item.id}`}
							checked={pricing.hasCustomMarkup}
							onCheckedChange={handleToggleCustomMarkup}
							disabled={pricing.isLoading}
						/>
						<Label
							htmlFor={`custom-markup-${item.id}`}
							className="text-xs"
						>
							هامش خاص
						</Label>
					</div>
				</div>

				{/* Method selector + the relevant markup input — only when custom */}
				{pricing.hasCustomMarkup && (
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<MarkupMethodSelector
							value={pricing.markupMethod}
							onChange={handleMethodChange}
						/>

						{pricing.markupMethod === "percentage" && (
							<BiDirectionalPriceInput
								id={`${item.id}-mp`}
								label="نسبة الربح (markup)"
								value={pricing.markupPercent}
								unit="%"
								onChange={(v) =>
									pricing.updateField("markup_percent", v)
								}
								isLoading={pricing.isLoading}
								precision={1}
								min={-50}
								max={1000}
							/>
						)}

						{pricing.markupMethod === "fixed_amount" && (
							<BiDirectionalPriceInput
								id={`${item.id}-mf`}
								label="ربح ثابت لكل وحدة"
								value={pricing.markupFixedAmount}
								unit="ر.س"
								onChange={(v) =>
									pricing.updateField("markup_fixed_amount", v)
								}
								isLoading={pricing.isLoading}
							/>
						)}

						{pricing.markupMethod === "manual_price" && (
							<div className="flex items-start gap-2 rounded-md border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
								<Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
								<div>
									<p>السعر اليدوي يتجاوز الحساب التلقائي.</p>
									{displayMarkupPercent !== null &&
										displayMarkupPercent !== undefined && (
											<p className="mt-0.5 tabular-nums">
												markup ضمني:{" "}
												{displayMarkupPercent.toFixed(1)}%
											</p>
										)}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Sell unit price + total — always editable; canonical-source rule
				    means editing either one switches method to manual_price. */}
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<BiDirectionalPriceInput
						id={`${item.id}-su`}
						label="سعر الوحدة"
						value={pricing.sellUnitPrice}
						unit={`ر.س/${item.unit}`}
						onChange={(v) => pricing.updateField("sell_unit_price", v)}
						isLoading={pricing.isLoading}
						precision={2}
					/>
					<BiDirectionalPriceInput
						id={`${item.id}-st`}
						label="إجمالي البيع"
						value={pricing.sellTotalAmount}
						unit="ر.س"
						onChange={(v) =>
							pricing.updateField("sell_total_amount", v)
						}
						isLoading={pricing.isLoading}
					/>
				</div>

				{/* Profit recap */}
				<div className="rounded-lg border border-violet-200 bg-background p-3 dark:border-violet-800">
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<p className="text-xs text-muted-foreground">
								إجمالي التكلفة
							</p>
							<p className="font-medium tabular-nums">
								{fmt(totalCost)} ر.س
							</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">
								إجمالي البيع
							</p>
							<p className="font-medium tabular-nums">
								{fmt(pricing.sellTotalAmount)} ر.س
							</p>
						</div>
						<div className="col-span-2 border-t pt-2">
							<div className="flex items-center gap-2">
								{isProfit ? (
									<TrendingUp className="h-4 w-4 text-emerald-600" />
								) : (
									<TrendingDown className="h-4 w-4 text-red-600" />
								)}
								<span className="text-xs text-muted-foreground">
									{isProfit ? "صافي الربح" : "خسارة"}
								</span>
							</div>
							<p
								className={`mt-1 text-lg font-bold tabular-nums ${
									isProfit
										? "text-emerald-600 dark:text-emerald-400"
										: "text-red-600 dark:text-red-400"
								}`}
							>
								{fmt(pricing.profitAmount)} ر.س
							</p>
							<p className="mt-0.5 text-[11px] text-muted-foreground">
								<span className="tabular-nums">
									{pricing.profitPercent.toFixed(1)}%
								</span>{" "}
								هامش من البيع
								{displayMarkupPercent !== null &&
									displayMarkupPercent !== undefined && (
										<>
											{" "}
											·{" "}
											<span className="tabular-nums">
												{displayMarkupPercent.toFixed(1)}%
											</span>{" "}
											markup من التكلفة
										</>
									)}
							</p>
						</div>
					</div>
				</div>

				{!isProfit && pricing.sellTotalAmount > 0 && (
					<div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
						⚠️ السعر الحالي أقل من التكلفة. تحقق من الأرقام أو ارفع السعر.
					</div>
				)}
			</div>
		</Card>
	);
}
