"use client";

import { Button } from "@ui/components/button";
import { ChevronDown, ChevronUp, Star, TrendingDown, TrendingUp } from "lucide-react";
import { DomainBadge } from "../shared/DomainBadge";
import type { QuantityItem } from "../types";
import { ItemCardActions } from "./ItemCardActions";

interface Props {
	item: QuantityItem;
	expanded: boolean;
	onToggle: () => void;
	onDelete: (data: { id: string; organizationId: string }) => Promise<unknown>;
	onDuplicate: (data: {
		id: string;
		organizationId: string;
	}) => Promise<unknown>;
}

const fmt = (n: unknown, dp = 0) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: dp,
		maximumFractionDigits: dp,
	}).format(Number(n ?? 0));

const fmtQty = (n: unknown) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(n ?? 0));

export function ItemCardCompactHeader({
	item,
	expanded,
	onToggle,
	onDelete,
	onDuplicate,
}: Props) {
	const profit = Number(item.profitAmount ?? 0);
	const profitPct = Number(item.profitPercent ?? 0);
	const isProfit = profit >= 0;
	const sell = Number(item.sellTotalAmount ?? 0);

	return (
		<div className="flex items-stretch gap-2 p-3">
			<button
				type="button"
				onClick={onToggle}
				className="flex flex-1 items-center gap-3 text-start"
				aria-expanded={expanded}
			>
				<DomainBadge domain={item.domain} className="flex-shrink-0" />

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-1.5">
						<p className="truncate text-sm font-medium">{item.displayName}</p>
						{item.hasCustomMarkup && (
							<Star className="h-3.5 w-3.5 flex-shrink-0 fill-amber-400 text-amber-400" />
						)}
					</div>
					<div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground tabular-nums">
						<span>
							{fmtQty(item.effectiveQuantity)} {item.unit}
						</span>
						<span className="text-muted-foreground/40">·</span>
						<span>{fmt(item.totalCost)} ر.س تكلفة</span>
						<span className="text-muted-foreground/40">·</span>
						<span className="font-medium text-foreground">
							{fmt(sell)} ر.س بيع
						</span>
					</div>
				</div>

				<div className="hidden flex-shrink-0 items-center gap-1.5 sm:flex">
					{isProfit ? (
						<TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
					) : (
						<TrendingDown className="h-3.5 w-3.5 text-red-600" />
					)}
					<div className="text-end leading-tight">
						<div
							className={`text-sm font-semibold tabular-nums ${
								isProfit
									? "text-emerald-700 dark:text-emerald-400"
									: "text-red-700 dark:text-red-400"
							}`}
						>
							{isProfit ? "+" : ""}
							{fmt(profit)} ر.س
						</div>
						<div className="text-[10px] text-muted-foreground tabular-nums">
							{profitPct.toFixed(1)}%
						</div>
					</div>
				</div>

				<div className="ms-1 flex flex-shrink-0 items-center text-muted-foreground">
					{expanded ? (
						<ChevronUp className="h-4 w-4" />
					) : (
						<ChevronDown className="h-4 w-4" />
					)}
				</div>
			</button>

			<div className="flex flex-shrink-0 items-center">
				<ItemCardActions
					itemId={item.id}
					organizationId={item.organizationId}
					onDelete={onDelete}
					onDuplicate={onDuplicate}
				/>
			</div>
		</div>
	);
}
