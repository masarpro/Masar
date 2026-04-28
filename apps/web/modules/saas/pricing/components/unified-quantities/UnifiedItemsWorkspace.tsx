"use client";

import { Button } from "@ui/components/button";
import { Package, Plus } from "lucide-react";
import { useState } from "react";
import { CatalogPickerDrawer } from "./catalog-picker/CatalogPickerDrawer";
import { useCostStudy } from "./hooks/useCostStudy";
import { useUnifiedQuantities } from "./hooks/useUnifiedQuantities";
import { EmptyState } from "./items-list/EmptyState";
import { ItemsList } from "./items-list/ItemsList";
import { ErrorState } from "./shared/ErrorState";
import { LoadingSkeleton } from "./shared/LoadingSkeleton";
import type { CalculationMethod, Domain, ItemCatalogEntry } from "./types";

interface Props {
	costStudyId: string;
	organizationId: string;
}

export function UnifiedItemsWorkspace({ costStudyId, organizationId }: Props) {
	const [pickerOpen, setPickerOpen] = useState(false);
	const [pickerMode, setPickerMode] = useState<"items" | "presets">("items");

	const {
		items,
		isLoading,
		error,
		upsertItem,
		deleteItem,
		duplicateItem,
		reorderItems,
		applyPreset,
	} = useUnifiedQuantities({ costStudyId, organizationId });

	const { globalMarkupPercent } = useCostStudy(costStudyId, organizationId);

	if (isLoading) return <LoadingSkeleton />;
	if (error) return <ErrorState error={error} />;

	const handleAddItem = async (entry: ItemCatalogEntry) => {
		await upsertItem({
			costStudyId,
			organizationId,
			domain: entry.domain as Domain,
			categoryKey: entry.categoryKey,
			catalogItemKey: entry.itemKey,
			displayName: entry.nameAr,
			calculationMethod:
				entry.defaultCalculationMethod as CalculationMethod,
			unit: entry.unit,
			wastagePercent: Number(entry.defaultWastagePercent),
			materialUnitPrice:
				entry.defaultMaterialUnitPrice != null
					? Number(entry.defaultMaterialUnitPrice)
					: undefined,
			laborUnitPrice:
				entry.defaultLaborUnitPrice != null
					? Number(entry.defaultLaborUnitPrice)
					: undefined,
			sortOrder: items.length,
			markupMethod: "percentage",
			hasCustomMarkup: false,
		} as never);
	};

	return (
		<div className="flex flex-col gap-4 pb-20" dir="rtl">
			{/* Header مؤقت — سيُستبدل بـ StudyHeader في Phase 8 */}
			<div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
				<h2 className="text-xl font-semibold">التشطيبات والكهروميكانيكا</h2>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => {
							setPickerMode("presets");
							setPickerOpen(true);
						}}
					>
						<Package className="me-2 h-4 w-4" />
						باقات جاهزة
					</Button>
					<Button
						onClick={() => {
							setPickerMode("items");
							setPickerOpen(true);
						}}
					>
						<Plus className="me-2 h-4 w-4" />
						بند جديد
					</Button>
				</div>
			</div>

			{items.length === 0 ? (
				<EmptyState
					onAddItem={() => {
						setPickerMode("items");
						setPickerOpen(true);
					}}
					onApplyPreset={() => {
						setPickerMode("presets");
						setPickerOpen(true);
					}}
				/>
			) : (
				<ItemsList
					items={items}
					costStudyId={costStudyId}
					organizationId={organizationId}
					globalMarkupPercent={globalMarkupPercent}
					onUpsert={upsertItem}
					onDelete={deleteItem}
					onDuplicate={duplicateItem}
					onReorder={reorderItems}
				/>
			)}

			<CatalogPickerDrawer
				open={pickerOpen}
				onOpenChange={setPickerOpen}
				mode={pickerMode}
				organizationId={organizationId}
				onItemSelect={async (entry) => {
					await handleAddItem(entry);
					setPickerOpen(false);
				}}
				onPresetSelect={async (presetKey) => {
					await applyPreset({
						costStudyId,
						organizationId,
						presetKey,
					} as never);
					setPickerOpen(false);
				}}
			/>
		</div>
	);
}
