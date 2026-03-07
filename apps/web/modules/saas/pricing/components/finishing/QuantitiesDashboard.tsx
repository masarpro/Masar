"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Search,
	Filter,
	Settings,
	ClipboardList,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FINISHING_GROUPS } from "../../lib/finishing-categories";
import {
	deriveAllQuantities,
	calculateCascadeEffects,
} from "../../lib/derivation-engine";
import type { SmartBuildingConfig } from "../../lib/smart-building-types";
import {
	mergeQuantities,
	type MergedQuantityItem,
	type SavedFinishingItem,
} from "../../lib/merge-quantities";
import {
	extractKnowledgeFromItem,
	type ExtractionResult,
} from "../../lib/knowledge-extractor";
import type { ItemSpecification, SavedCategorySpec, SpecificationTemplate } from "../../lib/specs/spec-types";
import { buildItemSpec } from "../../lib/specs/spec-calculator";
import { mapToCatalogCategory } from "../../lib/utils";
import { BuildingSummaryBar } from "./BuildingSummaryBar";
import { SpecBulkEditor } from "./specs/SpecBulkEditor";
import { BillOfMaterials } from "./specs/BillOfMaterials";
import { QuantitiesTable } from "./QuantitiesTable";
import { ManualItemAdder } from "./ManualItemAdder";
import { KnowledgeNotification } from "./KnowledgeNotification";
import {
	CascadeNotification,
	type CascadeChange,
} from "./CascadeNotification";

interface QuantitiesDashboardProps {
	organizationId: string;
	studyId: string;
	config: SmartBuildingConfig | null;
	savedItems: SavedFinishingItem[];
	initialCascade?: {
		changes: CascadeChange[];
		skippedManualCount: number;
	} | null;
	onEditConfig: () => void;
}

type GroupFilter = string | null;
type StatusFilter =
	| "all"
	| "auto"
	| "manual"
	| "estimated"
	| "disabled";

const GROUP_TABS = [
	{ key: null, label: "" },
	...Object.values(FINISHING_GROUPS)
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((g) => ({ key: g.id, label: g.nameAr })),
];

