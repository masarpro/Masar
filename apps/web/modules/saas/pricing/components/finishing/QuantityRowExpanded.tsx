"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	AlertTriangle,
	ArrowDown,
	ArrowUp,
	Calculator,
	Edit3,
	Link2,
	RotateCcw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";
import type { MergedQuantityItem } from "../../lib/merge-quantities";
import { formatNumber } from "../../lib/utils";

interface QuantityRowExpandedProps {
	item: MergedQuantityItem;
	allItems: MergedQuantityItem[];
	onManualOverride: (key: string, newQuantity: number) => void;
	onResetToAuto: (key: string) => void;
}

export const QuantityRowExpanded = memo(function QuantityRowExpanded({
	item,
	allItems,
	onManualOverride,
	onResetToAuto,
}: QuantityRowExpandedProps) {
	const t = useTranslations("pricing.studies.finishing.dashboard");
	const [isEditing, setIsEditing] = useState(false);
	const [manualValue, setManualValue] = useState(
		String(item.quantity),
	);

	const isAuto =
		item.dataSource === "auto_building" ||
		item.dataSource === "auto_linked" ||
		item.dataSource === "auto_derived";

	// Compute "depends on" — items this item sources from
	const dependsOnItem = item.sourceItemKey
		? allItems.find((i) => i.categoryKey === item.sourceItemKey)
		: null;

	// Compute "feeds" — items that depend on this item
	const feedsItems = allItems.filter(
		(i) => i.sourceItemKey === item.categoryKey,
	);

	const handleSaveManual = () => {
		const qty = parseFloat(manualValue);
		if (!Number.isNaN(qty) && qty >= 0) {
			onManualOverride(item.key, qty);
			setIsEditing(false);
		}
	};

	return (
		<div className="border-t bg-muted/20 px-4 py-3 space-y-3 text-sm">
			{/* Calculation breakdown */}
			{item.calculationBreakdown && (
				<div className="space-y-1.5">
					<h4 className="font-medium flex items-center gap-1.5 text-xs text-muted-foreground">
						<Calculator className="h-3.5 w-3.5" />
						{t("calculationDetails")}
					</h4>
					<div className="rounded bg-card border p-3 text-xs font-mono whitespace-pre-wrap leading-relaxed">
						{item.calculationBreakdown.formula}
					</div>
				</div>
			)}

			{/* Source description */}
			{item.sourceDescription && (
				<div className="text-xs text-muted-foreground">
					{t("source")}: {item.sourceDescription}
				</div>
			)}

			{/* Links — depends on */}
			{dependsOnItem && (
				<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
					<ArrowUp className="h-3 w-3 text-blue-500" />
					<Link2 className="h-3 w-3" />
					<span>
						{t("dependsOn")}: {dependsOnItem.name}
						{dependsOnItem.floorName
							? ` — ${dependsOnItem.floorName}`
							: ""}
					</span>
				</div>
			)}

			{/* Links — feeds */}
			{feedsItems.length > 0 && (
				<div className="flex items-start gap-1.5 text-xs text-muted-foreground">
					<ArrowDown className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
					<Link2 className="h-3 w-3 mt-0.5 shrink-0" />
					<span>
						{t("feedsItems")}:{" "}
						{feedsItems
							.map(
								(f) =>
									f.name +
									(f.floorName ? ` — ${f.floorName}` : ""),
							)
							.join("، ")}
					</span>
				</div>
			)}

			{/* Stale warning */}
			{item.isStale && item.derivedQuantity != null && (
				<div className="flex items-center gap-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2 text-xs">
					<AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
					<span>
						{t("staleWarning", {
							manual: formatNumber(item.quantity, 1),
							auto: formatNumber(item.derivedQuantity, 1),
						})}
					</span>
					<Button
						variant="ghost"
						size="sm"
						className="h-6 text-xs ms-auto"
						onClick={() => onResetToAuto(item.key)}
					>
						<RotateCcw className="h-3 w-3 me-1" />
						{t("resetToAuto")}
					</Button>
				</div>
			)}

			{/* Actions */}
			<div className="flex items-center gap-2 pt-1">
				{isAuto && !isEditing && (
					<Button
						variant="outline"
						size="sm"
						className="h-7 text-xs"
						onClick={() => {
							setManualValue(String(item.quantity));
							setIsEditing(true);
						}}
					>
						<Edit3 className="h-3 w-3 me-1" />
						{t("manualEdit")}
					</Button>
				)}

				{item.dataSource === "manual" && item.derivedQuantity != null && (
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-xs"
						onClick={() => onResetToAuto(item.key)}
					>
						<RotateCcw className="h-3 w-3 me-1" />
						{t("resetToAuto")}
					</Button>
				)}

				{isEditing && (
					<div className="flex items-center gap-2">
						<Input
							type="number"
							value={manualValue}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualValue(e.target.value)}
							className="h-7 w-28 text-sm"
							autoFocus
							onKeyDown={(e: React.KeyboardEvent) => {
								if (e.key === "Enter") handleSaveManual();
								if (e.key === "Escape") setIsEditing(false);
							}}
						/>
						<Button
							size="sm"
							className="h-7 text-xs"
							onClick={handleSaveManual}
						>
							{t("save")}
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => setIsEditing(false)}
						>
							{t("cancel")}
						</Button>
					</div>
				)}

				{/* Data source badge */}
				<Badge
					variant="secondary"
					className="ms-auto text-[10px] h-5"
				>
					{getSourceLabel(item.dataSource)}
				</Badge>
			</div>
		</div>
	);
});

function getSourceLabel(source: string): string {
	const labels: Record<string, string> = {
		auto_building: "تلقائي",
		auto_linked: "مشتق",
		auto_derived: "محسوب",
		manual: "يدوي",
		estimated: "تقديري",
	};
	return labels[source] ?? source;
}
