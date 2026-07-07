"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib";
import {
	ChevronDown,
	ChevronLeft,
	Loader2,
	Plus,
	Save,
	Trash2,
	Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatNum } from "@saas/pricing/lib/utils";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface LaborOverviewTabProps {
	organizationId: string;
	studyId: string;
	buildingArea: number;
}

type LaborMode = "per_sqm" | "per_cbm_ton" | "lump_sum" | "salary";

interface FloorRow { id: string; label: string; area: string; pricePerSqm: string; isAuto?: boolean; floorKey?: string; }
interface ExtraRow { id: string; label: string; quantity: string; unit: string; pricePerUnit: string; }
interface CbmTonRow { id: string; label: string; quantity: string; unit: string; pricePerUnit: string; }
interface SalaryWorker { id: string; craft: string; count: string; salary: string; months: string; }

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const LABOR_MODES: { value: LaborMode; labelKey: string }[] = [
	{ value: "per_sqm", labelKey: "labor.modes.perSqm" },
	{ value: "per_cbm_ton", labelKey: "labor.modes.perCbmTon" },
	{ value: "lump_sum", labelKey: "labor.modes.lumpSum" },
	{ value: "salary", labelKey: "labor.modes.salary" },
];

const SECTION_LABEL_KEYS: Record<string, string> = {
	STRUCTURAL: "labor.sections.structural",
	FINISHING: "labor.sections.finishing",
	MEP: "labor.sections.mep",
	LABOR: "labor.sections.labor",
	MANUAL: "labor.sections.manual",
};

