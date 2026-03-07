"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Search,
	Filter,
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
	{ key: null, label: "الكل" },
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
			category: mapDerivedCategory(d.categoryKey),
			subCategory: d.subCategory,
			name: getItemDisplayName(d.categoryKey),
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
						`تم إضافة ${items.length} بنود تلقائياً`,
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
								`تم تحديث ${autoCount} بنود مرتبطة`,
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
				groupName: "أخرى",
				groupIcon: "Package",
				groupColor: "gray",
				quantity: newItem.quantity,
				unit: newItem.unit,
				wastagePercent: 0,
				effectiveQuantity: newItem.quantity,
				dataSource: "manual",
				sourceDescription: "إدخال يدوي",
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
		<div className="space-y-4">
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
				<div className="flex flex-wrap gap-1">
					{GROUP_TABS.map((tab) => (
						<Button
							key={tab.key ?? "all"}
							variant={
								groupFilter === tab.key
									? "secondary"
									: "ghost"
							}
							size="sm"
							className="text-xs h-7 px-2"
							onClick={() => setGroupFilter(tab.key)}
						>
							{tab.label}
						</Button>
					))}
				</div>

				{/* Search + filters + stats */}
				<div className="flex flex-wrap items-center gap-2">
					{/* Search */}
					<div className="relative flex-1 min-w-[200px] max-w-sm">
						<Search className="absolute start-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
						<Input
							value={searchQuery}
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
							placeholder={t("searchPlaceholder")}
							className="ps-8 h-8 text-xs"
						/>
					</div>

					{/* Status filter */}
					<div className="flex items-center gap-1">
						<Filter className="h-3.5 w-3.5 text-muted-foreground" />
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
								className="text-[10px] h-6 px-1.5"
								onClick={() =>
									setStatusFilter(key as StatusFilter)
								}
							>
								{label}
							</Button>
						))}
					</div>

					{/* Stats */}
					<div className="ms-auto flex items-center gap-2 text-xs text-muted-foreground">
						<span>
							{t("totalItems")}: {totalItems}
						</span>
						<span>|</span>
						<span>
							{t("enabled")}: {enabledCount}
						</span>
						{disabledCount > 0 && (
							<>
								<span>|</span>
								<span>
									{t("disabled")}: {disabledCount}
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

			{/* Table */}
			<QuantitiesTable
				items={filteredItems}
				onToggleEnabled={handleToggleEnabled}
				onManualOverride={handleManualOverride}
				onResetToAuto={handleResetToAuto}
			/>
		</div>
	);
}

// ── Helpers ──

function mapDerivedCategory(key: string): string {
	const base = key.replace(/_[a-z0-9-]+$/, "");
	const MAP: Record<string, string> = {
		waterproofing_foundations: "FINISHING_WATERPROOFING",
		waterproofing_bathrooms: "FINISHING_WATERPROOFING",
		waterproofing_roof: "FINISHING_WATERPROOFING",
		thermal_walls: "FINISHING_THERMAL_INSULATION",
		thermal_roof: "FINISHING_THERMAL_INSULATION",
		internal_plaster: "FINISHING_INTERNAL_PLASTER",
		external_plaster: "FINISHING_EXTERNAL_PLASTER",
		interior_paint: "FINISHING_INTERIOR_PAINT",
		facade_paint: "FINISHING_FACADE_PAINT",
		boundary_paint: "FINISHING_BOUNDARY_PAINT",
		flooring: "FINISHING_FLOOR_TILES",
		wall_tiles_bathroom: "FINISHING_WALL_TILES",
		wall_tiles_kitchen: "FINISHING_WALL_TILES",
		false_ceiling: "FINISHING_FALSE_CEILING",
		interior_doors: "FINISHING_INTERIOR_DOORS",
		exterior_doors: "FINISHING_EXTERIOR_DOORS",
		windows: "FINISHING_WINDOWS",
		bathroom_fixtures: "FINISHING_BATHROOMS",
		vanities: "FINISHING_MARBLE_VANITIES",
		kitchen_cabinets: "FINISHING_KITCHEN",
		internal_stairs: "FINISHING_INTERNAL_STAIRS",
		external_stairs: "FINISHING_EXTERNAL_STAIRS",
		railings: "FINISHING_RAILINGS",
		stone_facade: "FINISHING_STONE_FACADE",
		facade_decor: "FINISHING_FACADE_DECOR",
		yard_paving: "FINISHING_YARD_PAVING",
		fence_gates: "FINISHING_FENCE_GATES",
		landscaping: "FINISHING_LANDSCAPING",
		roof_finishing: "FINISHING_ROOF",
		interior_decor: "FINISHING_INTERIOR_DECOR",
	};
	return MAP[base] ?? MAP[key] ?? key;
}

function getItemDisplayName(key: string): string {
	const NAMES: Record<string, string> = {
		waterproofing_foundations: "عزل مائي — أساسات",
		waterproofing_roof: "عزل مائي — سطح",
		thermal_walls: "عزل حراري — جدران",
		thermal_roof: "عزل حراري — سطح",
		external_plaster: "لياسة خارجية",
		facade_paint: "دهان واجهات",
		boundary_paint: "دهان سور",
		interior_doors: "أبواب داخلية",
		exterior_doors: "أبواب خارجية",
		windows: "نوافذ ألمنيوم",
		bathroom_fixtures: "تجهيز حمامات",
		vanities: "مغاسل ورخاميات",
		kitchen_cabinets: "خزائن مطبخ",
		internal_stairs: "تكسية درج داخلي",
		external_stairs: "تكسية درج خارجي",
		railings: "درابزين وحواجز",
		stone_facade: "تكسيات واجهات",
		facade_decor: "زخارف واجهات",
		yard_paving: "أرضيات حوش",
		fence_gates: "بوابات سور",
		landscaping: "تنسيق حدائق",
		roof_finishing: "تشطيبات سطح",
		interior_decor: "ديكورات داخلية",
	};
	if (key.startsWith("waterproofing_bathrooms_")) return "عزل مائي — حمامات";
	if (key.startsWith("internal_plaster_")) return "لياسة داخلية";
	if (key.startsWith("interior_paint_")) return "دهان داخلي";
	if (key.startsWith("flooring_")) return "أرضيات";
	if (key.startsWith("wall_tiles_bathroom_")) return "تكسيات جدران حمامات";
	if (key.startsWith("wall_tiles_kitchen_")) return "سبلاش باك مطبخ";
	if (key.startsWith("false_ceiling_")) return "أسقف مستعارة";
	return NAMES[key] ?? key;
}
