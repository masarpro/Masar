"use client";

import { useState, useMemo } from "react";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Plus,
	Trash2,
	Pencil,
	ChevronDown,
	ChevronLeft,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { toast } from "sonner";
import type { StructuralItemDeleteInput } from "../../../../types/structural-mutation";
import { formatNumber } from "../../../../lib/utils";
import { SLAB_TYPE_INFO, SLAB_FLOOR_NAMES } from "../../../../constants/slabs";
import type { SlabsSectionProps, SlabTypeKey, FloorInfo } from "./types";
import { SlabForm } from "./SlabForm";
import { CopyFromFloorButton } from "./CopyFromFloorButton";

export function SlabsSection({
	studyId,
	organizationId,
	items,
	onSave,
	onUpdate,
	specs,
	buildingFloors,
}: SlabsSectionProps) {
	const t = useTranslations();

	// ═══ Floor definitions ═══
	const floors: FloorInfo[] = useMemo(() => {
		if (buildingFloors) {
			return buildingFloors
				.filter((f) => f.enabled)
				.sort((a, b) => a.sortOrder - b.sortOrder)
				.map((f) => ({
					id: f.id,
					label: f.label,
					icon: f.icon,
					slabArea: f.slabArea,
					isRepeated: f.isRepeated,
					repeatCount: f.repeatCount,
					sortOrder: f.sortOrder,
				}));
		}
		return SLAB_FLOOR_NAMES.map((name, i) => ({
			id: name,
			label: name,
			icon: "⬛",
			slabArea: 0,
			isRepeated: name === "متكرر",
			repeatCount: 1,
			sortOrder: i,
		}));
	}, [buildingFloors]);

	// ═══ Per-floor state ═══
	const [expandedFloors, setExpandedFloors] = useState<string[]>([
		floors[0]?.label || "",
	]);
	const [addingForFloor, setAddingForFloor] = useState<string | null>(null);
	const [editingItemId, setEditingItemId] = useState<string | null>(null);

	// ═══ Item grouping ═══
	const getFloorItems = (floorLabel: string, isFirst: boolean) => {
		const floorItems = items.filter(
			(i) => String(i.dimensions?.floor) === floorLabel,
		);
		if (isFirst) {
			const allLabels = floors.map((f) => f.label);
			const unassigned = items.filter(
				(i) =>
					!i.dimensions?.floor ||
					!allLabels.includes(String(i.dimensions.floor)),
			);
			return [...floorItems, ...unassigned];
		}
		return floorItems;
	};

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
		}),
	);

	const handleDelete = (id: string) => {
		if (confirm(t("pricing.studies.messages.confirmDelete"))) {
			(deleteMutation.mutate as (data: StructuralItemDeleteInput) => void)({
				id,
				organizationId,
				costStudyId: studyId,
			});
		}
	};

	return (
		<div className="space-y-3">
			{floors.map((floor, floorIndex) => {
				const floorItems = getFloorItems(floor.label, floorIndex === 0);
				const isExpanded = expandedFloors.includes(floor.label);
				const hasItems = floorItems.length > 0;
				const isAddingHere = addingForFloor === floor.label;
				const editingItemInFloor = editingItemId
					? floorItems.find((i) => i.id === editingItemId)
					: null;

				const displayConcrete = floor.isRepeated
					? floorItems.reduce((s, i) => s + i.concreteVolume, 0) *
						(floor.repeatCount || 1)
					: floorItems.reduce((s, i) => s + i.concreteVolume, 0);
				const displaySteel = floor.isRepeated
					? floorItems.reduce((s, i) => s + i.steelWeight, 0) *
						(floor.repeatCount || 1)
					: floorItems.reduce((s, i) => s + i.steelWeight, 0);

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
						{/* Floor header button */}
						<button
							type="button"
							className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
							onClick={() =>
								setExpandedFloors((prev) =>
									prev.includes(floor.label)
										? prev.filter((f) => f !== floor.label)
										: [...prev, floor.label],
								)
							}
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
									<Badge
										variant="default"
										className="bg-purple-600 text-xs"
									>
										{floor.repeatCount} أدوار
									</Badge>
								)}
								{hasItems && (
									<Badge variant="secondary" className="text-xs">
										{floorItems.length} سقف
									</Badge>
								)}
							</div>
							{hasItems && (
								<div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
									{displayConcrete > 0 && (
										<span>
											خرسانة:{" "}
											<span className="font-semibold text-blue-600">
												{formatNumber(displayConcrete)} م³
											</span>
										</span>
									)}
									{displaySteel > 0 && (
										<span>
											حديد:{" "}
											<span className="font-semibold text-orange-600">
												{formatNumber(displaySteel)} كجم
											</span>
										</span>
									)}
								</div>
							)}
						</button>

						{/* Floor content */}
						{isExpanded && (
							<div className="px-4 pb-4 space-y-3">
								{/* Items table for this floor */}
								{floorItems.length > 0 && (
									<div className="border rounded-lg overflow-hidden">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="text-right">
														{t(
															"pricing.studies.structural.itemName",
														)}
													</TableHead>
													<TableHead className="text-right">
														النوع
													</TableHead>
													<TableHead className="text-right">
														{t(
															"pricing.studies.structural.quantity",
														)}
													</TableHead>
													<TableHead className="text-right">
														{t("pricing.studies.area")}
													</TableHead>
													<TableHead className="text-right">
														{t(
															"pricing.studies.structural.concreteVolume",
														)}
													</TableHead>
													<TableHead className="text-right">
														{t(
															"pricing.studies.structural.steelWeight",
														)}
													</TableHead>
													<TableHead className="w-12"></TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{floorItems.map((item) => (
													<TableRow key={item.id}>
														<TableCell className="font-medium">
															{item.name}
															{item.dimensions?.beamsCount >
																0 && (
																<Badge
																	variant="secondary"
																	className="text-xs mr-2"
																>
																	+{" "}
																	{
																		item.dimensions
																			.beamsCount
																	}{" "}
																	كمرة
																</Badge>
															)}
														</TableCell>
														<TableCell>
															<Badge variant="outline">
																{SLAB_TYPE_INFO[
																	item.subCategory as SlabTypeKey
																]?.nameAr ||
																	item.subCategory}
															</Badge>
														</TableCell>
														<TableCell>
															{item.quantity}
														</TableCell>
														<TableCell>
															{formatNumber(
																(item.dimensions?.length ||
																	0) *
																	(item.dimensions
																		?.width || 0),
															)}{" "}
															{t(
																"pricing.studies.units.m2",
															)}
														</TableCell>
														<TableCell>
															{formatNumber(
																item.concreteVolume,
															)}{" "}
															{t(
																"pricing.studies.units.m3",
															)}
														</TableCell>
														<TableCell>
															{formatNumber(
																item.steelWeight,
															)}{" "}
															{t(
																"pricing.studies.units.kg",
															)}
														</TableCell>
														<TableCell>
															<div className="flex items-center gap-1">
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => {
																		setEditingItemId(
																			item.id,
																		);
																		setAddingForFloor(
																			floor.label,
																		);
																	}}
																	title={t(
																		"common.edit",
																	)}
																>
																	<Pencil className="h-4 w-4" />
																</Button>
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() =>
																		handleDelete(
																			item.id,
																		)
																	}
																	disabled={
																		deleteMutation.isPending
																	}
																>
																	<Trash2 className="h-4 w-4 text-destructive" />
																</Button>
															</div>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								)}

								{/* SlabForm or Add button */}
								{isAddingHere || editingItemInFloor ? (
									<SlabForm
										floorLabel={floor.label}
										floorSlabArea={floor.slabArea}
										editingItem={editingItemInFloor}
										onSave={() => {
											setAddingForFloor(null);
											setEditingItemId(null);
										}}
										onCancel={() => {
											setAddingForFloor(null);
											setEditingItemId(null);
										}}
										studyId={studyId}
										organizationId={organizationId}
										specs={specs}
										allItems={items}
										onDataSaved={onSave}
										onDataUpdated={onUpdate}
									/>
								) : (
									<Button
										variant="outline"
										className="w-full bg-primary/10 text-primary border-2 border-dashed border-primary/40 hover:bg-primary/20 hover:border-primary/60 transition-all"
										onClick={() =>
											setAddingForFloor(floor.label)
										}
									>
										<Plus className="h-5 w-5 ml-2" />
										<span className="font-semibold">
											{t(
												"pricing.studies.structural.addItem",
											)}
										</span>
									</Button>
								)}

								{/* Copy from floor button */}
								{!isAddingHere &&
									!editingItemInFloor &&
									floors.filter(
										(f) =>
											f.label !== floor.label &&
											getFloorItems(
												f.label,
												floors[0]?.label === f.label,
											).length > 0,
									).length > 0 && (
										<CopyFromFloorButton
											currentFloor={floor.label}
											floors={floors}
											getFloorItems={getFloorItems}
											studyId={studyId}
											organizationId={organizationId}
											specs={specs}
											onCopied={onSave}
										/>
									)}
							</div>
						)}
					</div>
				);
			})}

			{/* Grand total summary */}
			{items.length > 0 && (
				<div className="bg-muted/30 rounded-lg p-4">
					<h4 className="font-medium mb-2">
						{t("pricing.studies.summary.totalItems")}
					</h4>
					<div className="grid grid-cols-3 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								إجمالي المساحة:
							</span>
							<p className="font-bold">
								{formatNumber(
									items.reduce(
										(sum, i) =>
											sum +
											(i.dimensions?.length || 0) *
												(i.dimensions?.width || 0) *
												i.quantity,
										0,
									),
								)}{" "}
								{t("pricing.studies.units.m2")}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("pricing.studies.summary.totalConcrete")}:
							</span>
							<p className="font-bold">
								{formatNumber(
									items.reduce(
										(sum, i) => sum + i.concreteVolume,
										0,
									),
								)}{" "}
								{t("pricing.studies.units.m3")}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">
								{t("pricing.studies.summary.totalRebar")}:
							</span>
							<p className="font-bold">
								{formatNumber(
									items.reduce(
										(sum, i) => sum + i.steelWeight,
										0,
									),
								)}{" "}
								{t("pricing.studies.units.kg")}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
