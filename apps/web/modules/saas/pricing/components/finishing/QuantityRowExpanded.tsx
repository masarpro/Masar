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
	Settings,
	CheckCircle2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";
import type { MergedQuantityItem } from "../../lib/merge-quantities";
import type { ItemSpecification } from "../../lib/specs/spec-types";
import { formatNumber } from "../../lib/utils";
import { ItemSpecEditor } from "./specs/ItemSpecEditor";

interface QuantityRowExpandedProps {
	item: MergedQuantityItem;
	allItems: MergedQuantityItem[];
	onManualOverride: (key: string, newQuantity: number) => void;
	onResetToAuto: (key: string) => void;
	onSaveSpec: (key: string, spec: ItemSpecification) => void;
}

type TabKey = "details" | "specs";

export const QuantityRowExpanded = memo(function QuantityRowExpanded({
	item,
	allItems,
	onManualOverride,
	onResetToAuto,
	onSaveSpec,
}: QuantityRowExpandedProps) {
	const t = useTranslations("pricing.studies.finishing.dashboard");
	const tSpecs = useTranslations("pricing.studies.finishing.specs");
	const [activeTab, setActiveTab] = useState<TabKey>("details");
	const [isEditing, setIsEditing] = useState(false);
	const [isEditingSpec, setIsEditingSpec] = useState(false);
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

	const existingSpec = (item.specData as ItemSpecification | undefined) ?? null;
	const hasSpec = existingSpec !== null;

	const handleSaveSpec = (spec: ItemSpecification) => {
		onSaveSpec(item.key, spec);
		setIsEditingSpec(false);
	};

	return (
		<div className="border-t bg-muted/20">
			{/* Tabs */}
			<div className="flex border-b">
				<button
					type="button"
					className={`px-4 py-2 text-xs font-medium transition-colors ${
						activeTab === "details"
							? "border-b-2 border-primary text-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}
					onClick={() => setActiveTab("details")}
				>
					<Calculator className="inline h-3 w-3 me-1" />
					{t("calculationDetails")}
				</button>
				<button
					type="button"
					className={`px-4 py-2 text-xs font-medium transition-colors flex items-center gap-1 ${
						activeTab === "specs"
							? "border-b-2 border-primary text-primary"
							: "text-muted-foreground hover:text-foreground"
					}`}
					onClick={() => setActiveTab("specs")}
				>
					<Settings className="inline h-3 w-3" />
					{tSpecs("tab")}
					{hasSpec && (
						<CheckCircle2 className="h-3 w-3 text-green-500" />
					)}
				</button>
			</div>

			{/* Details tab */}
			{activeTab === "details" && (
				<div className="px-4 py-3 space-y-3 text-sm">
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
											(f.floorName
												? ` — ${f.floorName}`
												: ""),
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
									auto: formatNumber(
										item.derivedQuantity,
										1,
									),
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

						{item.dataSource === "manual" &&
							item.derivedQuantity != null && (
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
									onChange={(
										e: React.ChangeEvent<HTMLInputElement>,
									) => setManualValue(e.target.value)}
									className="h-7 w-28 text-sm"
									autoFocus
									onKeyDown={(e: React.KeyboardEvent) => {
										if (e.key === "Enter")
											handleSaveManual();
										if (e.key === "Escape")
											setIsEditing(false);
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
							{t(SOURCE_LABEL_KEYS[item.dataSource] ?? "sourceManual" as Parameters<typeof t>[0])}
						</Badge>
					</div>
				</div>
			)}

			{/* Specs tab */}
			{activeTab === "specs" && (
				<div className="text-sm">
					{isEditingSpec ? (
						<ItemSpecEditor
							categoryKey={item.categoryKey}
							itemName={item.name}
							effectiveQuantity={item.effectiveQuantity}
							unit={item.unit}
							existingSpec={existingSpec}
							onSave={handleSaveSpec}
							onCancel={() => setIsEditingSpec(false)}
						/>
					) : hasSpec ? (
						<div className="px-4 py-3 space-y-2">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<CheckCircle2 className="h-4 w-4 text-green-500" />
									<span className="text-xs font-medium">
										{existingSpec.specTypeLabel}
									</span>
								</div>
								<Button
									variant="outline"
									size="sm"
									className="h-7 text-xs"
									onClick={() => setIsEditingSpec(true)}
								>
									<Settings className="h-3 w-3 me-1" />
									{tSpecs("edit")}
								</Button>
							</div>
							{existingSpec.subItems.length > 0 && (
								<div className="text-xs text-muted-foreground">
									{tSpecs("materialsCount", {
										count: existingSpec.subItems.length,
									})}
								</div>
							)}
						</div>
					) : (
						<div className="px-4 py-4 text-center space-y-2">
							<p className="text-xs text-muted-foreground">
								{tSpecs("noSpecYet")}
							</p>
							<Button
								variant="outline"
								size="sm"
								className="h-7 text-xs"
								onClick={() => setIsEditingSpec(true)}
							>
								<Settings className="h-3 w-3 me-1" />
								{tSpecs("setSpec")}
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
});

const SOURCE_LABEL_KEYS: Record<string, string> = {
	auto_building: "sourceAutoBuilding",
	auto_linked: "sourceAutoLinked",
	auto_derived: "sourceAutoDerived",
	manual: "sourceManual",
	estimated: "sourceEstimated",
};
