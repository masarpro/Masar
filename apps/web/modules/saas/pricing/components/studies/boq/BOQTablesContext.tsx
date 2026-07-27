"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { resolveImageSrc } from "@saas/shared/lib/image-src";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { toast } from "sonner";

import {
	aggregateBOQ,
	buildFloorFilterOptions,
	buildItemFilterOptions,
	buildSectionFilterOptions,
	filterItemsByFloor,
	filterItemsById,
	filterItemsBySection,
	type BOQSummary,
	type StructuralItem,
} from "../../../lib/boq-aggregator";
import {
	buildCostReport,
	buildMaterialCostUpdates,
	readMaterialPrices,
	type CostReport,
} from "../../../lib/cost-report";
import {
	exportBOQToExcel,
	exportCostReport,
	exportCuttingDetails,
	exportFactoryOrder,
} from "../../../lib/boq-export";
import { printBOQ } from "../BOQPrintView";
import { printCostReport } from "../CostReportPrintView";

// ═══════════════════════════════════════════════════════════════
// سياق جداول الكميات — مصدر واحد للفلاتر والتحديد والتجميع
// ───────────────────────────────────────────────────────────────
// اللوحات الأربع (ملخص الكميات، طلبية المصنع، تفاصيل التفصيل،
// التكلفة والتسعير) تبقى مركّبة معاً وتتشارك نفس الحساب، فالتنقل
// بينها فوري بلا إعادة جلب ولا إعادة حساب.
// ═══════════════════════════════════════════════════════════════

export interface EnabledFloorOption {
	id: string;
	label: string;
	icon?: string;
	sortOrder: number;
}

interface BOQTablesValue {
	// البيانات
	allItems: StructuralItem[];
	/** البنود بعد الفلاتر والتحديد — أساس كل الجداول */
	items: StructuralItem[];
	summary: BOQSummary;
	enabledFloors?: EnabledFloorOption[];
	studyName?: string;
	unscheduledSteelWeight: number;

	// الفلاتر
	floorOptions: ReturnType<typeof buildFloorFilterOptions>;
	sectionOptions: ReturnType<typeof buildSectionFilterOptions>;
	itemOptions: ReturnType<typeof buildItemFilterOptions>;
	selectedFloor: string;
	setSelectedFloor: (v: string) => void;
	selectedSection: string;
	setSelectedSection: (v: string) => void;
	selectedItemId: string;
	setSelectedItemId: (v: string) => void;
	scopeLabel?: string;
	resetFilters: () => void;
	hasActiveFilters: boolean;

	// تحديد البنود بالصح
	/** null = كل البنود مُحدَّدة */
	selectedIds: Set<string> | null;
	isSelected: (id: string) => boolean;
	toggleItem: (id: string) => void;
	setSelection: (ids: string[], selected: boolean) => void;
	selectAll: () => void;
	clearSelection: () => void;
	selectionCount: number;
	selectableCount: number;

	// تحديد صفوف طلبية المصنع / التقطيع (للتصدير)
	selectedDiameters: Set<number> | null;
	toggleDiameter: (d: number) => void;
	resetDiameters: () => void;
	isDiameterSelected: (d: number) => boolean;

	// الطي
	expandedSections: Set<string>;
	toggleSection: (key: string) => void;
	expandedCutting: Set<string>;
	toggleCutting: (key: string) => void;

	// تقرير التكلفة
	costReport: CostReport | null;
	costReportLoading: boolean;
	syncMaterials: () => void;
	isSyncingMaterials: boolean;

	// التصدير والطباعة
	exportActive: (tab: BOQTableTab) => void;
	printActive: (tab: BOQTableTab) => void;
}

export type BOQTableTab = "summary" | "factory" | "cutting" | "cost";

const BOQTablesContext = createContext<BOQTablesValue | null>(null);

export function useBOQTables(): BOQTablesValue {
	const ctx = useContext(BOQTablesContext);
	if (!ctx) {
		throw new Error("useBOQTables must be used inside <BOQTablesProvider>");
	}
	return ctx;
}

/** آمن للاستخدام داخل مكونات قد تُركَّب خارج السياق */
export function useBOQTablesOptional(): BOQTablesValue | null {
	return useContext(BOQTablesContext);
}

