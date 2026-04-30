"use client";

import { Button } from "@ui/components/button";
import { ChevronDown, ChevronUp } from "lucide-react";
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

const fmt = (n: unknown, dp = 2) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: dp,
		maximumFractionDigits: dp,
	}).format(Number(n ?? 0));

export function ItemCardHeader({
	item,
	expanded,
	onToggle,
	onDelete,
	onDuplicate,
}: Props) {
	const isProfit = Number(item.profitAmount ?? 0) >= 0;

	return (
		<div className="flex items-stretch gap-3 p-3">
			<button
				type="button"
				onClick={onToggle}
				className="flex flex-1 items-center gap-3 text-start"
				aria-expanded={expanded}
			>
				<DomainBadge domain={item.domain} className="flex-shrink-0" />

				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">{item.displayName}</p>
					<p className="truncate text-xs text-muted-foreground tabular-nums">
						{fmt(item.effectiveQuantity)} {item.unit} ·{" "}
						{fmt(item.totalCost)} ر.س تكلفة ·{" "}
						<span
							className={
								isProfit
									? "text-emerald-700 dark:text-emerald-400"
									: "text-red-700 dark:text-red-400"
							}
						>
							{fmt(item.sellTotalAmount)} ر.س بيع
						</span>
						{item.hasCustomMarkup && (
							<span className="ms-2 text-amber-600 dark:text-amber-400">
								★ مخصّص
							</span>
						)}
					</p>
				</div>

				<div className="flex flex-shrink-0 items-center text-muted-foreground">
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

// also expose Button used in some places (kept for tree-shake)
export { Button };
