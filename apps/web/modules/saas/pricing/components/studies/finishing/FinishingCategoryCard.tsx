"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { FinishingCategoryConfig } from "../../../lib/finishing-categories";
import type { BuildingConfig } from "../../../lib/finishing-types";
import { formatCurrency } from "../../../lib/utils";
import { AddEditFinishingItemDialog } from "./AddEditFinishingItemDialog";
import { FinishingItemRow } from "./FinishingItemRow";
import { PlasterItemDialog } from "./PlasterItemDialog";
import { ThermalInsulationItemDialog } from "./ThermalInsulationItemDialog";
import { PaintItemDialog } from "./PaintItemDialog";
import { WaterproofingItemDialog } from "./WaterproofingItemDialog";

interface FinishingItem {
	id: string;
	category: string;
	subCategory?: string | null;
	name: string;
	floorId?: string | null;
	floorName?: string | null;
	area?: number | null;
	quantity?: number | null;
	length?: number | null;
	unit: string;
	qualityLevel?: string | null;
	totalCost: number;
	wastagePercent?: number | null;
	materialPrice?: number | null;
	laborPrice?: number | null;
	calculationMethod?: string | null;
	calculationData?: Record<string, unknown> | null;
	brand?: string | null;
	specifications?: string | null;
	description?: string | null;
}

interface FinishingCategoryCardProps {
	category: FinishingCategoryConfig;
	items: FinishingItem[];
	allGroupItems?: FinishingItem[];
	organizationId: string;
	studyId: string;
	buildingConfig?: BuildingConfig | null;
}

