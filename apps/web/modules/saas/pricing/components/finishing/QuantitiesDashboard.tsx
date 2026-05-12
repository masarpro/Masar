"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Search,
	Filter,
	LayoutList,
	Layers,
	Building2,
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
import { formatNumber, getUnitLabel, mapToCatalogCategory } from "../../lib/utils";
import { usePageContextStore } from "@saas/ai/hooks/use-page-context";
import { BuildingSummaryBar } from "./BuildingSummaryBar";
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

	// View mode: by category, by floor, or aggregated project view
	type ViewMode = "byCategory" | "byFloor" | "byProject";
	const [viewMode, setViewMode] = useState<ViewMode>("byCategory");

	// Filters
	const [groupFilter, setGroupFilter] = useState<GroupFilter>(null);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
	const [searchQuery, setSearchQuery] = useState("");

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

	// إثراء سياق المساعد الذكي بإحصائيات حاسب التشطيبات
	const updateAiContext = usePageContextStore((s) => s.updateContext);
	useEffect(() => {
		updateAiContext({
			pageName: "Finishing Quantities Calculator",
			pageNameAr: "حاسب كميات التشطيبات",
			pageDescription:
				"حاسب كميات التشطيبات الذكي: دهانات، أرضيات، عوازل، حوائط، أسقف، أبواب، شبابيك. يستخرج الكميات تلقائياً من تهيئة المبنى",
			itemCount: totalItems,
			visibleStats: {
				totalItems,
				enabledCount,
				disabledCount,
				viewMode,
			},
			activeFilters: {
				group: groupFilter ?? "all",
				status: statusFilter,
				search: searchQuery || undefined,
			},
		});
	}, [
		totalItems,
		enabledCount,
		disabledCount,
		viewMode,
		groupFilter,
		statusFilter,
		searchQuery,
		updateAiContext,
	]);

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
					queryKey: [["pricing", "studies"]],
				});
			},
		}),
	);

	const updateMutation = useMutation(
		orpc.pricing.studies.finishingItem.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies"]],
				});
			},
		}),
	);

	const configUpdateMutation = useMutation(
		orpc.pricing.studies.buildingConfig.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies"]],
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
		(configUpdateMutation as any).mutate({
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

		(saveMutation as any).mutate(
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
					(updateMutation as any).mutate(
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
					(saveMutation as any).mutate(
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
				{/* View mode toggle */}
				<div className="flex items-center gap-2">
					<span className="text-sm text-muted-foreground font-medium">{t("viewMode")}:</span>
					{([
						["byCategory", t("viewByCategory"), LayoutList, false],
						["byFloor", t("viewByFloor"), Layers, !config?.floors?.length],
						["byProject", t("viewByProject"), Building2, false],
					] as [string, string, typeof LayoutList, boolean][]).map(([mode, label, Icon, isDisabled]) => (
						<div key={mode} className="relative group">
							<Button
								variant={viewMode === mode ? "secondary" : "ghost"}
								size="sm"
								className={`text-sm h-8 px-3 rounded-lg gap-1.5 ${viewMode === mode ? "font-medium" : ""} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
								onClick={() => !isDisabled && setViewMode(mode as ViewMode)}
								disabled={isDisabled}
							>
								<Icon className="h-3.5 w-3.5" />
								{label}
							</Button>
							{isDisabled && (
								<div className="absolute bottom-full mb-1 right-1/2 translate-x-1/2 px-2 py-1 text-xs bg-popover text-popover-foreground border rounded shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
									سيتوفر قريباً
								</div>
							)}
						</div>
					))}
				</div>

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
				</div>
			</div>

			{/* Content: Table */}
			<QuantitiesTable
				items={filteredItems}
				viewMode={viewMode}
				onToggleEnabled={handleToggleEnabled}
				onManualOverride={handleManualOverride}
				onResetToAuto={handleResetToAuto}
			/>

			{/* Aggregated Summary */}
			<FinishingAggregatedSummary items={localItems} />
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

/** Aggregated summary of all finishing quantities */
function FinishingAggregatedSummary({ items }: { items: MergedQuantityItem[] }) {
	const t = useTranslations("pricing.studies.finishing.dashboard");
	const enabledItems = items.filter((i) => i.isEnabled);

	if (enabledItems.length === 0) return null;

	// Aggregate by category+unit across all floors
	const aggregated = new Map<string, { name: string; quantity: number; unit: string }>();
	for (const item of enabledItems) {
		const key = `${item.categoryKey}_${item.unit}`;
		if (!aggregated.has(key)) {
			aggregated.set(key, { name: item.name, quantity: 0, unit: item.unit });
		}
		aggregated.get(key)!.quantity += item.quantity;
	}

	const rows = Array.from(aggregated.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));

	return (
		<div className="rounded-lg border bg-card overflow-hidden">
			<div className="px-4 py-3 bg-muted/40 border-b">
				<h3 className="text-sm font-semibold">{t("aggregatedSummary")}</h3>
			</div>
			<div className="divide-y">
				{rows.map((row) => (
					<div key={`${row.name}_${row.unit}`} className="grid grid-cols-[1fr_120px_60px] gap-2 px-4 py-2 text-sm items-center">
						<span className="font-medium">{row.name}</span>
						<span className="text-center font-semibold tabular-nums" dir="ltr">
							{formatNumber(row.quantity, 1)}
						</span>
						<span className="text-center text-xs text-muted-foreground">
							{getUnitLabel(row.unit)}
						</span>
					</div>
				))}
			</div>
			<div className="px-4 py-2.5 bg-muted/30 border-t text-xs text-muted-foreground">
				{t("totalItems")}: <strong className="text-foreground">{rows.length}</strong>
			</div>
		</div>
	);
}
