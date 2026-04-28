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
	const totalCost =
		(pricing.materialUnitPrice + pricing.laborUnitPrice) * effectiveQty;
	const isProfit = pricing.profitAmount >= 0;

	const handleToggleCustomMarkup = (custom: boolean) => {
		if (custom) {
			pricing.updateField(
				"markup_percent",
				pricing.markupPercent || globalMarkupPercent,
			);
		} else {
			pricing.updateField("markup_percent", globalMarkupPercent);
		}
	};

	const handleMethodChange = (method: MarkupMethod) => {
		if (method === "percentage") {
			pricing.updateField("markup_percent", pricing.markupPercent || 30);
		} else if (method === "fixed_amount") {
			pricing.updateField(
				"markup_fixed_amount",
				pricing.markupFixedAmount || 5,
			);
		} else if (method === "manual_price") {
			pricing.updateField(
				"manual_unit_price",
				pricing.sellUnitPrice || pricing.materialUnitPrice + pricing.laborUnitPrice,
			);
		}
	};

	return (
		<Card className="border-violet-200 bg-violet-50/40 p-4 dark:border-violet-900 dark:bg-violet-950/20">
			<div className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h4 className="text-sm font-semibold text-violet-700 dark:text-violet-300">
						📊 الربح والسعر النهائي
					</h4>
					<div className="flex items-center gap-2">
						<Switch
							id={`custom-markup-${item.id}`}
							checked={pricing.hasCustomMarkup}
							onCheckedChange={handleToggleCustomMarkup}
						/>
						<Label
							htmlFor={`custom-markup-${item.id}`}
							className="text-xs"
						>
							هامش خاص
							{!pricing.hasCustomMarkup && (
								<span className="ms-1 text-muted-foreground">
									(يتبع العام {globalMarkupPercent.toFixed(0)}%)
								</span>
							)}
						</Label>
					</div>
				</div>

				{pricing.hasCustomMarkup && (
					<MarkupMethodSelector
						value={pricing.markupMethod}
						onChange={handleMethodChange}
					/>
				)}

				<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
					{pricing.markupMethod === "percentage" && (
						<BiDirectionalPriceInput
							id={`${item.id}-mp`}
							label="نسبة الربح"
							value={pricing.markupPercent}
							unit="%"
							onChange={(v) => pricing.updateField("markup_percent", v)}
							isLoading={pricing.isLoading}
							precision={1}
							min={-50}
							max={1000}
						/>
					)}

					{pricing.markupMethod === "fixed_amount" && (
						<BiDirectionalPriceInput
							id={`${item.id}-mf`}
							label="ربح ثابت/وحدة"
							value={pricing.markupFixedAmount}
							unit="ر.س"
							onChange={(v) =>
								pricing.updateField("markup_fixed_amount", v)
							}
							isLoading={pricing.isLoading}
						/>
					)}

					{pricing.markupMethod === "manual_price" && (
						<div className="flex items-center text-xs text-muted-foreground md:col-span-1">
							<Info className="me-2 h-4 w-4" />
							<span>السعر اليدوي يتجاوز الحساب</span>
						</div>
					)}

					<BiDirectionalPriceInput
						id={`${item.id}-su`}
						label="سعر الوحدة"
						value={pricing.sellUnitPrice}
						unit={`ر.س/${item.unit}`}
						onChange={(v) => pricing.updateField("sell_unit_price", v)}
						isLoading={pricing.isLoading}
						precision={4}
					/>

					<BiDirectionalPriceInput
						id={`${item.id}-st`}
						label="إجمالي البيع"
						value={pricing.sellTotalAmount}
						unit="ر.س"
						onChange={(v) => pricing.updateField("sell_total_amount", v)}
						isLoading={pricing.isLoading}
					/>
				</div>

				<div className="rounded-lg border border-violet-200 bg-background p-3 dark:border-violet-800">
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<p className="text-xs text-muted-foreground">إجمالي التكلفة</p>
							<p className="font-medium tabular-nums">{fmt(totalCost)} ر.س</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">إجمالي البيع</p>
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
									isProfit ? "text-emerald-600" : "text-red-600"
								}`}
							>
								{fmt(pricing.profitAmount)} ر.س
								<span className="ms-2 text-sm font-normal">
									({pricing.profitPercent.toFixed(1)}% من البيع)
								</span>
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