export function FinishingCategoryCard({
	category,
	items,
	allGroupItems,
	organizationId,
	studyId,
	buildingConfig,
}: FinishingCategoryCardProps) {
	const t = useTranslations("pricing.studies.finishing");
	const queryClient = useQueryClient();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editItem, setEditItem] = useState<FinishingItem | undefined>();

	const deleteMutation = useMutation(
		orpc.pricing.studies.finishingItem.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("itemDeleted"));
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
			},
		}),
	);

	const totalCost = items.reduce((sum, item) => sum + item.totalCost, 0);
	const isPerFloor = category.scope === "PER_FLOOR";

	// Group items by floor for PER_FLOOR categories
	const groupedByFloor = isPerFloor
		? items.reduce<Record<string, FinishingItem[]>>((groups, item) => {
				const key = item.floorId ?? "__none__";
				if (!groups[key]) groups[key] = [];
				groups[key].push(item);
				return groups;
			}, {})
		: null;

	const handleAdd = () => {
		setEditItem(undefined);
		setDialogOpen(true);
	};

	const handleEdit = (item: FinishingItem) => {
		setEditItem(item);
		setDialogOpen(true);
	};

	const handleDelete = (item: FinishingItem) => {
		if (confirm(t("confirmDelete"))) {
			deleteMutation.mutate({
				organizationId,
				costStudyId: studyId,
				id: item.id,
			});
		}
	};

	return (
		<>
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="flex items-center justify-between text-base">
						<span>{category.nameAr}</span>
						<Button variant="ghost" size="sm" className="h-8" onClick={handleAdd}>
							<Plus className="h-4 w-4 me-1" />
							{isPerFloor ? t("addForFloor") : t("addItem")}
						</Button>
					</CardTitle>
				</CardHeader>
				<CardContent>
					{items.length === 0 ? (
						<p className="text-sm text-muted-foreground py-3 text-center">
							لا توجد بنود
						</p>
					) : isPerFloor && groupedByFloor ? (
						<div className="space-y-3">
							{Object.entries(groupedByFloor).map(([floorId, floorItems]) => (
								<div key={floorId} className="space-y-1">
									<div className="text-xs font-medium text-muted-foreground border-b pb-1">
										{floorItems[0]?.floorName ?? "عام"}
									</div>
									<div className="space-y-1">
										{floorItems.map((item) => (
											<FinishingItemRow
												key={item.id}
												item={item}
												onEdit={() => handleEdit(item)}
												onDelete={() => handleDelete(item)}
											/>
										))}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="space-y-1">
							{items.map((item) => (
								<FinishingItemRow
									key={item.id}
									item={item}
									onEdit={() => handleEdit(item)}
									onDelete={() => handleDelete(item)}
								/>
							))}
						</div>
					)}

					{items.length > 0 && (
						<div className="mt-3 flex justify-between border-t pt-2 text-sm">
							<span className="text-muted-foreground">
								{items.length} عناصر
							</span>
							<span className="font-medium">{formatCurrency(totalCost)}</span>
						</div>
					)}
				</CardContent>
			</Card>

			{category.id === "FINISHING_INTERNAL_PLASTER" || category.id === "FINISHING_EXTERNAL_PLASTER" ? (
				<PlasterItemDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					organizationId={organizationId}
					studyId={studyId}
					buildingConfig={buildingConfig}
					plasterType={
						category.id === "FINISHING_INTERNAL_PLASTER"
							? "internal_plaster"
							: "external_plaster"
					}
					editItem={
						editItem
							? {
									...editItem,
									subCategory: editItem.subCategory ?? undefined,
									floorId: editItem.floorId ?? undefined,
									floorName: editItem.floorName ?? undefined,
									area: editItem.area ?? undefined,
									length: editItem.length ?? undefined,
									width: (editItem as unknown as { width?: number | null }).width ?? undefined,
									quantity: editItem.quantity ?? undefined,
									wastagePercent: editItem.wastagePercent ?? 0,
									materialPrice: editItem.materialPrice ?? 0,
									laborPrice: editItem.laborPrice ?? 0,
									calculationMethod: editItem.calculationMethod ?? undefined,
									calculationData: (editItem.calculationData as Record<string, unknown>) ?? undefined,
									totalCost: editItem.totalCost,
								}
							: undefined
					}
				/>
			) : category.id === "FINISHING_WATERPROOFING" ? (
				<WaterproofingItemDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					organizationId={organizationId}
					studyId={studyId}
					siblingItems={allGroupItems?.filter((i) => i.category === "FINISHING_THERMAL_INSULATION")}
					editItem={
						editItem
							? {
									...editItem,
									subCategory: editItem.subCategory ?? undefined,
									floorId: editItem.floorId ?? undefined,
									floorName: editItem.floorName ?? undefined,
									area: editItem.area ?? undefined,
									length: editItem.length ?? undefined,
									width: (editItem as unknown as { width?: number | null }).width ?? undefined,
									quantity: editItem.quantity ?? undefined,
									wastagePercent: editItem.wastagePercent ?? 0,
									materialPrice: editItem.materialPrice ?? 0,
									laborPrice: editItem.laborPrice ?? 0,
									calculationMethod: editItem.calculationMethod ?? undefined,
									calculationData: (editItem.calculationData as Record<string, unknown>) ?? undefined,
									totalCost: editItem.totalCost,
								}
							: undefined
					}
				/>
			) : category.id === "FINISHING_INTERIOR_PAINT" || category.id === "FINISHING_FACADE_PAINT" || category.id === "FINISHING_BOUNDARY_PAINT" ? (
				<PaintItemDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					organizationId={organizationId}
					studyId={studyId}
					buildingConfig={buildingConfig}
					allStudyItems={allGroupItems}
					paintCategory={
						category.id === "FINISHING_INTERIOR_PAINT"
							? "interior"
							: category.id === "FINISHING_FACADE_PAINT"
								? "facade"
								: "boundary"
					}
					editItem={
						editItem
							? {
									...editItem,
									subCategory: editItem.subCategory ?? undefined,
									floorId: editItem.floorId ?? undefined,
									floorName: editItem.floorName ?? undefined,
									area: editItem.area ?? undefined,
									length: editItem.length ?? undefined,
									width: (editItem as unknown as { width?: number | null }).width ?? undefined,
									quantity: editItem.quantity ?? undefined,
									qualityLevel: editItem.qualityLevel ?? undefined,
									wastagePercent: editItem.wastagePercent ?? 0,
									materialPrice: editItem.materialPrice ?? 0,
									laborPrice: editItem.laborPrice ?? 0,
									calculationMethod: editItem.calculationMethod ?? undefined,
									calculationData: (editItem.calculationData as Record<string, unknown>) ?? undefined,
									totalCost: editItem.totalCost,
								}
							: undefined
					}
				/>
			) : category.id === "FINISHING_THERMAL_INSULATION" ? (
				<ThermalInsulationItemDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					organizationId={organizationId}
					studyId={studyId}
					siblingItems={allGroupItems?.filter((i) => i.category === "FINISHING_WATERPROOFING")}
					editItem={
						editItem
							? {
									...editItem,
									subCategory: editItem.subCategory ?? undefined,
									floorId: editItem.floorId ?? undefined,
									floorName: editItem.floorName ?? undefined,
									area: editItem.area ?? undefined,
									length: editItem.length ?? undefined,
									width: (editItem as unknown as { width?: number | null }).width ?? undefined,
									quantity: editItem.quantity ?? undefined,
									wastagePercent: editItem.wastagePercent ?? 0,
									materialPrice: editItem.materialPrice ?? 0,
									laborPrice: editItem.laborPrice ?? 0,
									calculationMethod: editItem.calculationMethod ?? undefined,
									calculationData: (editItem.calculationData as Record<string, unknown>) ?? undefined,
									totalCost: editItem.totalCost,
								}
							: undefined
					}
				/>
			) : (
				<AddEditFinishingItemDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					organizationId={organizationId}
					studyId={studyId}
					category={category}
					buildingConfig={buildingConfig}
					allItems={allGroupItems}
					editItem={
						editItem
							? {
									...editItem,
									subCategory: editItem.subCategory ?? undefined,
									floorId: editItem.floorId ?? undefined,
									floorName: editItem.floorName ?? undefined,
									area: editItem.area ?? undefined,
									quantity: editItem.quantity ?? undefined,
									length: editItem.length ?? undefined,
									qualityLevel: editItem.qualityLevel ?? undefined,
									wastagePercent: editItem.wastagePercent ?? 0,
									materialPrice: editItem.materialPrice ?? 0,
									laborPrice: editItem.laborPrice ?? 0,
									calculationMethod: editItem.calculationMethod ?? undefined,
									calculationData: (editItem.calculationData as Record<string, unknown>) ?? undefined,
									brand: editItem.brand ?? undefined,
									specifications: editItem.specifications ?? undefined,
									description: editItem.description ?? undefined,
								}
							: undefined
					}
				/>
			)}
		</>
	);
}