let idCounter = 0;
function nextId(prefix: string) {
	return `${prefix}_${++idCounter}_${Date.now()}`;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function LaborOverviewTab({
	organizationId,
	studyId,
	buildingArea,
}: LaborOverviewTabProps) {
	const t = useTranslations("pricing.costingV2");
	const queryClient = useQueryClient();

	// ─── Labor input state ───
	const [laborMode, setLaborMode] = useState<LaborMode>("per_sqm");
	const [floorRows, setFloorRows] = useState<FloorRow[]>([]);
	const [extraRows, setExtraRows] = useState<ExtraRow[]>(() => [
		{ id: "fence", label: t("labor.defaults.fence"), quantity: "", unit: "م.ط", pricePerUnit: "" },
		{ id: "parapet", label: t("labor.defaults.parapet"), quantity: "", unit: "م.ط", pricePerUnit: "" },
		{ id: "decorations", label: t("labor.defaults.decorations"), quantity: "", unit: "م.ط", pricePerUnit: "" },
	]);
	const [cbmRows, setCbmRows] = useState<CbmTonRow[]>(() => [
		{ id: "concrete", label: t("labor.defaults.concretePouring"), quantity: "", unit: "م³", pricePerUnit: "" },
		{ id: "steel", label: t("labor.defaults.steelWork"), quantity: "", unit: "طن", pricePerUnit: "" },
		{ id: "carpentry", label: t("labor.defaults.carpentry"), quantity: "", unit: "م²", pricePerUnit: "" },
	]);
	const [lumpSumAmount, setLumpSumAmount] = useState("");
	const [salaryWorkers, setSalaryWorkers] = useState<SalaryWorker[]>([]);
	const [salaryInsurance, setSalaryInsurance] = useState("");
	const [salaryHousing, setSalaryHousing] = useState("");
	const [initialized, setInitialized] = useState(false);

	// ─── Read-only section state ───
	const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
		STRUCTURAL: true,
		FINISHING: true,
		MEP: true,
	});

	// ─── Queries ───
	const { data: savedBreakdown, isLoading: breakdownLoading } = useQuery(
		orpc.pricing.studies.laborBreakdown.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const { data: structuralItems } = useQuery(
		orpc.pricing.studies.getStructuralItems.queryOptions({
			input: { organizationId, costStudyId: studyId },
		}),
	);

	const { data: costingItems, isLoading: costingLoading } = useQuery(
		orpc.pricing.studies.costing.getItems.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// ─── Mutations ───
	const setBreakdownMutation = useMutation(
		orpc.pricing.studies.laborBreakdown.set.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "laborBreakdown"]],
				});
			},
			onError: (e: any) => toast.error(e.message || t("common.saveError")),
		}),
	);

	const setSectionLaborMutation = useMutation(
		orpc.pricing.studies.costing.setSectionLabor.mutationOptions({
			onSuccess: () => {
				toast.success(t("labor.laborSaved"));
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "costing"]],
				});
			},
			onError: (e: any) => toast.error(e.message || t("common.saveError")),
		}),
	);

	// ─── Auto-aggregate from structural items ───
	const autoAggregates = useMemo(() => {
		let concrete = 0;
		let steel = 0;
		for (const item of ((structuralItems as any) ?? [])) {
			concrete += Number(item.concreteVolume ?? 0);
			steel += Number(item.steelWeight ?? 0);
		}
		return { concrete, steel: steel / 1000 };
	}, [structuralItems]);

	// ─── Auto floor rows from slabs ───
	const slabFloorRows = useMemo(() => {
		const items = (structuralItems as any[]) ?? [];
		const slabs = items.filter((item) => item.category === "slabs");
		if (slabs.length === 0) return [];

		const floorMap = new Map<string, number>();
		for (const slab of slabs) {
			const dims = slab.dimensions as any;
			const floor = dims?.floor ?? "أرضي";
			const length = Number(dims?.length ?? 0);
			const width = Number(dims?.width ?? 0);
			const qty = Number(slab.quantity ?? 1);
			const area = length * width * qty;
			floorMap.set(floor, (floorMap.get(floor) ?? 0) + area);
		}

		const rows: FloorRow[] = [];
		for (const [floor, totalArea] of floorMap) {
			const label = floor === "ميزانين" ? t("labor.mezzanineRoofLabel") : t("labor.floorRoofLabel", { floor });
			rows.push({
				id: `slab_${floor}`,
				label,
				area: totalArea > 0 ? String(totalArea) : "",
				pricePerSqm: "",
				isAuto: true,
				floorKey: floor,
			});
		}
		return rows;
	}, [structuralItems, t]);

	// ─── Initialize from saved data ───
	useEffect(() => {
		if (initialized || breakdownLoading) return;

		const bd = savedBreakdown as any;
		if (bd && bd.laborMode) {
			setLaborMode(bd.laborMode);

			// Merge auto slab rows with saved floor rows
			{
				const savedRows: FloorRow[] = bd.floorRows ?? [];
				const savedPriceMap = new Map<string, string>();
				const manualRows: FloorRow[] = [];
				for (const r of savedRows) {
					if (r.floorKey) {
						savedPriceMap.set(r.floorKey, r.pricePerSqm ?? "");
					} else if (!r.isAuto) {
						manualRows.push(r);
					}
				}
				const merged: FloorRow[] = slabFloorRows.map((row) => ({
					...row,
					pricePerSqm: savedPriceMap.get(row.floorKey!) ?? row.pricePerSqm,
				}));
				setFloorRows([...merged, ...manualRows]);
			}
			if (bd.extraRows?.length) setExtraRows(bd.extraRows);
			if (bd.cbmRows?.length) setCbmRows(bd.cbmRows);
			if (bd.lumpSumAmount != null) setLumpSumAmount(String(bd.lumpSumAmount));
			if (bd.salaryWorkers?.length) setSalaryWorkers(bd.salaryWorkers);
			if (bd.salaryInsurance != null) setSalaryInsurance(String(bd.salaryInsurance));
			if (bd.salaryHousing != null) setSalaryHousing(String(bd.salaryHousing));
		}

		// If no saved data but we have slab rows, use them
		if (!bd?.floorRows?.length && slabFloorRows.length > 0) {
			setFloorRows(slabFloorRows);
		}

		// Auto-populate CBM quantities from structural aggregates if empty
		if (!bd?.cbmRows?.length && autoAggregates.concrete > 0) {
			setCbmRows((prev) =>
				prev.map((row) => {
					if (row.id === "concrete" && !row.quantity) {
						return { ...row, quantity: String(autoAggregates.concrete) };
					}
					if (row.id === "steel" && !row.quantity) {
						return { ...row, quantity: String(autoAggregates.steel) };
					}
					if (row.id === "carpentry" && !row.quantity && buildingArea > 0) {
						return { ...row, quantity: String(buildingArea) };
					}
					return row;
				}),
			);
		}

		setInitialized(true);
	}, [breakdownLoading, savedBreakdown, autoAggregates, buildingArea, initialized, slabFloorRows]);

	// ─── Sync auto floor rows when slabs change (after initialization) ───
	useEffect(() => {
		if (!initialized) return;
		setFloorRows((prev) => {
			const manualRows = prev.filter((r) => !r.isAuto);
			const priceMap = new Map<string, string>();
			for (const r of prev) {
				if (r.isAuto && r.floorKey) {
					priceMap.set(r.floorKey, r.pricePerSqm);
				}
			}
			const updated = slabFloorRows.map((row) => ({
				...row,
				pricePerSqm: priceMap.get(row.floorKey!) ?? row.pricePerSqm,
			}));
			return [...updated, ...manualRows];
		});
	}, [slabFloorRows, initialized]);

	// ─── Row update helpers ───
	const updateFloorRow = (id: string, field: keyof FloorRow, value: string) => {
		setFloorRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
	};
	const updateExtraRow = (id: string, field: keyof ExtraRow, value: string) => {
		setExtraRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
	};
	const updateCbmRow = (id: string, field: keyof CbmTonRow, value: string) => {
		setCbmRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
	};
	const updateWorker = (id: string, field: keyof SalaryWorker, value: string) => {
		setSalaryWorkers((prev) => prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
	};

	const addFloorRow = () => {
		setFloorRows((prev) => [
			...prev,
			{ id: nextId("floor"), label: t("labor.extraFloorLabel", { number: prev.length - 1 }), area: "", pricePerSqm: "" },
		]);
	};

	const removeFloorRow = (id: string) => {
		setFloorRows((prev) => prev.filter((r) => r.id !== id));
	};

	const addWorker = () => {
		setSalaryWorkers((prev) => [
			...prev,
			{ id: nextId("worker"), craft: "", count: "1", salary: "", months: "" },
		]);
	};

	const removeWorker = (id: string) => {
		setSalaryWorkers((prev) => prev.filter((w) => w.id !== id));
	};

	// ─── Computed totals ───
	const perSqmTotal = useMemo(() => {
		let total = 0;
		for (const row of floorRows) {
			total += (Number(row.area) || 0) * (Number(row.pricePerSqm) || 0);
		}
		for (const row of extraRows) {
			total += (Number(row.quantity) || 0) * (Number(row.pricePerUnit) || 0);
		}
		return total;
	}, [floorRows, extraRows]);

	const perCbmTonTotal = useMemo(() => {
		let total = 0;
		for (const row of cbmRows) {
			total += (Number(row.quantity) || 0) * (Number(row.pricePerUnit) || 0);
		}
		return total;
	}, [cbmRows]);

	const lumpSumTotal = Number(lumpSumAmount) || 0;

	const salaryTotals = useMemo(() => {
		let workersTotal = 0;
		for (const w of salaryWorkers) {
			workersTotal += (Number(w.count) || 0) * (Number(w.salary) || 0) * (Number(w.months) || 0);
		}
		const insurance = Number(salaryInsurance) || 0;
		const housing = Number(salaryHousing) || 0;
		return { workersTotal, insurance, housing, grandTotal: workersTotal + insurance + housing };
	}, [salaryWorkers, salaryInsurance, salaryHousing]);

	const activeTotal =
		laborMode === "per_sqm" ? perSqmTotal :
		laborMode === "per_cbm_ton" ? perCbmTonTotal :
		laborMode === "lump_sum" ? lumpSumTotal :
		salaryTotals.grandTotal;

	const activeMode = LABOR_MODES.find((m) => m.value === laborMode);

	// ─── Read-only: existing section labor data ───
	const grouped = useMemo(() => {
		return ((costingItems as any) ?? []).reduce(
			(acc: any, item: any) => {
				const section = item.section;
				if (!acc[section]) acc[section] = [];
				acc[section].push(item);
				return acc;
			},
			{} as Record<string, any[]>,
		);
	}, [costingItems]);

	const { sectionTotals, grandLaborTotal } = useMemo(() => {
		const totals: Array<{
			section: string;
			label: string;
			laborTotal: number;
			items: Array<{
				description: string;
				laborTotal: number;
				laborType: string | null;
				unit: string;
				laborUnitCost: number;
				quantity: number;
			}>;
		}> = [];

		let grand = 0;
		for (const [section, items] of Object.entries(grouped)) {
			// Skip STRUCTURAL section — labor is handled by this interactive tab
			if (section === "STRUCTURAL") continue;

			let sectionLaborTotal = 0;
			const laborItems: typeof totals[0]["items"] = [];

			for (const item of ((items as any) ?? [])) {
				const laborTotal = Number(item.laborTotal ?? 0);
				if (laborTotal > 0) {
					sectionLaborTotal += laborTotal;
					laborItems.push({
						description: item.description,
						laborTotal,
						laborType: item.laborType,
						unit: item.unit,
						laborUnitCost: Number(item.laborUnitCost ?? 0),
						quantity: Number(item.quantity ?? 0),
					});
				}
			}

			if (laborItems.length > 0) {
				totals.push({
					section,
					label: SECTION_LABEL_KEYS[section]
						? t(SECTION_LABEL_KEYS[section] as Parameters<typeof t>[0])
						: section,
					laborTotal: sectionLaborTotal,
					items: laborItems,
				});
				grand += sectionLaborTotal;
			}
		}

		return { sectionTotals: totals, grandLaborTotal: grand };
	}, [grouped, t]);

	const toggleSection = (section: string) => {
		setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
	};

	const laborTypeLabel = (type: string | null) => {
		switch (type) {
			case "PER_SQM": return "م²";
			case "PER_CBM": return "م³";
			case "PER_UNIT": return t("labor.typePerUnit");
			case "PER_LM": return "م.ط";
			case "LUMP_SUM": return t("common.lumpSum");
			case "SALARY": return t("labor.typeSalary");
			default: return "—";
		}
	};

	// ─── Save handler ───
	const handleSave = () => {
		if (activeTotal <= 0) {
			toast.error(t("labor.enterLaborData"));
			return;
		}

		// Save full breakdown to JSON
		(setBreakdownMutation as any).mutate({
			organizationId,
			studyId,
			breakdown: {
				...(savedBreakdown as any ?? {}),
				laborMode,
				floorRows,
				extraRows,
				cbmRows,
				lumpSumAmount: lumpSumTotal,
				salaryWorkers,
				salaryInsurance: Number(salaryInsurance) || 0,
				salaryHousing: Number(salaryHousing) || 0,
			},
		});

		// Save computed total to CostingItems
		const laborTypeMap: Record<LaborMode, string> = {
			per_sqm: "PER_SQM",
			per_cbm_ton: "PER_CBM",
			lump_sum: "LUMP_SUM",
			salary: "SALARY",
		};

		(setSectionLaborMutation as any).mutate({
			organizationId,
			studyId,
			section: "STRUCTURAL",
			laborType: laborTypeMap[laborMode],
			laborUnitCost: activeTotal,
		});
	};

	const isSaving = setBreakdownMutation.isPending || setSectionLaborMutation.isPending;
	const isLoading = breakdownLoading || costingLoading;

	// ═══════════════════════════════════════════════════════════════
	// RENDER
	// ═══════════════════════════════════════════════════════════════

	if (isLoading) {
		return (
			<div className="flex justify-center py-12">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-4" dir="rtl">
			{/* ─── Labor mode selector ─── */}
			<div className="rounded-xl border border-border bg-card p-4">
				<Label className="text-sm font-medium mb-3 block">
					{t("labor.calcMethodLabel")}
				</Label>
				<div className="flex gap-2 flex-wrap">
					{LABOR_MODES.map((mode) => (
						<button
							key={mode.value}
							type="button"
							onClick={() => setLaborMode(mode.value)}
							className={cn(
								"px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all",
								laborMode === mode.value
									? "border-primary bg-primary/5 text-primary"
									: "border-border hover:border-muted-foreground/30",
							)}
						>
							{t(mode.labelKey as Parameters<typeof t>[0])}
						</button>
					))}
				</div>
			</div>

			{/* ─── Per-SQM mode ─── */}
			{laborMode === "per_sqm" && (
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
						<h4 className="font-medium">{t("labor.perSqmTitle")}</h4>
						<Button
							variant="ghost"
							size="sm"
							className="gap-1 text-xs"
							onClick={addFloorRow}
						>
							<Plus className="h-3.5 w-3.5" />
							{t("labor.addFloor")}
						</Button>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/20 text-muted-foreground">
									<th className="px-3 py-2.5 text-right font-medium">{t("common.item")}</th>
									<th className="px-3 py-2.5 text-center font-medium">{t("labor.areaQuantity")}</th>
									<th className="px-3 py-2.5 text-center font-medium">{t("common.price")}</th>
									<th className="px-3 py-2.5 text-center font-medium">{t("common.total")}</th>
									<th className="px-3 py-2.5 w-10" />
								</tr>
							</thead>
							<tbody>
								{/* Floor rows */}
								{floorRows.length === 0 && (
									<tr>
										<td colSpan={5} className="px-3 py-6 text-center text-muted-foreground text-sm">
											{t("labor.noSlabs")}
										</td>
									</tr>
								)}
								{floorRows.map((row) => {
									const rowTotal = (Number(row.area) || 0) * (Number(row.pricePerSqm) || 0);
									return (
										<tr key={row.id} className="border-b hover:bg-muted/20">
											<td className="px-3 py-2">
												{row.isAuto ? (
													<span className="text-sm font-medium">{row.label}</span>
												) : (
													<Input
														className="h-8 w-32 rounded-lg text-sm"
														value={row.label}
														onChange={(e: any) => updateFloorRow(row.id, "label", e.target.value)}
													/>
												)}
											</td>
											<td className="px-3 py-2">
												{row.isAuto ? (
													<div className="flex items-center justify-center gap-1.5">
														<Input
															type="number"
															className="h-8 w-24 text-center rounded-lg bg-muted/50"
															dir="ltr"
															value={row.area}
															readOnly
														/>
														<span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{t("labor.autoBadge")}</span>
													</div>
												) : (
													<Input
														type="number"
														className="h-8 w-24 mx-auto text-center rounded-lg"
														dir="ltr"
														placeholder="م²"
														value={row.area}
														onChange={(e: any) => updateFloorRow(row.id, "area", e.target.value)}
													/>
												)}
											</td>
											<td className="px-3 py-2">
												<Input
													type="number"
													className="h-8 w-24 mx-auto text-center rounded-lg"
													dir="ltr"
													placeholder={t("common.sarPerSqm")}
													value={row.pricePerSqm}
													onChange={(e: any) => updateFloorRow(row.id, "pricePerSqm", e.target.value)}
												/>
											</td>
											<td className="px-3 py-2 text-center font-medium" dir="ltr">
												{rowTotal > 0 ? formatNum(rowTotal) : "—"}
											</td>
											<td className="px-3 py-2">
												{!row.isAuto && (
													<button
														type="button"
														onClick={() => removeFloorRow(row.id)}
														className="text-muted-foreground hover:text-destructive transition-colors"
													>
														<Trash2 className="h-3.5 w-3.5" />
													</button>
												)}
											</td>
										</tr>
									);
								})}

								{/* Separator */}
								{extraRows.length > 0 && (
									<tr>
										<td colSpan={5} className="px-3 py-1">
											<div className="border-t border-dashed border-border" />
										</td>
									</tr>
								)}

								{/* Extra rows (fence, parapet, etc.) */}
								{extraRows.map((row) => {
									const rowTotal = (Number(row.quantity) || 0) * (Number(row.pricePerUnit) || 0);
									return (
										<tr key={row.id} className="border-b last:border-0 hover:bg-muted/20">
											<td className="px-3 py-2">
												<Input
													className="h-8 w-32 rounded-lg text-sm"
													value={row.label}
													onChange={(e: any) => updateExtraRow(row.id, "label", e.target.value)}
												/>
											</td>
											<td className="px-3 py-2">
												<div className="flex items-center justify-center gap-1">
													<Input
														type="number"
														className="h-8 w-20 text-center rounded-lg"
														dir="ltr"
														placeholder="0"
														value={row.quantity}
														onChange={(e: any) => updateExtraRow(row.id, "quantity", e.target.value)}
													/>
													<span className="text-xs text-muted-foreground">{row.unit}</span>
												</div>
											</td>
											<td className="px-3 py-2">
												<Input
													type="number"
													className="h-8 w-24 mx-auto text-center rounded-lg"
													dir="ltr"
													placeholder={t("common.sar")}
													value={row.pricePerUnit}
													onChange={(e: any) => updateExtraRow(row.id, "pricePerUnit", e.target.value)}
												/>
											</td>
											<td className="px-3 py-2 text-center font-medium" dir="ltr">
												{rowTotal > 0 ? formatNum(rowTotal) : "—"}
											</td>
											<td className="px-3 py-2" />
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					<div className="border-t border-border bg-muted/10 px-4 py-3">
						<div className="flex items-center justify-between text-sm font-medium">
							<span>{t("common.total")}</span>
							<span className="font-bold text-primary" dir="ltr">
								{perSqmTotal > 0 ? `${formatNum(perSqmTotal)} ${t("common.sar")}` : "—"}
							</span>
						</div>
					</div>
				</div>
			)}

			{/* ─── Per-CBM+Ton mode ─── */}
			{laborMode === "per_cbm_ton" && (
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<div className="px-4 py-3 bg-muted/30 border-b border-border">
						<h4 className="font-medium">{t("labor.perCbmTitle")}</h4>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/20 text-muted-foreground">
									<th className="px-3 py-2.5 text-right font-medium">{t("common.item")}</th>
									<th className="px-3 py-2.5 text-center font-medium">{t("common.quantity")}</th>
									<th className="px-3 py-2.5 text-center font-medium">{t("common.unit")}</th>
									<th className="px-3 py-2.5 text-center font-medium">{t("common.price")}</th>
									<th className="px-3 py-2.5 text-center font-medium">{t("common.total")}</th>
								</tr>
							</thead>
							<tbody>
								{cbmRows.map((row) => {
									const rowTotal = (Number(row.quantity) || 0) * (Number(row.pricePerUnit) || 0);
									return (
										<tr key={row.id} className="border-b last:border-0 hover:bg-muted/20">
											<td className="px-3 py-2 font-medium">{row.label}</td>
											<td className="px-3 py-2">
												<Input
													type="number"
													className="h-8 w-24 mx-auto text-center rounded-lg"
													dir="ltr"
													placeholder="0"
													value={row.quantity}
													onChange={(e: any) => updateCbmRow(row.id, "quantity", e.target.value)}
												/>
											</td>
											<td className="px-3 py-2 text-center text-muted-foreground">{row.unit}</td>
											<td className="px-3 py-2">
												<Input
													type="number"
													className="h-8 w-24 mx-auto text-center rounded-lg"
													dir="ltr"
													placeholder={t("common.sar")}
													value={row.pricePerUnit}
													onChange={(e: any) => updateCbmRow(row.id, "pricePerUnit", e.target.value)}
												/>
											</td>
											<td className="px-3 py-2 text-center font-medium" dir="ltr">
												{rowTotal > 0 ? formatNum(rowTotal) : "—"}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					<div className="border-t border-border bg-muted/10 px-4 py-3">
						<div className="flex items-center justify-between text-sm font-medium">
							<span>{t("common.total")}</span>
							<span className="font-bold text-primary" dir="ltr">
								{perCbmTonTotal > 0 ? `${formatNum(perCbmTonTotal)} ${t("common.sar")}` : "—"}
							</span>
						</div>
					</div>
				</div>
			)}

			{/* ─── Lump sum mode ─── */}
			{laborMode === "lump_sum" && (
				<div className="rounded-xl border border-border bg-card p-4 space-y-3">
					<h4 className="font-medium">{t("labor.lumpSumTitle")}</h4>
					<div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
						<Label className="text-sm font-medium mb-2 block">
							{t("labor.lumpSumAmountLabel")}
						</Label>
						<div className="flex items-center gap-3">
							<Input
								type="number"
								className="h-10 w-48 rounded-lg"
								dir="ltr"
								placeholder="0"
								value={lumpSumAmount}
								onChange={(e: any) => setLumpSumAmount(e.target.value)}
							/>
							<span className="text-sm text-muted-foreground">{t("common.riyal")}</span>
						</div>
						{lumpSumTotal > 0 && (
							<div className="mt-3 text-sm">
								<span className="text-muted-foreground">{t("common.total")}: </span>
								<span className="font-bold text-primary" dir="ltr">
									{formatNum(lumpSumTotal)} {t("common.sar")}
								</span>
								{buildingArea > 0 && (
									<span className="text-muted-foreground ml-3" dir="ltr">
										({formatNum(lumpSumTotal / buildingArea)} {t("common.sarPerSqm")})
									</span>
								)}
							</div>
						)}
					</div>
				</div>
			)}

			{/* ─── Salary mode ─── */}
			{laborMode === "salary" && (
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
						<h4 className="font-medium">{t("labor.salaryTitle")}</h4>
						<Button
							variant="ghost"
							size="sm"
							onClick={addWorker}
							className="gap-1 text-xs"
						>
							<Plus className="h-3.5 w-3.5" />
							{t("labor.addWorker")}
						</Button>
					</div>

					{salaryWorkers.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-muted-foreground text-sm mb-3">
								{t("labor.noWorkers")}
							</p>
							<Button
								variant="outline"
								onClick={addWorker}
								className="gap-1.5 rounded-lg"
							>
								<Plus className="h-4 w-4" />
								{t("labor.addWorker")}
							</Button>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-muted/20 text-muted-foreground">
											<th className="px-3 py-2.5 text-right font-medium">{t("labor.craft")}</th>
											<th className="px-3 py-2.5 text-center font-medium">{t("labor.count")}</th>
											<th className="px-3 py-2.5 text-center font-medium">{t("labor.salary")}</th>
											<th className="px-3 py-2.5 text-center font-medium">{t("labor.months")}</th>
											<th className="px-3 py-2.5 text-center font-medium">{t("labor.rowTotal")}</th>
											<th className="px-3 py-2.5 w-10" />
										</tr>
									</thead>
									<tbody>
										{salaryWorkers.map((w) => {
											const count = Number(w.count) || 0;
											const salary = Number(w.salary) || 0;
											const months = Number(w.months) || 0;
											const rowTotal = count * salary * months;

											return (
												<tr key={w.id} className="border-b last:border-0 hover:bg-muted/20">
													<td className="px-3 py-2">
														<Input
															className="h-8 w-32 rounded-lg text-sm"
															placeholder={t("labor.craftPlaceholder")}
															value={w.craft}
															onChange={(e: any) => updateWorker(w.id, "craft", e.target.value)}
														/>
													</td>
													<td className="px-3 py-2">
														<Input
															type="number"
															className="h-8 w-16 mx-auto text-center rounded-lg"
															dir="ltr"
															placeholder="1"
															value={w.count}
															onChange={(e: any) => updateWorker(w.id, "count", e.target.value)}
														/>
													</td>
													<td className="px-3 py-2">
														<Input
															type="number"
															className="h-8 w-24 mx-auto text-center rounded-lg"
															dir="ltr"
															placeholder="0"
															value={w.salary}
															onChange={(e: any) => updateWorker(w.id, "salary", e.target.value)}
														/>
													</td>
													<td className="px-3 py-2">
														<Input
															type="number"
															className="h-8 w-16 mx-auto text-center rounded-lg"
															dir="ltr"
															placeholder="0"
															value={w.months}
															onChange={(e: any) => updateWorker(w.id, "months", e.target.value)}
														/>
													</td>
													<td className="px-3 py-2 text-center font-medium" dir="ltr">
														{rowTotal > 0 ? formatNum(rowTotal) : "—"}
													</td>
													<td className="px-3 py-2">
														<button
															type="button"
															onClick={() => removeWorker(w.id)}
															className="text-muted-foreground hover:text-destructive transition-colors"
														>
															<Trash2 className="h-3.5 w-3.5" />
														</button>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>

							<div className="border-t border-border bg-muted/10 px-4 py-3 space-y-2">
								<div className="flex items-center gap-4 text-sm">
									<span className="text-muted-foreground w-28">{t("labor.salariesTotal")}</span>
									<span className="font-medium" dir="ltr">
										{salaryTotals.workersTotal > 0 ? `${formatNum(salaryTotals.workersTotal)} ${t("common.sar")}` : "—"}
									</span>
								</div>
								<div className="flex items-center gap-4 text-sm">
									<span className="text-muted-foreground w-28">{t("labor.insurance")}</span>
									<div className="flex items-center gap-2">
										<Input
											type="number"
											className="h-8 w-28 text-center rounded-lg"
											dir="ltr"
											placeholder="0"
											value={salaryInsurance}
											onChange={(e: any) => setSalaryInsurance(e.target.value)}
										/>
										<span className="text-xs text-muted-foreground">{t("common.sar")}</span>
									</div>
								</div>
								<div className="flex items-center gap-4 text-sm">
									<span className="text-muted-foreground w-28">{t("labor.housing")}</span>
									<div className="flex items-center gap-2">
										<Input
											type="number"
											className="h-8 w-28 text-center rounded-lg"
											dir="ltr"
											placeholder="0"
											value={salaryHousing}
											onChange={(e: any) => setSalaryHousing(e.target.value)}
										/>
										<span className="text-xs text-muted-foreground">{t("common.sar")}</span>
									</div>
								</div>
								<div className="flex items-center gap-4 text-sm border-t border-border pt-2">
									<span className="font-medium w-28">{t("labor.grandTotalEquals")}</span>
									<span className="font-bold text-primary" dir="ltr">
										{salaryTotals.grandTotal > 0 ? `${formatNum(salaryTotals.grandTotal)} ${t("common.sar")}` : "—"}
									</span>
								</div>
							</div>
						</>
					)}
				</div>
			)}

			{/* ─── Interactive labor total + save ─── */}
			<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
				<div className="flex items-center justify-between">
					<span className="font-semibold">
						{t("labor.structuralLaborTotal")}
						<span className="text-xs font-normal text-muted-foreground ml-2">
							({activeMode ? t(activeMode.labelKey as Parameters<typeof t>[0]) : ""})
						</span>
					</span>
					<span className="text-lg font-bold text-primary" dir="ltr">
						{activeTotal > 0 ? `${formatNum(activeTotal)} ${t("common.sar")}` : "—"}
					</span>
				</div>
				{buildingArea > 0 && activeTotal > 0 && (
					<div className="flex items-center justify-between mt-1">
						<span className="text-sm text-muted-foreground">{t("labor.costPerSqm")}</span>
						<span className="text-sm font-medium" dir="ltr">
							{formatNum(activeTotal / buildingArea)} {t("common.sarPerSqm")}
						</span>
					</div>
				)}
			</div>

			<div className="flex justify-end">
				<Button
					onClick={handleSave}
					disabled={isSaving}
					className="gap-2 rounded-xl"
				>
					{isSaving ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Save className="h-4 w-4" />
					)}
					{t("labor.saveLabor")}
				</Button>
			</div>

			{/* ═══════════════════════════════════════════════════════════ */}
			{/* Read-only: existing section labor from Finishing/MEP       */}
			{/* ═══════════════════════════════════════════════════════════ */}

			{sectionTotals.length > 0 && (
				<div className="space-y-3 pt-4 border-t border-border">
					<h4 className="text-sm font-medium text-muted-foreground">
						{t("labor.otherSectionsTitle")}
					</h4>

					{sectionTotals.map(({ section, label, laborTotal, items }) => {
						const isExpanded = expandedSections[section] !== false;

						return (
							<div key={section} className="rounded-xl border border-border bg-card overflow-hidden">
								<button
									type="button"
									onClick={() => toggleSection(section)}
									className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors"
								>
									<div className="flex items-center gap-2">
										{isExpanded ? (
											<ChevronDown className="h-4 w-4 text-muted-foreground" />
										) : (
											<ChevronLeft className="h-4 w-4 text-muted-foreground" />
										)}
										<span className="font-medium">{label}</span>
										<span className="text-xs text-muted-foreground">
											({t("common.itemsCount", { count: items.length })})
										</span>
									</div>
									<span className="font-medium" dir="ltr">
										{formatNum(laborTotal)} {t("common.sar")}
									</span>
								</button>

								{isExpanded && (
									<div className="border-t border-border overflow-x-auto">
										<table className="w-full text-sm">
											<thead>
												<tr className="border-b bg-muted/20 text-muted-foreground">
													<th className="px-3 py-2 text-right font-medium">{t("common.item")}</th>
													<th className="px-3 py-2 text-center font-medium">{t("labor.method")}</th>
													<th className="px-3 py-2 text-center font-medium">{t("common.price")}</th>
													<th className="px-3 py-2 text-center font-medium">{t("common.quantity")}</th>
													<th className="px-3 py-2 text-center font-medium">{t("common.total")}</th>
												</tr>
											</thead>
											<tbody>
												{items.map((item, idx) => (
													<tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
														<td className="px-3 py-2">{item.description}</td>
														<td className="px-3 py-2 text-center text-xs text-muted-foreground">
															{laborTypeLabel(item.laborType)}
														</td>
														<td className="px-3 py-2 text-center" dir="ltr">
															{item.laborType === "LUMP_SUM" ? "—" : formatNum(item.laborUnitCost)}
														</td>
														<td className="px-3 py-2 text-center" dir="ltr">
															{item.laborType === "LUMP_SUM" ? "—" : formatNum(item.quantity)}
														</td>
														<td className="px-3 py-2 text-center font-medium" dir="ltr">
															{formatNum(item.laborTotal)}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* ─── Grand total bar ─── */}
			<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-2">
				{activeTotal > 0 && (
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{t("labor.structuralLaborShort")}</span>
						<span dir="ltr">{formatNum(activeTotal)} {t("common.sar")}</span>
					</div>
				)}
				{grandLaborTotal > 0 && (
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">{t("labor.otherSectionsShort")}</span>
						<span dir="ltr">{formatNum(grandLaborTotal)} {t("common.sar")}</span>
					</div>
				)}
				<div className="flex items-center justify-between border-t border-primary/20 pt-2">
					<span className="font-semibold">{t("labor.totalLabor")}</span>
					<span className="text-lg font-bold text-primary" dir="ltr">
						{formatNum(activeTotal + grandLaborTotal)} {t("common.sar")}
					</span>
				</div>
			</div>
		</div>
	);
}