export function QuantitiesDashboard({
	organizationId,
	studyId,
	config,
	savedItems,
	initialCascade,
	onEditConfig,
}: QuantitiesDashboardProps) {
	const t = useTranslations("pricing.studies.finishing.dashboard");
	const queryClient = useQueryClient();

	// Filters
	const [groupFilter, setGroupFilter] = useState<GroupFilter>(null);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [showBulkEditor, setShowBulkEditor] = useState(false);
	const [dashboardView, setDashboardView] = useState<"quantities" | "bom">("quantities");

	// Knowledge extraction state
	const [pendingKnowledge, setPendingKnowledge] = useState<{
		result: ExtractionResult;
	} | null>(null);

	// Cascade notification state
	const [cascadeChanges, setCascadeChanges] = useState<{
		changes: CascadeChange[];
		skippedManualCount: number;
	} | null>(initialCascade ?? null);

	// Derive quantities from config
	const derived = useMemo(
		() => (config ? deriveAllQuantities(config) : []),
		[config],
	);

	// Merge derived + saved
	const merged = useMemo(
		() => mergeQuantities(derived, savedItems),
		[derived, savedItems],
	);

	// Local state for optimistic updates
	const [localItems, setLocalItems] =
		useState<MergedQuantityItem[]>(merged);

	// Keep in sync when merged changes
	useEffect(() => {
		setLocalItems(merged);
	}, [merged]);

	// Stats
	const totalItems = localItems.length;
	const enabledCount = localItems.filter((i) => i.isEnabled).length;
	const disabledCount = totalItems - enabledCount;
	const hasAnySpecs = localItems.some((i) => i.isEnabled && i.specData);

	// Filtered items
	const filteredItems = useMemo(() => {
		let items = localItems;

		// Group filter
		if (groupFilter) {
			items = items.filter((i) => i.groupKey === groupFilter);
		}

		// Status filter
		if (statusFilter !== "all") {
			items = items.filter((i) => {
				switch (statusFilter) {
					case "auto":
						return (
							i.dataSource === "auto_building" ||
							i.dataSource === "auto_linked" ||
							i.dataSource === "auto_derived"
						);
					case "manual":
						return i.dataSource === "manual";
					case "estimated":
						return i.dataSource === "estimated";
					case "disabled":
						return !i.isEnabled;
					default:
						return true;
				}
			});
		}

		// Text search
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			items = items.filter(
				(i) =>
					i.name.toLowerCase().includes(q) ||
					(i.floorName ?? "").toLowerCase().includes(q),
			);
		}

		return items;
	}, [localItems, groupFilter, statusFilter, searchQuery]);

	// ── Mutations ──

	const saveMutation = useMutation(
		orpc.pricing.studies.finishingItem.createBatch.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
			},
		}),
	);

	const updateMutation = useMutation(
		orpc.pricing.studies.finishingItem.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
			},
		}),
	);

	const configUpdateMutation = useMutation(
		orpc.pricing.studies.buildingConfig.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "getById"]],
				});
			},
		}),
	);

	// ── Knowledge extraction handlers ──

	const handleKnowledgeAccept = useCallback(() => {
		if (!pendingKnowledge) return;
		const { result } = pendingKnowledge;

		// 1. Save updated config to DB
		const fullConfig: SmartBuildingConfig = {
			...(config ?? { totalLandArea: 0, buildingPerimeter: 0, floors: [] }),
			...result.updatedConfig,
		};
		configUpdateMutation.mutate({
			organizationId,
			costStudyId: studyId,
			buildingConfig: fullConfig,
		});

		// 2. Batch-create the derived items
		const items = result.newDerivedItems.map((d) => ({
			category: mapToCatalogCategory(d.categoryKey),
			subCategory: d.subCategory,
			name: getItemDisplayName(d.categoryKey, t),
			floorId: d.floorId,
			floorName: d.floorName,
			area: d.unit === "m2" ? d.quantity : undefined,
			length: d.unit === "m" ? d.quantity : undefined,
			quantity:
				d.unit !== "m2" && d.unit !== "m" ? d.quantity : undefined,
			unit: d.unit,
			wastagePercent: d.wastagePercent,
			materialPrice: 0,
			laborPrice: 0,
			materialCost: 0,
			laborCost: 0,
			totalCost: 0,
			dataSource: d.dataSource,
			sourceFormula: d.calculationBreakdown?.formula,
			isEnabled: d.isEnabled,
			sortOrder: 0,
			groupKey: d.groupKey,
			scope: d.scope,
		}));

		saveMutation.mutate(
			{
				organizationId,
				costStudyId: studyId,
				items,
			},
			{
				onSuccess: () => {
					toast.success(
						t("itemsAdded", { count: items.length }),
					);
				},
			},
		);

		setPendingKnowledge(null);
	}, [
		pendingKnowledge,
		config,
		organizationId,
		studyId,
		configUpdateMutation,
		saveMutation,
	]);

	const handleKnowledgeDismiss = useCallback(() => {
		setPendingKnowledge(null);
	}, []);

	/**
	 * After saving a manual item, attempt knowledge extraction.
	 * Called from debouncedSave after a successful save.
	 */
	const tryExtractKnowledge = useCallback(
		(item: MergedQuantityItem) => {
			if (item.dataSource !== "manual") return;

			// Build an ExtractableItem from the merged item
			const extractable = {
				category: item.category,
				floorId: item.floorId,
				floorName: item.floorName,
				area:
					item.unit === "m2" ? item.quantity : undefined,
				quantity:
					item.unit !== "m2" && item.unit !== "m"
						? item.quantity
						: undefined,
				unit: item.unit,
				dataSource: item.dataSource,
				// calculationData is not available on MergedQuantityItem,
				// so extraction only works for saved items with calculationData
			};

			const result = extractKnowledgeFromItem(extractable, config);
			if (result && result.newDerivedItems.length > 0) {
				setPendingKnowledge({ result });
			}
		},
		[config],
	);

	// Debounced save
	const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);

	const debouncedSave = useCallback(
		(item: MergedQuantityItem) => {
			if (saveTimerRef.current) {
				clearTimeout(saveTimerRef.current);
			}
			saveTimerRef.current = setTimeout(() => {
				if (item.isSaved && item.savedId) {
					updateMutation.mutate(
						{
							organizationId,
							costStudyId: studyId,
							id: item.savedId,
							isEnabled: item.isEnabled,
							area:
								item.unit === "m2"
									? item.quantity
									: undefined,
							length:
								item.unit === "m"
									? item.quantity
									: undefined,
							quantity:
								item.unit !== "m2" && item.unit !== "m"
									? item.quantity
									: undefined,
							wastagePercent: item.wastagePercent,
							dataSource: item.dataSource,
						},
						{
							onSuccess: () => {
								toast.success(t("saved"));
								tryExtractKnowledge(item);
							},
						},
					);
				} else {
					saveMutation.mutate(
						{
							organizationId,
							costStudyId: studyId,
							items: [
								{
									category: item.category,
									subCategory: item.subCategory,
									name: item.name,
									floorId: item.floorId,
									floorName: item.floorName,
									area:
										item.unit === "m2"
											? item.quantity
											: undefined,
									length:
										item.unit === "m"
											? item.quantity
											: undefined,
									quantity:
										item.unit !== "m2" &&
										item.unit !== "m"
											? item.quantity
											: undefined,
									unit: item.unit,
									wastagePercent: item.wastagePercent,
									materialPrice: 0,
									laborPrice: 0,
									materialCost: 0,
									laborCost: 0,
									totalCost: 0,
									dataSource: item.dataSource,
									sourceFormula: item.sourceFormula,
									isEnabled: item.isEnabled,
									sortOrder: item.sortOrder,
									groupKey: item.groupKey,
									scope: item.scope,
								},
							],
						},
						{
							onSuccess: () => {
								toast.success(t("saved"));
								tryExtractKnowledge(item);
							},
						},
					);
				}
			}, 1000);
		},
		[organizationId, studyId, saveMutation, updateMutation, t, tryExtractKnowledge],
	);

	// ── Handlers ──

	const handleToggleEnabled = useCallback(
		(key: string, enabled: boolean) => {
			setLocalItems((prev) => {
				const updated = prev.map((i) =>
					i.key === key ? { ...i, isEnabled: enabled } : i,
				);
				const item = updated.find((i) => i.key === key);
				if (item) debouncedSave(item);
				return updated;
			});
		},
		[debouncedSave],
	);

	const handleManualOverride = useCallback(
		(key: string, newQuantity: number) => {
			setLocalItems((prev) => {
				const item = prev.find((i) => i.key === key);
				if (!item) return prev;

				// Apply change to the target item
				let updated = prev.map((i) =>
					i.key === key
						? {
								...i,
								quantity: newQuantity,
								effectiveQuantity:
									Math.round(
										newQuantity *
											(1 + i.wastagePercent / 100) *
											100,
									) / 100,
								dataSource: "manual" as const,
								isManualOverride: true,
								isStale: true,
							}
						: i,
				);

				// Calculate cascade effects
				const cascadeEffects = calculateCascadeEffects(
					item.categoryKey,
					newQuantity,
					derived,
				);

				if (cascadeEffects.length > 0) {
					const cascadeResults: CascadeChange[] = [];
					let skippedManual = 0;

					for (const effect of cascadeEffects) {
						const affectedItem = updated.find(
							(i) => i.categoryKey === effect.itemKey,
						);
						if (!affectedItem) continue;

						if (affectedItem.dataSource === "manual") {
							// Don't update manual items, mark as stale
							skippedManual++;
							updated = updated.map((i) =>
								i.categoryKey === effect.itemKey
									? { ...i, isStale: true, derivedQuantity: effect.newQuantity }
									: i,
							);
							cascadeResults.push({
								itemKey: effect.itemKey,
								itemName: affectedItem.name,
								oldQuantity: affectedItem.quantity,
								newQuantity: effect.newQuantity,
								unit: affectedItem.unit,
								isManual: true,
							});
						} else {
							// Auto-update non-manual items
							const newEffective =
								Math.round(
									effect.newQuantity *
										(1 + affectedItem.wastagePercent / 100) *
										100,
								) / 100;
							updated = updated.map((i) =>
								i.categoryKey === effect.itemKey
									? {
											...i,
											quantity: effect.newQuantity,
											effectiveQuantity: newEffective,
											derivedQuantity: effect.newQuantity,
											derivedEffective: newEffective,
										}
									: i,
							);
							cascadeResults.push({
								itemKey: effect.itemKey,
								itemName: affectedItem.name,
								oldQuantity: effect.oldQuantity,
								newQuantity: effect.newQuantity,
								unit: affectedItem.unit,
								isManual: false,
							});
						}
					}

					if (cascadeResults.length > 0) {
						const autoCount = cascadeResults.filter((c) => !c.isManual).length;
						if (autoCount > 0) {
							toast.success(
								t("linkedItemsUpdated", { count: autoCount }),
							);
						}
						setCascadeChanges({
							changes: cascadeResults,
							skippedManualCount: skippedManual,
						});
					}

					// Save cascaded items
					for (const effect of cascadeEffects) {
						const cascadedItem = updated.find(
							(i) => i.categoryKey === effect.itemKey && i.dataSource !== "manual",
						);
						if (cascadedItem) {
							debouncedSave(cascadedItem);
						}
					}
				}

				// Save the changed item itself
				const changedItem = updated.find((i) => i.key === key);
				if (changedItem) debouncedSave(changedItem);

				return updated;
			});
		},
		[debouncedSave, derived],
	);

	const handleResetToAuto = useCallback(
		(key: string) => {
			setLocalItems((prev) => {
				const updated = prev.map((i) => {
					if (i.key !== key || i.derivedQuantity == null) return i;
					return {
						...i,
						quantity: i.derivedQuantity,
						effectiveQuantity: i.derivedEffective ?? i.derivedQuantity,
						dataSource: "auto_building" as const,
						isManualOverride: false,
						isStale: false,
					};
				});
				const item = updated.find((i) => i.key === key);
				if (item) debouncedSave(item);
				return updated;
			});
		},
		[debouncedSave],
	);

	const handleAddManualItem = useCallback(
		(newItem: {
			category: string;
			name: string;
			floorId?: string;
			floorName?: string;
			unit: string;
			quantity: number;
			scope: string;
		}) => {
			const item: MergedQuantityItem = {
				key: `manual_${Date.now()}`,
				savedId: null,
				isSaved: false,
				categoryKey: newItem.category,
				category: newItem.category,
				name: newItem.name,
				floorId: newItem.floorId,
				floorName: newItem.floorName,
				scope: newItem.scope,
				groupKey: "OTHER",
				groupName: t("groupOther"),
				groupIcon: "Package",
				groupColor: "gray",
				quantity: newItem.quantity,
				unit: newItem.unit,
				wastagePercent: 0,
				effectiveQuantity: newItem.quantity,
				dataSource: "manual",
				sourceDescription: t("sourceManual"),
				isEnabled: true,
				sortOrder: localItems.length,
				isManualOverride: false,
				isStale: false,
			};

			setLocalItems((prev) => [...prev, item]);
			debouncedSave(item);
		},
		[localItems.length, debouncedSave],
	);

	const handleSaveSpec = useCallback(
		(key: string, spec: ItemSpecification) => {
			setLocalItems((prev) => {
				const updated = prev.map((i) =>
					i.key === key
						? { ...i, specData: spec }
						: i,
				);
				const item = updated.find((i) => i.key === key);
				if (item?.isSaved && item.savedId) {
					const specDescription = `${spec.specTypeLabel}${
						spec.options?.brand
							? ` — ${spec.options.brand}`
							: ""
					}`;
					updateMutation.mutate(
						{
							organizationId,
							costStudyId: studyId,
							id: item.savedId,
							specData: spec,
							qualityLevel:
								(spec.options?.qualityLevel as string) ??
								undefined,
							brand:
								(spec.options?.brand as string) ?? undefined,
							specifications: specDescription,
						},
						{
							onSuccess: () => {
								toast.success(t("saved"));
							},
						},
					);
				}
				return updated;
			});
		},
		[organizationId, studyId, updateMutation, t],
	);

	const handleBulkSaveAll = useCallback(
		(specMap: Map<string, ItemSpecification>) => {
			setLocalItems((prev) => {
				const updated = prev.map((i) => {
					const spec = specMap.get(i.key);
					if (!spec) return i;
					return { ...i, specData: spec };
				});

				// Persist each item that has a spec and is saved
				for (const item of updated) {
					const spec = specMap.get(item.key);
					if (!spec || !item.isSaved || !item.savedId) continue;

					const specDescription = `${spec.specTypeLabel}${
						spec.options?.brand
							? ` — ${spec.options.brand}`
							: ""
					}`;
					updateMutation.mutate({
						organizationId,
						costStudyId: studyId,
						id: item.savedId,
						specData: spec,
						qualityLevel:
							(spec.options?.qualityLevel as string) ??
							undefined,
						brand:
							(spec.options?.brand as string) ?? undefined,
						specifications: specDescription,
					});
				}

				toast.success(t("saved"));
				return updated;
			});
		},
		[organizationId, studyId, updateMutation, t],
	);

	const handleSaveTemplate = useCallback(
		(_name: string, _specs: SavedCategorySpec[]) => {
			// Template saving is handled by the parent if ORPC is available
			// For now, just show a toast — full API integration comes with the router wiring
			toast.success(t("templateSaved"));
		},
		[],
	);

	return (
		<div className="space-y-5">
			{/* Building Summary */}
			<BuildingSummaryBar
				config={config}
				onEditConfig={onEditConfig}
			/>

			{/* Knowledge Notification */}
			{pendingKnowledge && (
				<KnowledgeNotification
					notification={pendingKnowledge.result.notification}
					derivedItems={pendingKnowledge.result.newDerivedItems}
					onAccept={handleKnowledgeAccept}
					onDismiss={handleKnowledgeDismiss}
				/>
			)}

			{/* Cascade Notification */}
			{cascadeChanges && (
				<CascadeNotification
					changes={cascadeChanges.changes}
					skippedManualCount={cascadeChanges.skippedManualCount}
					onDismiss={() => setCascadeChanges(null)}
				/>
			)}

			{/* Toolbar */}
			<div className="space-y-3">
				{/* Group tabs */}
				<div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
					{GROUP_TABS.map((tab) => (
						<Button
							key={tab.key ?? "all"}
							variant={
								groupFilter === tab.key
									? "primary"
									: "ghost"
							}
							size="sm"
							className={`text-sm h-8 px-3.5 rounded-full shrink-0 transition-all duration-200 ${
								groupFilter === tab.key
									? ""
									: "hover:bg-muted"
							}`}
							onClick={() => setGroupFilter(tab.key)}
						>
							{tab.key === null ? t("filterAll") : tab.label}
						</Button>
					))}
				</div>

				{/* Search + filters + stats */}
				<div className="flex flex-wrap items-center gap-2.5">
					{/* Search */}
					<div className="relative flex-1 min-w-[200px] max-w-sm">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
							placeholder={t("searchPlaceholder")}
							className="ps-9 h-9 text-sm rounded-lg"
						/>
					</div>

					{/* Status filter */}
					<div className="flex items-center gap-1.5">
						<Filter className="h-4 w-4 text-muted-foreground" />
						{(
							[
								["all", t("filterAll")],
								["auto", t("filterAuto")],
								["manual", t("filterManual")],
								["estimated", t("filterEstimated")],
								["disabled", t("filterDisabled")],
							] as const
						).map(([key, label]) => (
							<Button
								key={key}
								variant={
									statusFilter === key
										? "secondary"
										: "ghost"
								}
								size="sm"
								className={`text-xs h-7 px-2.5 rounded-full transition-all duration-200 ${
									statusFilter === key ? "font-medium" : ""
								}`}
								onClick={() =>
									setStatusFilter(key as StatusFilter)
								}
							>
								{label}
							</Button>
						))}
					</div>

					{/* Stats */}
					<div className="ms-auto flex items-center gap-3 text-sm text-muted-foreground">
						<span>
							{t("totalItems")}: <strong className="text-foreground tabular-nums">{totalItems}</strong>
						</span>
						<span className="text-border">|</span>
						<span>
							{t("enabled")}: <strong className="text-foreground tabular-nums">{enabledCount}</strong>
						</span>
						{disabledCount > 0 && (
							<>
								<span className="text-border">|</span>
								<span>
									{t("disabled")}: <strong className="text-foreground tabular-nums">{disabledCount}</strong>
								</span>
							</>
						)}
					</div>

					{/* Add manual item */}
					<ManualItemAdder
						floors={config?.floors ?? []}
						onAdd={handleAddManualItem}
					/>

					{/* Bulk spec editor button */}
					<Button
						variant="outline"
						size="sm"
						className="h-9 text-sm rounded-lg"
						onClick={() => setShowBulkEditor(true)}
					>
						<Settings className="h-4 w-4 me-1.5" />
						{t("setSpecs")}
					</Button>

					{/* BOM tab button */}
					{hasAnySpecs && (
						<Button
							variant={dashboardView === "bom" ? "primary" : "outline"}
							size="sm"
							className="h-9 text-sm rounded-lg"
							onClick={() =>
								setDashboardView(
									dashboardView === "bom"
										? "quantities"
										: "bom",
								)
							}
						>
							<ClipboardList className="h-4 w-4 me-1.5" />
							{t("billOfMaterials")}
						</Button>
					)}
				</div>
			</div>

			{/* Content: Table or BOM */}
			{dashboardView === "bom" ? (
				<BillOfMaterials items={localItems} />
			) : (
				<QuantitiesTable
					items={filteredItems}
					onToggleEnabled={handleToggleEnabled}
					onManualOverride={handleManualOverride}
					onResetToAuto={handleResetToAuto}
					onSaveSpec={handleSaveSpec}
				/>
			)}

			{/* Bulk Spec Editor Dialog */}
			<SpecBulkEditor
				open={showBulkEditor}
				onOpenChange={setShowBulkEditor}
				items={localItems}
				customTemplates={[]}
				onSaveAll={handleBulkSaveAll}
				onSaveTemplate={handleSaveTemplate}
			/>
		</div>
	);
}

