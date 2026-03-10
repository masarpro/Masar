"use client";

import { useState } from "react";
import { ChevronDown, Settings } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import {
	MEP_CATEGORIES,
	getMEPSubCategoryName,
} from "../../lib/mep-categories";
import { MEP_ICON_MAP } from "../../lib/mep-icons";
import type { MEPCategoryId, MEPMergedItem } from "../../types/mep";
import { MEPItemRow } from "./MEPItemRow";
import { useTranslations } from "next-intl";

interface MEPCategorySectionProps {
	categoryId: MEPCategoryId;
	items: MEPMergedItem[];
	onToggleEnabled: (item: MEPMergedItem, enabled: boolean) => void;
	onEdit: (item: MEPMergedItem) => void;
	showPricing?: boolean;
}

export function MEPCategorySection({
	categoryId,
	items,
	onToggleEnabled,
	onEdit,
	showPricing = true,
}: MEPCategorySectionProps) {
	const [isOpen, setIsOpen] = useState(true);
	const t = useTranslations("pricing.studies.mep");
	const category = MEP_CATEGORIES[categoryId];
	const IconComponent = MEP_ICON_MAP[category.icon] ?? Settings;

	const enabledItems = items.filter((i) => i.isEnabled);
	const totalCost = enabledItems.reduce((s, i) => s + i.totalCost, 0);

	// Group items by subCategory
	const subCategoryGroups = new Map<string, MEPMergedItem[]>();
	for (const item of items) {
		const key = item.subCategory;
		if (!subCategoryGroups.has(key)) {
			subCategoryGroups.set(key, []);
		}
		subCategoryGroups.get(key)!.push(item);
	}

	if (items.length === 0) return null;

	return (
		<div className="rounded-xl border overflow-hidden">
			{/* Header */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-accent/30 transition-colors"
			>
				<div className="flex items-center gap-3">
					<div
						className="flex items-center justify-center h-8 w-8 rounded-lg"
						style={{ backgroundColor: `${category.color}20` }}
					>
						<IconComponent
							className="h-4 w-4"
							style={{ color: category.color }}
						/>
					</div>
					<div className="text-start">
						<h3 className="font-semibold">{category.nameAr}</h3>
						<p className="text-xs text-muted-foreground">
							{t("categoryItemCount", { count: items.length })}
							{showPricing && <> &middot; {formatCurrency(totalCost)}</>}
						</p>
					</div>
				</div>
				<ChevronDown
					className={`h-4 w-4 text-muted-foreground transition-transform ${
						isOpen ? "rotate-180" : ""
					}`}
				/>
			</button>

			{/* Content */}
			{isOpen && (
				<div className="border-t px-4 py-3 space-y-4">
					{/* Header row */}
					<div className={showPricing ? "grid grid-cols-[32px_1fr_80px_60px_90px_90px_32px] sm:grid-cols-[32px_1fr_80px_60px_90px_90px_80px_32px] items-center gap-2 px-3 text-xs text-muted-foreground font-medium" : "grid grid-cols-[32px_1fr_80px_60px_80px_32px] sm:grid-cols-[32px_1fr_80px_60px_80px_32px] items-center gap-2 px-3 text-xs text-muted-foreground font-medium"}>
						<span />
						<span>{t("table.item")}</span>
						<span className="text-left">{t("table.quantity")}</span>
						<span>{t("table.unit")}</span>
						{showPricing && <span className="text-left">{t("table.unitPrice")}</span>}
						{showPricing && <span className="text-left">{t("table.total")}</span>}
						{showPricing && <span className="hidden sm:block text-center">
							{t("table.formula")}
						</span>}
						<span />
					</div>

					{Array.from(subCategoryGroups.entries()).map(
						([subKey, subItems]) => (
							<div key={subKey} className="space-y-1.5">
								{/* Sub-category label */}
								<h4 className="text-xs font-medium text-muted-foreground px-3 pt-1">
									{getMEPSubCategoryName(
										categoryId,
										subKey,
									)}
								</h4>

								{/* Items */}
								{subItems.map((item, idx) => (
									<MEPItemRow
										key={
											item.id ??
											`${item.itemType}-${item.floorId}-${item.roomId}-${idx}`
										}
										item={item}
										onToggleEnabled={onToggleEnabled}
										onEdit={onEdit}
									/>
								))}
							</div>
						),
					)}
				</div>
			)}
		</div>
	);
}
