"use client";

import { useState, useMemo } from "react";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	Plus,
	ChevronDown,
	ChevronLeft,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import { useHeightDerivation } from "../../../../hooks/useHeightDerivation";
import type { StructuralItemDeleteInput } from "../../../../types/structural-mutation";
import type { BlocksSectionProps, FloorInfo } from "./types";
import { DEFAULT_FLOOR_NAMES, CLASSIFICATIONS_NEEDING_FLOOR } from "./types";
import { BlockForm } from "./BlockForm";
import { BlockItemsTable } from "./BlockItemsTable";
import { CopyFromFloorButton } from "./CopyFromFloorButton";
import { BlocksSummary } from "./BlocksSummary";

export function BlocksSection({
	studyId,
	organizationId,
	items,
	allItems,
	onSave,
	onUpdate,
	specs,
	buildingFloors,
	buildingConfig,
}: BlocksSectionProps) {
	const { getBlockHeight, getParapetBlockHeight } = useHeightDerivation(buildingConfig ?? null, allItems);
	const t = useTranslations();
	const [editingItemId, setEditingItemId] = useState<string | null>(null);

	// ═══ Floor info ═══
	const floors: FloorInfo[] = useMemo(() => {
		if (buildingFloors) {
			return buildingFloors
				.filter((f) => f.enabled)
				.sort((a, b) => a.sortOrder - b.sortOrder)
				.map((f) => ({
					id: f.id,
					label: f.label,
					icon: f.icon,
					sortOrder: f.sortOrder,
					isRepeated: f.isRepeated,
					repeatCount: f.repeatCount,
				}));
		}
		return DEFAULT_FLOOR_NAMES.map((name, i) => ({
			id: name,
			label: name,
			icon: "\u2B1B",
			sortOrder: i,
			isRepeated: name === "متكرر",
			repeatCount: 1,
		}));
	}, [buildingFloors]);

	const [expandedSections, setExpandedSections] = useState<string[]>(["general", floors[0]?.label || ""]);
	const [addingForSection, setAddingForSection] = useState<string | null>(null);

	// ═══ Delete mutation ═══
	const deleteMutation = useMutation(
		orpc.pricing.studies.structuralItem.delete.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.studies.messages.itemDeleted"));
				onUpdate();
			},
			onError: () => {
				toast.error(t("pricing.studies.messages.itemDeleteError"));
			},
		})
	);

	const handleDelete = (id: string) => {
		if (confirm(t("pricing.studies.messages.confirmDelete"))) {
			(deleteMutation.mutate as (data: StructuralItemDeleteInput) => void)({ id, organizationId, costStudyId: studyId });
		}
	};

	// ═══ Item grouping ═══
	const generalItems = items.filter(
		(i) => !CLASSIFICATIONS_NEEDING_FLOOR.includes(String(i.dimensions?.wallCategory))
	);

	const getFloorItems = (floorLabel: string, isFirst: boolean) => {
		const floorItems = items.filter(
			(i) =>
				CLASSIFICATIONS_NEEDING_FLOOR.includes(String(i.dimensions?.wallCategory)) &&
				String(i.dimensions?.floor) === floorLabel
		);
		if (isFirst) {
			const allLabels = floors.map((f) => f.label);
			const unassigned = items.filter(
				(i) =>
					CLASSIFICATIONS_NEEDING_FLOOR.includes(String(i.dimensions?.wallCategory)) &&
					(!i.dimensions?.floor || !allLabels.includes(String(i.dimensions.floor)))
			);
			return [...floorItems, ...unassigned];
		}
		return floorItems;
	};

	// ═══ Toggle section ═══
	const toggleSection = (sectionId: string) => {
		setExpandedSections((prev) =>
			prev.includes(sectionId) ? prev.filter((s) => s !== sectionId) : [...prev, sectionId]
		);
	};

	// ═══ Edit handler for BlockItemsTable ═══
	const handleEdit = (itemId: string, wallCategory: string, floor: string, _defaultFloorLabel: string) => {
		setEditingItemId(itemId);
		if (CLASSIFICATIONS_NEEDING_FLOOR.includes(wallCategory)) {
			setAddingForSection(floor || floors[0]?.label || "");
		} else {
			setAddingForSection("general");
		}
	};

	const handleFormClose = () => {
		setAddingForSection(null);
		setEditingItemId(null);
	};

	return (
		<div className="space-y-3">
			{/* ═══ General Section (boundary, retaining, parapet) ═══ */}
			<div
				className={`border rounded-lg overflow-hidden transition-all ${
					generalItems.length > 0
						? "border-amber-200/50 bg-amber-50/20 dark:bg-amber-950/10"
						: "border-border"
				}`}
			>
				<button
					type="button"
					className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
					onClick={() => toggleSection("general")}
				>
					<div className="flex items-center gap-3">
						{expandedSections.includes("general") ? (
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						) : (
							<ChevronLeft className="h-4 w-4 text-muted-foreground" />
						)}
						<span className="text-lg">🏗️</span>
						<span className="font-semibold">عام</span>
						<span className="text-xs text-muted-foreground">(أسوار، استنادي، دروة)</span>
						{generalItems.length > 0 && (
							<Badge variant="secondary" className="text-xs">
								{generalItems.length} عنصر
							</Badge>
						)}
					</div>
				</button>

				{expandedSections.includes("general") && (
					<div className="px-4 pb-4 space-y-3">
						{/* Table of general items */}
						{generalItems.length > 0 && (
							<BlockItemsTable
								items={generalItems}
								onEdit={handleEdit}
								onDelete={handleDelete}
								isDeletePending={deleteMutation.isPending}
							/>
						)}

						{/* Add/Edit form or button */}
						{addingForSection === "general" || (editingItemId && generalItems.find((i) => i.id === editingItemId)) ? (
							<BlockForm
								isFloorScoped={false}
								editingItem={editingItemId ? generalItems.find((i) => i.id === editingItemId) || null : null}
								onSave={handleFormClose}
								onCancel={handleFormClose}
								studyId={studyId}
								organizationId={organizationId}
								items={items}
								editingItemId={editingItemId}
								onSaveCallback={onSave}
								onUpdateCallback={onUpdate}
								derivedBlockHeight={getParapetBlockHeight()}
							/>
						) : (
							<Button
								variant="outline"
								className="w-full bg-primary/10 text-primary border-2 border-dashed border-primary/40 hover:bg-primary/20 hover:border-primary/60 transition-all"
								onClick={() => setAddingForSection("general")}
							>
								<Plus className="h-5 w-5 ml-2" />
								<span className="font-semibold">{t("pricing.studies.structural.addItem")}</span>
							</Button>
						)}
					</div>
				)}
			</div>

			{/* ═══ Per-Floor Sections ═══ */}
			{floors.map((floor, floorIndex) => {
				const floorItems = getFloorItems(floor.label, floorIndex === 0);
				const isExpanded = expandedSections.includes(floor.label);
				const hasItems = floorItems.length > 0;
				const isAddingHere = addingForSection === floor.label;
				const editingItemInFloor = editingItemId ? floorItems.find((i) => i.id === editingItemId) : null;

				return (
					<div
						key={floor.id}
						className={`border rounded-lg overflow-hidden transition-all ${
							hasItems
								? "border-blue-200/50 bg-blue-50/20 dark:bg-blue-950/10"
								: "border-border"
						} ${
							floor.isRepeated && hasItems
								? "border-purple-300/50 bg-purple-50/20 dark:bg-purple-950/10"
								: ""
						}`}
					>
						{/* Floor header */}
						<button
							type="button"
							className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
							onClick={() => toggleSection(floor.label)}
						>
							<div className="flex items-center gap-3">
								{isExpanded ? (
									<ChevronDown className="h-4 w-4 text-muted-foreground" />
								) : (
									<ChevronLeft className="h-4 w-4 text-muted-foreground" />
								)}
								<span className="text-lg">{floor.icon}</span>
								<span className="font-semibold">{floor.label}</span>
								{floor.isRepeated && floor.repeatCount > 1 && (
									<Badge variant="default" className="bg-purple-600 text-xs">
										{floor.repeatCount} أدوار
									</Badge>
								)}
								{hasItems && (
									<Badge variant="secondary" className="text-xs">
										{floorItems.length} جدار
									</Badge>
								)}
							</div>
						</button>

						{isExpanded && (
							<div className="px-4 pb-4 space-y-3">
								{floorItems.length > 0 && (
									<BlockItemsTable
										items={floorItems}
										onEdit={handleEdit}
										onDelete={handleDelete}
										isDeletePending={deleteMutation.isPending}
									/>
								)}

								{isAddingHere || editingItemInFloor ? (
									<BlockForm
										isFloorScoped={true}
										floorLabel={floor.label}
										editingItem={editingItemInFloor || null}
										onSave={handleFormClose}
										onCancel={handleFormClose}
										studyId={studyId}
										organizationId={organizationId}
										items={items}
										editingItemId={editingItemId}
										onSaveCallback={onSave}
										onUpdateCallback={onUpdate}
										derivedBlockHeight={getBlockHeight(floor.id)}
									/>
								) : (
									<div className="space-y-2">
										<Button
											variant="outline"
											className="w-full bg-primary/10 text-primary border-2 border-dashed border-primary/40 hover:bg-primary/20 hover:border-primary/60 transition-all"
											onClick={() => setAddingForSection(floor.label)}
										>
											<Plus className="h-5 w-5 ml-2" />
											<span className="font-semibold">{t("pricing.studies.structural.addItem")}</span>
										</Button>
										{/* Copy from floor */}
										{floors.filter(
											(f) =>
												f.label !== floor.label &&
												getFloorItems(f.label, floors[0]?.label === f.label).length > 0
										).length > 0 && (
											<CopyFromFloorButton
												currentFloor={floor.label}
												floors={floors}
												getFloorItems={getFloorItems}
												studyId={studyId}
												organizationId={organizationId}
												onSave={onSave}
											/>
										)}
									</div>
								)}
							</div>
						)}
					</div>
				);
			})}

			{/* Summary */}
			<BlocksSummary items={items} />
		</div>
	);
}