// ── Helpers ──

const ITEM_NAME_PREFIXES = [
	"waterproofing_bathrooms",
	"internal_plaster",
	"interior_paint",
	"flooring",
	"wall_tiles_bathroom",
	"wall_tiles_kitchen",
	"false_ceiling",
] as const;

const ITEM_NAME_KEYS: Record<string, string> = {
	waterproofing_foundations: "itemName_waterproofing_foundations",
	waterproofing_roof: "itemName_waterproofing_roof",
	thermal_walls: "itemName_thermal_walls",
	thermal_roof: "itemName_thermal_roof",
	external_plaster: "itemName_external_plaster",
	facade_paint: "itemName_facade_paint",
	boundary_paint: "itemName_boundary_paint",
	interior_doors: "itemName_interior_doors",
	exterior_doors: "itemName_exterior_doors",
	windows: "itemName_windows",
	bathroom_fixtures: "itemName_bathroom_fixtures",
	vanities: "itemName_vanities",
	kitchen_cabinets: "itemName_kitchen_cabinets",
	internal_stairs: "itemName_internal_stairs",
	external_stairs: "itemName_external_stairs",
	railings: "itemName_railings",
	stone_facade: "itemName_stone_facade",
	facade_decor: "itemName_facade_decor",
	yard_paving: "itemName_yard_paving",
	fence_gates: "itemName_fence_gates",
	landscaping: "itemName_landscaping",
	roof_finishing: "itemName_roof_finishing",
	interior_decor: "itemName_interior_decor",
};

function getItemDisplayName(key: string, t: (key: string) => string): string {
	// Check prefix matches first (for keys like "internal_plaster_floor-abc")
	for (const prefix of ITEM_NAME_PREFIXES) {
		if (key.startsWith(`${prefix}_`)) {
			return t(`itemName_${prefix}`);
		}
	}
	const tKey = ITEM_NAME_KEYS[key];
	return tKey ? t(tKey) : key;
}
