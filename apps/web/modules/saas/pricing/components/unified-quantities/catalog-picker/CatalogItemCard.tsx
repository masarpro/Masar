"use client";

import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import * as Icons from "lucide-react";
import type { ItemCatalogEntry } from "../types";

interface Props {
	entry: ItemCatalogEntry;
	onSelect: () => void;
}

export function CatalogItemCard({ entry, onSelect }: Props) {
	const Icon =
		((Icons as unknown as Record<string, Icons.LucideIcon>)[entry.icon]) ??
		Icons.Package;
	const matPrice = Number(entry.defaultMaterialUnitPrice ?? 0);
	const labPrice = Number(entry.defaultLaborUnitPrice ?? 0);
	const totalPrice = matPrice + labPrice;

	return (
		<Card
			onClick={onSelect}
			className="group cursor-pointer p-3 transition-all hover:border-primary hover:shadow-md"
			role="button"
			tabIndex={0}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onSelect();
				}
			}}
		>
			<div className="flex items-start gap-3">
				<div
					className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
					style={{
						backgroundColor: (entry.color ?? "#94a3b8") + "20",
						color: entry.color ?? "#64748b",
					}}
				>
					<Icon className="h-5 w-5" />
				</div>

				<div className="min-w-0 flex-1">
					<h5 className="truncate text-sm font-medium">{entry.nameAr}</h5>
					<p className="truncate text-xs text-muted-foreground">
						{entry.unit} · هدر {Number(entry.defaultWastagePercent)}%
					</p>
					{totalPrice > 0 && (
						<p className="mt-1 text-xs tabular-nums text-emerald-600 dark:text-emerald-400">
							{totalPrice.toFixed(2)} ر.س / {entry.unit}
						</p>
					)}
				</div>

				<Button
					size="sm"
					variant="ghost"
					className="opacity-0 transition-opacity group-hover:opacity-100"
					tabIndex={-1}
					onClick={(e) => {
						e.stopPropagation();
						onSelect();
					}}
				>
					<Icons.Plus className="h-4 w-4" />
				</Button>
			</div>
		</Card>
	);
}
