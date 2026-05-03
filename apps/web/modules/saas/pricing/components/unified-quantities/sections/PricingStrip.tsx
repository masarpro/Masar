"use client";

import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import { ArrowLeft, Info, TrendingDown, TrendingUp } from "lucide-react";
import { useBiDirectionalPricing } from "../hooks/useBiDirectionalPricing";
import { BiDirectionalPriceInput } from "../inputs/BiDirectionalPriceInput";
import { MarkupMethodSelector } from "../inputs/MarkupMethodSelector";
import type { MarkupMethod, QuantityItem } from "../types";

interface Props {
	item: QuantityItem;
	globalMarkupPercent: number;
}

const fmt2 = (n: number) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(n);

const fmt0 = (n: number) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(Math.round(n));

const QUICK_CHIPS = [15, 25, 30, 40];

export function PricingStrip({ item, globalMarkupPercent }: Props) {
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

	const displayMarkupPercent =
		pricing.markupMethod === "manual_price"
			? pricing.impliedMarkupPercent
			: pricing.markupPercent;

	const isQuickActive = (chip: number) =>
		pricing.hasCustomMarkup &&
		pricing.markupMethod === "percentage" &&
		Math.abs(pricing.markupPercent - chip) < 0.5;

	return (
		<div className="space-y-4">
			{/* Quick chips — fastest path to a price */}
			<div className="flex flex-wrap items-center gap-1.5">
				<span className="me-1 text-xs text-muted-foreground">سريع:</span>
				{QUICK_CHIPS.map((chip) => (
					<button
						key={chip}
						type="button"
						onClick={() =>
							pricing.updateField("markup_percent", chip)
						}
						className={`rounded-full border px-3 py-1 text-xs tabular-nums transition ${
							isQuickActive(chip)
								? "border-violet-600 bg-violet-600 text-white"
								: "border-border bg-background hover:bg-muted"
						}`}
					>
						+{chip}%
					</button>
				))}
				{pricing.hasCustomMarkup &&
					pricing.markupMethod !== "percentage" && (
						<span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300">
							{pricing.markupMethod === "fixed_amount"
								? `+${fmt2(pricing.markupFixedAmount)} ر.س ثابت`
								: "سعر يدوي"}
						</span>
					)}
				{!pricing.hasCustomMarkup && (
					<span className="ms-auto text-[10px] text-muted-foreground">
						يتبع العام {globalMarkupPercent.toFixed(0)}%
					</span>
				)}
			</div>

			{/* The strip — Cost ── Markup ── Sell. Visually balanced 3-column grid
			    on sm+; stacks on mobile. */}
			<div className="grid grid-cols-1 items-start gap-3 rounded-lg border bg-background p-4 sm:grid-cols-[1fr_auto_1fr]">
				{/* COST (read-only — comes from CostSection) */}
				<div className="space-y-1">
					<p className="text-[10px] uppercase tracking-wide text-muted-foreground">
						التكلفة
					</p>
					<p className="text-lg font-semibold tabular-nums">
						{fmt2(unitCost)}
						<span className="ms-1 text-xs font-normal text-muted-foreground">
							ر.س/{item.unit}
						</span>
					</p>
					<p className="text-[10px] tabular-nums text-muted-foreground">
						{fmt2(pricing.materialUnitPrice)} مادة +{" "}
						{fmt2(pricing.laborUnitPrice)} عمالة
					</p>
				</div>

				{/* ARROW (decorative on sm+) */}
				<div className="hidden flex-col items-center justify-center gap-1 self-center sm:flex">
					<ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
					{pricing.markupMethod === "percentage" ? (
						<span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 tabular-nums dark:bg-violet-950/40 dark:text-violet-300">
							+{pricing.markupPercent.toFixed(1)}%
						</span>
					) : pricing.markupMethod === "fixed_amount" ? (
						<span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 tabular-nums dark:bg-violet-950/40 dark:text-violet-300">
							+{fmt2(pricing.markupFixedAmount)}ر
						</span>
					) : (
						<span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
							يدوي
						</span>
					)}
				</div>

				{/* SELL (editable) */}
				<div className="space-y-1">
					<p className="text-[10px] uppercase tracking-wide text-muted-foreground">
						سعر البيع
					</p>
					<BiDirectionalPriceInput
						id={`${item.id}-su`}
						label=""
						value={pricing.sellUnitPrice}
						unit={`ر.س/${item.unit}`}
						onChange={(v) => pricing.updateField("sell_unit_price", v)}
						isLoading={pricing.isLoading}
						precision={2}
					/>
				</div>
			</div>

			{/* Custom markup advanced controls — only visible when custom is on */}
			<div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2">
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
						هامش خاص لهذا البند
					</Label>
				</div>

				{pricing.hasCustomMarkup && (
					<div className="flex items-center gap-2">
						<MarkupMethodSelector
							value={pricing.markupMethod}
							onChange={handleMethodChange}
						/>

						{pricing.markupMethod === "percentage" && (
							<BiDirectionalPriceInput
								id={`${item.id}-mp`}
								label=""
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
								label=""
								value={pricing.markupFixedAmount}
								unit="ر.س"
								onChange={(v) =>
									pricing.updateField("markup_fixed_amount", v)
								}
								isLoading={pricing.isLoading}
							/>
						)}
					</div>
				)}
			</div>

			{/* Totals row — total cost, profit (hero), total sell */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<div className="rounded-lg border bg-background p-3">
					<p className="text-[10px] uppercase tracking-wide text-muted-foreground">
						إجمالي التكلفة
					</p>
					<p className="mt-1 text-base font-semibold tabular-nums">
						{fmt0(totalCost)} <span className="text-xs font-normal">ر.س</span>
					</p>
				</div>

				<div
					className={`rounded-lg border p-3 ${
						isProfit
							? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
							: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
					}`}
				>
					<div className="flex items-center gap-1.5">
						{isProfit ? (
							<TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
						) : (
							<TrendingDown className="h-3.5 w-3.5 text-red-600" />
						)}
						<p
							className={`text-[10px] uppercase tracking-wide ${
								isProfit
									? "text-emerald-700 dark:text-emerald-300"
									: "text-red-700 dark:text-red-300"
							}`}
						>
							{isProfit ? "صافي الربح" : "خسارة"}
						</p>
					</div>
					<p
						className={`mt-1 text-base font-bold tabular-nums ${
							isProfit
								? "text-emerald-700 dark:text-emerald-300"
								: "text-red-700 dark:text-red-300"
						}`}
					>
						{isProfit ? "+" : ""}
						{fmt0(pricing.profitAmount)}{" "}
						<span className="text-xs font-normal">ر.س</span>
					</p>
					<p className="mt-0.5 text-[10px] text-muted-foreground">
						<span className="tabular-nums">
							{pricing.profitPercent.toFixed(1)}%
						</span>{" "}
						margin
						{displayMarkupPercent !== null &&
							displayMarkupPercent !== undefined && (
								<>
									{" · "}
									<span className="tabular-nums">
										{displayMarkupPercent.toFixed(1)}%
									</span>{" "}
									markup
								</>
							)}
					</p>
				</div>

				<div className="rounded-lg border bg-background p-3">
					<p className="text-[10px] uppercase tracking-wide text-muted-foreground">
						إجمالي البيع
					</p>
					<BiDirectionalPriceInput
						id={`${item.id}-st`}
						label=""
						value={pricing.sellTotalAmount}
						unit="ر.س"
						onChange={(v) =>
							pricing.updateField("sell_total_amount", v)
						}
						isLoading={pricing.isLoading}
					/>
				</div>
			</div>

			{/* Manual price hint */}
			{pricing.markupMethod === "manual_price" && (
				<div className="flex items-start gap-2 rounded-md border bg-violet-50/40 px-3 py-2 text-xs text-violet-800 dark:bg-violet-950/20 dark:text-violet-200">
					<Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
					<p>
						السعر يدوي ويتجاوز الحساب التلقائي. لإعادة الربط بالتكلفة،
						بدّل الطريقة من القائمة أعلاه أو أعد القيمة الافتراضية.
					</p>
				</div>
			)}

			{!isProfit && pricing.sellTotalAmount > 0 && (
				<div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
					⚠️ السعر الحالي أقل من التكلفة — تحقق من الأرقام أو ارفع السعر.
				</div>
			)}
		</div>
	);
}