interface BOQTablesProviderProps {
	organizationId: string;
	studyId: string;
	studyName?: string;
	items: StructuralItem[];
	enabledFloors?: EnabledFloorOption[];
	children: ReactNode;
}

export function BOQTablesProvider({
	organizationId,
	studyId,
	studyName,
	items: allItems,
	enabledFloors,
	children,
}: BOQTablesProviderProps) {
	const t = useTranslations("pricing.studies");
	const queryClient = useQueryClient();

	const [selectedFloor, setSelectedFloor] = useState("all");
	const [selectedSection, setSelectedSectionState] = useState("all");
	const [selectedItemId, setSelectedItemId] = useState("all");
	const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
	const [selectedDiameters, setSelectedDiameters] =
		useState<Set<number> | null>(null);
	const [expandedSections, setExpandedSections] = useState<Set<string>>(
		new Set(),
	);
	const [expandedCutting, setExpandedCutting] = useState<Set<string>>(
		new Set(),
	);
	const [isSyncingMaterials, setIsSyncingMaterials] = useState(false);

	// ─── إعدادات المنظمة (للطباعة) ───
	const { data: orgSettings } = useQuery({
		...orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
		staleTime: STALE_TIMES.FINANCE_SETTINGS,
	});

	// ─── الفلاتر المتسلسلة ───
	const floorOptions = useMemo(
		() => buildFloorFilterOptions(allItems, enabledFloors),
		[allItems, enabledFloors],
	);

	const floorFilteredItems = useMemo(
		() => filterItemsByFloor(allItems, selectedFloor, enabledFloors),
		[allItems, selectedFloor, enabledFloors],
	);

	const sectionOptions = useMemo(
		() => buildSectionFilterOptions(floorFilteredItems),
		[floorFilteredItems],
	);
	const effectiveSection = sectionOptions.some(
		(o) => o.value === selectedSection,
	)
		? selectedSection
		: "all";

	const sectionFilteredItems = useMemo(
		() => filterItemsBySection(floorFilteredItems, effectiveSection),
		[floorFilteredItems, effectiveSection],
	);

	const itemOptions = useMemo(
		() => buildItemFilterOptions(sectionFilteredItems),
		[sectionFilteredItems],
	);
	const effectiveItemId = itemOptions.some((o) => o.value === selectedItemId)
		? selectedItemId
		: "all";

	const filteredItems = useMemo(
		() => filterItemsById(sectionFilteredItems, effectiveItemId),
		[sectionFilteredItems, effectiveItemId],
	);

	// ─── التحديد بالصح فوق الفلاتر ───
	const items = useMemo(() => {
		if (!selectedIds) return filteredItems;
		return filteredItems.filter((item) => selectedIds.has(item.id));
	}, [filteredItems, selectedIds]);

	const summary = useMemo(
		() => aggregateBOQ(items, enabledFloors),
		[items, enabledFloors],
	);

	const setSelectedSection = useCallback((value: string) => {
		setSelectedSectionState(value);
		setSelectedItemId("all");
	}, []);

	const handleFloorChange = useCallback((value: string) => {
		setSelectedFloor(value);
		setSelectedSectionState("all");
		setSelectedItemId("all");
	}, []);

	const resetFilters = useCallback(() => {
		setSelectedFloor("all");
		setSelectedSectionState("all");
		setSelectedItemId("all");
		setSelectedIds(null);
		setSelectedDiameters(null);
	}, []);

	const hasActiveFilters =
		selectedFloor !== "all" ||
		effectiveSection !== "all" ||
		effectiveItemId !== "all" ||
		selectedIds !== null ||
		selectedDiameters !== null;

	// ─── وصف النطاق (للتصدير والطباعة) ───
	const selectedFloorLabel = floorOptions.find(
		(o) => o.value === selectedFloor,
	)?.label;
	const selectedSectionLabel = sectionOptions.find(
		(o) => o.value === effectiveSection,
	)?.label;
	const selectedItemLabel = itemOptions.find(
		(o) => o.value === effectiveItemId,
	)?.label;

	const scopeLabel =
		[
			selectedFloor !== "all" ? selectedFloorLabel : undefined,
			effectiveSection !== "all" ? selectedSectionLabel : undefined,
			effectiveItemId !== "all" ? selectedItemLabel : undefined,
			selectedIds
				? t("boq.selectedItemsScope", { count: items.length })
				: undefined,
		]
			.filter(Boolean)
			.join(" - ") || undefined;

	// ─── تحديد البنود ───
	const isSelected = useCallback(
		(id: string) => (selectedIds ? selectedIds.has(id) : true),
		[selectedIds],
	);

	const toggleItem = useCallback(
		(id: string) => {
			setSelectedIds((prev) => {
				// أول نقرة على صح تبدأ من "الكل محدد"
				const base = prev ?? new Set(filteredItems.map((i) => i.id));
				const next = new Set(base);
				if (next.has(id)) next.delete(id);
				else next.add(id);
				return next;
			});
		},
		[filteredItems],
	);

	const setSelection = useCallback(
		(ids: string[], selected: boolean) => {
			setSelectedIds((prev) => {
				const base = prev ?? new Set(filteredItems.map((i) => i.id));
				const next = new Set(base);
				for (const id of ids) {
					if (selected) next.add(id);
					else next.delete(id);
				}
				return next;
			});
		},
		[filteredItems],
	);

	const selectAll = useCallback(() => setSelectedIds(null), []);
	const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

	const selectionCount = selectedIds ? items.length : filteredItems.length;
	const selectableCount = filteredItems.length;

	// ─── تحديد الأقطار (طلبية المصنع / التقطيع) ───
	const isDiameterSelected = useCallback(
		(d: number) => (selectedDiameters ? selectedDiameters.has(d) : true),
		[selectedDiameters],
	);

	const availableDiameters = useMemo(
		() => summary.factoryOrder.map((e) => e.diameter),
		[summary.factoryOrder],
	);

	const toggleDiameter = useCallback(
		(d: number) => {
			setSelectedDiameters((prev) => {
				const base = prev ?? new Set(availableDiameters);
				const next = new Set(base);
				if (next.has(d)) next.delete(d);
				else next.add(d);
				return next;
			});
		},
		[availableDiameters],
	);

	const resetDiameters = useCallback(() => setSelectedDiameters(null), []);

	// ─── الطي ───
	const toggleSection = useCallback((key: string) => {
		setExpandedSections((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}, []);

	const toggleCutting = useCallback((key: string) => {
		setExpandedCutting((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	}, []);

	// ─── تقرير التكلفة ───
	const { data: costSummary, isLoading: costSummaryLoading } = useQuery(
		orpc.pricing.studies.costing.getSummary.queryOptions({
			input: { organizationId, studyId },
		}),
	);
	const { data: costBreakdown, isLoading: costBreakdownLoading } = useQuery(
		orpc.pricing.studies.laborBreakdown.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);
	const { data: profitAnalysis, isLoading: profitLoading } = useQuery(
		orpc.pricing.studies.markup.getProfitAnalysis.queryOptions({
			input: { organizationId, studyId },
		}),
	);
	const { data: structuralSpecs } = useQuery(
		orpc.pricing.studies.structuralSpecs.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);
	const hasIsolatedSteel = !!(structuralSpecs as any)?.hasIsolatedSteel;

	const costReportLoading =
		costSummaryLoading || costBreakdownLoading || profitLoading;

	// التقرير المالي شامل للمشروع ولا يتأثر بفلاتر العرض
	const costReport = useMemo(() => {
		if (!costSummary) return null;
		return buildCostReport({
			items: allItems,
			enabledFloors,
			laborBreakdown: costBreakdown,
			summary: costSummary,
			profit: profitAnalysis,
			hasIsolatedSteel,
		});
	}, [
		allItems,
		enabledFloors,
		costBreakdown,
		costSummary,
		profitAnalysis,
		hasIsolatedSteel,
	]);

	const generateCostingItems = useMutation(
		orpc.pricing.studies.costing.generate.mutationOptions({}),
	);
	const bulkUpdateCosting = useMutation(
		orpc.pricing.studies.costing.bulkUpdate.mutationOptions({}),
	);

	const syncMaterials = useCallback(async () => {
		setIsSyncingMaterials(true);
		try {
			await (generateCostingItems as any).mutateAsync({
				organizationId,
				studyId,
			});

			const costingItems = await queryClient.fetchQuery(
				orpc.pricing.studies.costing.getItems.queryOptions({
					input: { organizationId, studyId, section: "STRUCTURAL" },
				}),
			);

			const updates = buildMaterialCostUpdates(
				allItems,
				(costingItems as any[]) ?? [],
				readMaterialPrices(costBreakdown, hasIsolatedSteel),
				enabledFloors,
			);
			if (updates.length > 0) {
				await (bulkUpdateCosting as any).mutateAsync({
					organizationId,
					studyId,
					items: updates,
				});
			}

			await queryClient.invalidateQueries({
				queryKey: orpc.pricing.studies.costing.key(),
			});
			toast.success(t("boq.materialSyncDone"));
		} catch (error: any) {
			toast.error(error?.message || t("boq.materialSyncFailed"));
		} finally {
			setIsSyncingMaterials(false);
		}
	}, [
		allItems,
		bulkUpdateCosting,
		costBreakdown,
		enabledFloors,
		generateCostingItems,
		hasIsolatedSteel,
		organizationId,
		queryClient,
		studyId,
		t,
	]);

	// ─── التصدير والطباعة ───
	const orgAny = orgSettings as any;
	const exportLabel = scopeLabel
		? `${studyName || ""} - ${scopeLabel}`.trim()
		: studyName;

	const visibleFactoryOrder = useMemo(
		() =>
			summary.factoryOrder.filter((e) => isDiameterSelected(e.diameter)),
		[summary.factoryOrder, isDiameterSelected],
	);
	const visibleCuttingDetails = useMemo(
		() =>
			summary.allCuttingDetails.filter((d) =>
				isDiameterSelected(d.diameter),
			),
		[summary.allCuttingDetails, isDiameterSelected],
	);

	const exportActive = useCallback(
		(tab: BOQTableTab) => {
			if (tab === "cost") {
				if (costReport) exportCostReport(costReport, studyName);
				return;
			}
			if (tab === "factory") {
				exportFactoryOrder(
					visibleFactoryOrder,
					exportLabel,
					summary.unscheduledSteelWeight,
				);
				return;
			}
			if (tab === "cutting") {
				exportCuttingDetails(visibleCuttingDetails, exportLabel);
				return;
			}
			exportBOQToExcel(summary, exportLabel);
		},
		[
			costReport,
			exportLabel,
			studyName,
			summary,
			visibleCuttingDetails,
			visibleFactoryOrder,
		],
	);

	const printActive = useCallback(
		(tab: BOQTableTab) => {
			const org = {
				organizationName: orgAny?.companyNameAr ?? undefined,
				organizationLogo: resolveImageSrc(orgAny?.logo),
				organizationAddress: orgAny?.address ?? undefined,
				organizationPhone: orgAny?.phone ?? undefined,
				organizationEmail: orgAny?.email ?? undefined,
			};
			if (tab === "cost") {
				if (!costReport) return;
				printCostReport({ report: costReport, studyName, ...org });
				return;
			}
			printBOQ({
				activeTab: tab,
				summary: {
					...summary,
					factoryOrder: visibleFactoryOrder,
					allCuttingDetails: visibleCuttingDetails,
				},
				studyName,
				floorLabel: scopeLabel,
				...org,
				t,
			});
		},
		[
			costReport,
			orgAny,
			scopeLabel,
			studyName,
			summary,
			t,
			visibleCuttingDetails,
			visibleFactoryOrder,
		],
	);

	const value: BOQTablesValue = {
		allItems,
		items,
		summary,
		enabledFloors,
		studyName,
		unscheduledSteelWeight: summary.unscheduledSteelWeight,

		floorOptions,
		sectionOptions,
		itemOptions,
		selectedFloor,
		setSelectedFloor: handleFloorChange,
		selectedSection: effectiveSection,
		setSelectedSection,
		selectedItemId: effectiveItemId,
		setSelectedItemId,
		scopeLabel,
		resetFilters,
		hasActiveFilters,

		selectedIds,
		isSelected,
		toggleItem,
		setSelection,
		selectAll,
		clearSelection,
		selectionCount,
		selectableCount,

		selectedDiameters,
		toggleDiameter,
		resetDiameters,
		isDiameterSelected,

		expandedSections,
		toggleSection,
		expandedCutting,
		toggleCutting,

		costReport,
		costReportLoading,
		syncMaterials,
		isSyncingMaterials,

		exportActive,
		printActive,
	};

	return (
		<BOQTablesContext.Provider value={value}>
			{children}
		</BOQTablesContext.Provider>
	);
}
