"use client";

import { Card } from "@ui/components/card";
import { useBiDirectionalPricing } from "../hooks/useBiDirectionalPricing";
import { BiDirectionalPriceInput } from "../inputs/BiDirectionalPriceInput";
import type { QuantityItem } from "../types";

interface Props {
	item: QuantityItem;
}

const fmt = (n: number) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(n);

export function CostSection({ item }: Props) {
	const pricing = useBiDirectionalPricing(item);
	const effectiveQty = Number(item.effectiveQuantity ?? 0);
	const totalCost =
		(pricing.materialUnitPrice + pricing.laborUnitPrice) * effectiveQty;
	const unitLabel = item.unit?.trim() || "وحدة";

	return (
		<Card className="border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
			<div className="space-y-3">
				<h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
					💰 التكلفة
				</h4>

				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					<BiDirectionalPriceInput
						id={`${item.id}-mat`}
						label="سعر المادة"
						value={pricing.materialUnitPrice}
						unit={`ر.س/${unitLabel}`}
						onChange={(v) => pricing.updateField("material_unit_price", v)}
						isLoading={pricing.isLoading}
					/>
					<BiDirectionalPriceInput
						id={`${item.id}-lab`}
						label="سعر العمالة"
						value={pricing.laborUnitPrice}
						unit={`ر.س/${unitLabel}`}
						onChange={(v) => pricing.updateField("labor_unit_price", v)}
						isLoading={pricing.isLoading}
					/>
				</div>

				<div className="rounded-lg border bg-background p-3">
					<div className="grid grid-cols-3 gap-3 text-center text-sm">
						<div>
							<p className="text-xs text-muted-foreground">المادة</p>
							<p className="font-medium tabular-nums">
								{fmt(pricing.materialUnitPrice * effectiveQty)} ر.س
							</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">العمالة</p>
							<p className="font-medium tabular-nums">
								{fmt(pricing.laborUnitPrice * effectiveQty)} ر.س
							</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">إجمالي التكلفة</p>
							<p className="font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
								{fmt(totalCost)} ر.س
							</p>
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
}
