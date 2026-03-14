"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { ArrowLeft, Loader2, Pencil, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatNum } from "@saas/pricing/lib/utils";
import { aggregateBOQ, REBAR_WEIGHTS_MAP } from "@saas/pricing/lib/boq-aggregator";
import { recalculateItem } from "@saas/pricing/lib/boq-recalculator";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface MaterialsCostingTabProps {
	organizationId: string;
	studyId: string;
	buildingArea: number;
	onNavigateToTab?: (tab: string) => void;
}

interface ConcreteGradeAgg {
	grade: string;
	volume: number;
}

interface SteelGroupAgg {
	label: string;
	key: string;
	tons: number;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function MaterialsCostingTab({
	organizationId,
	studyId,
	buildingArea,
	onNavigateToTab,
}: MaterialsCostingTabProps) {
	const queryClient = useQueryClient();

	// ─── Local state ───
	const [concretePrices, setConcretePrices] = useState<Record<string, string>>({});
	const [steelPriceD6, setSteelPriceD6] = useState("");
	const [steelPriceD8, setSteelPriceD8] = useState("");
	const [steelPriceMain, setSteelPriceMain] = useState("");
	const [storagePercent, setStoragePercent] = useState("2");
	const [initialized, setInitialized] = useState(false);

	// Manual overrides for quantities
	const [concreteOverrides, setConcreteOverrides] = useState<Record<string, string>>({});
	const [steelOverrides, setSteelOverrides] = useState<Record<string, string>>({});
	const [editingCard, setEditingCard] = useState<string | null>(null);

	// ─── Queries ───
	const { data: items, isLoading: itemsLoading } = useQuery(
		orpc.pricing.studies.getStructuralItems.queryOptions({
			input: { organizationId, costStudyId: studyId },
		}),
	);

	const { data: costingItems, isLoading: costingLoading } = useQuery(
		orpc.pricing.studies.costing.getItems.queryOptions({
			input: { organizationId, studyId, section: "STRUCTURAL" },
		}),
	);

	const { data: savedBreakdown, isLoading: breakdownLoading } = useQuery(
		orpc.pricing.studies.laborBreakdown.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// ─── Mutations ───
	const bulkUpdateMutation = useMutation(
		orpc.pricing.studies.costing.bulkUpdate.mutationOptions({
			onSuccess: () => {
				toast.success("تم حفظ أسعار المواد بنجاح");
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "costing"]],
				});
			},
			onError: (e: any) => toast.error(e.message || "حدث خطأ أثناء الحفظ"),
		}),
	);

	const setBreakdownMutation = useMutation(
		orpc.pricing.studies.laborBreakdown.set.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "laborBreakdown"]],
				});
			},
		}),
	);

	// ─── Aggregate concrete by grade ───
	const concreteGrades = useMemo<ConcreteGradeAgg[]>(() => {
		const gradeMap: Record<string, number> = {};
		for (const item of (items as any) ?? []) {
			const grade = item.concreteType || "C30";
			const vol = Number(item.concreteVolume ?? 0);
			gradeMap[grade] = (gradeMap[grade] ?? 0) + vol;
		}
		return Object.entries(gradeMap)
			.map(([grade, volume]) => ({ grade, volume }))
			.sort((a, b) => {
				const numA = parseInt(a.grade.replace(/\D/g, "")) || 0;
				const numB = parseInt(b.grade.replace(/\D/g, "")) || 0;
				return numA - numB;
			});
	}, [items]);

	// ─── Aggregate steel by diameter groups using aggregateBOQ ───
	const steelGroups = useMemo<SteelGroupAgg[]>(() => {
		const structItems = (items as any) ?? [];
		if (structItems.length === 0) return [];

		try {
			const boqResult = aggregateBOQ(structItems);
			const factoryOrder = boqResult.factoryOrder ?? [];

			let d6Tons = 0;
			let d8Tons = 0;
			let mainTons = 0;

			for (const entry of factoryOrder) {
				const weightTons = (entry.weight ?? 0) / 1000;
				if (entry.diameter === 6) {
					d6Tons += weightTons;
				} else if (entry.diameter === 8) {
					d8Tons += weightTons;
				} else {
					mainTons += weightTons;
				}
			}

			const groups: SteelGroupAgg[] = [];
			if (d6Tons > 0) groups.push({ label: "حديد Ø6", key: "d6", tons: d6Tons });
			if (d8Tons > 0) groups.push({ label: "حديد Ø8", key: "d8", tons: d8Tons });
			if (mainTons > 0) groups.push({ label: "حديد تسليح (Ø10+)", key: "main", tons: mainTons });

			// If no factory order data, fall back to total steel weight
			if (groups.length === 0) {
				let totalSteel = 0;
				for (const item of structItems) {
					totalSteel += Number(item.steelWeight ?? 0);
				}
				if (totalSteel > 0) {
					groups.push({ label: "حديد تسليح", key: "main", tons: totalSteel / 1000 });
				}
			}

			return groups;
		} catch {
			// Fallback: aggregate total steel weight
			let totalSteel = 0;
			for (const item of structItems) {
				totalSteel += Number(item.steelWeight ?? 0);
			}
			if (totalSteel > 0) {
				return [{ label: "حديد تسليح", key: "main", tons: totalSteel / 1000 }];
			}
			return [];
		}
	}, [items]);

	// ─── Initialize from saved data ───
	useEffect(() => {
		if (initialized || breakdownLoading) return;

		const bd = savedBreakdown as any;
		if (bd) {
			if (bd.concretePrices) {
				const priceStrs: Record<string, string> = {};
				for (const [k, v] of Object.entries(bd.concretePrices)) {
					priceStrs[k] = String(v);
				}
				setConcretePrices(priceStrs);
			} else if (bd.concretePrice != null) {
				// Legacy: single concrete price — apply to all grades
				const legacy = String(bd.concretePrice);
				const priceStrs: Record<string, string> = {};
				for (const g of concreteGrades) {
					priceStrs[g.grade] = legacy;
				}
				setConcretePrices(priceStrs);
			}

			if (bd.steelPriceD6 != null) setSteelPriceD6(String(bd.steelPriceD6));
			if (bd.steelPriceD8 != null) setSteelPriceD8(String(bd.steelPriceD8));
			if (bd.steelPriceMain != null) setSteelPriceMain(String(bd.steelPriceMain));
			else if (bd.steelPrice != null) {
				// Legacy: single steel price — apply to all groups
				const legacy = String(bd.steelPrice);
				setSteelPriceD6(legacy);
				setSteelPriceD8(legacy);
				setSteelPriceMain(legacy);
			}

			if (bd.storagePercent != null) setStoragePercent(String(bd.storagePercent));
		}

		setInitialized(true);
	}, [breakdownLoading, savedBreakdown, concreteGrades, initialized]);

	// ─── Effective quantities (with overrides) ───
	const getConcreteVol = (grade: string, autoVol: number) => {
		if (concreteOverrides[grade] != null && concreteOverrides[grade] !== "") {
			return Number(concreteOverrides[grade]) || 0;
		}
		return autoVol;
	};

	const getSteelTons = (key: string, autoTons: number) => {
		if (steelOverrides[key] != null && steelOverrides[key] !== "") {
			return Number(steelOverrides[key]) || 0;
		}
		return autoTons;
	};

	// ─── Pricing rows for table ───
	const pricingRows = useMemo(() => {
		const rows: Array<{
			key: string;
			label: string;
			quantity: number;
			unit: string;
			priceState: string;
			setPrice: (v: string) => void;
			total: number;
		}> = [];

		for (const g of concreteGrades) {
			const vol = getConcreteVol(g.grade, g.volume);
			const price = Number(concretePrices[g.grade] ?? "") || 0;
			rows.push({
				key: `concrete-${g.grade}`,
				label: `خرسانة ${g.grade}`,
				quantity: vol,
				unit: "م³",
				priceState: concretePrices[g.grade] ?? "",
				setPrice: (v: string) => setConcretePrices((p) => ({ ...p, [g.grade]: v })),
				total: vol * price,
			});
		}

		for (const sg of steelGroups) {
			const tons = getSteelTons(sg.key, sg.tons);
			const price =
				sg.key === "d6" ? Number(steelPriceD6) || 0 :
				sg.key === "d8" ? Number(steelPriceD8) || 0 :
				Number(steelPriceMain) || 0;
			rows.push({
				key: `steel-${sg.key}`,
				label: sg.label,
				quantity: tons,
				unit: "طن",
				priceState:
					sg.key === "d6" ? steelPriceD6 :
					sg.key === "d8" ? steelPriceD8 :
					steelPriceMain,
				setPrice:
					sg.key === "d6" ? setSteelPriceD6 :
					sg.key === "d8" ? setSteelPriceD8 :
					setSteelPriceMain,
				total: tons * price,
			});
		}

		return rows;
	}, [concreteGrades, steelGroups, concretePrices, steelPriceD6, steelPriceD8, steelPriceMain, concreteOverrides, steelOverrides]);

	// ─── Computed totals ───
	const materialSubtotal = pricingRows.reduce((s, r) => s + r.total, 0);
	const storagePct = Number(storagePercent) || 0;
	const storageTotal = materialSubtotal * (storagePct / 100);
	const grandTotal = materialSubtotal + storageTotal;

	// ─── Save handler ───
	const handleSave = () => {
		if (grandTotal <= 0) {
			toast.error("يرجى إدخال أسعار المواد");
			return;
		}

		// Build concrete prices map (numbers)
		const concretePricesNum: Record<string, number> = {};
		for (const [k, v] of Object.entries(concretePrices)) {
			concretePricesNum[k] = Number(v) || 0;
		}

		// 1. Save prices to laborBreakdown JSON
		(setBreakdownMutation as any).mutate({
			organizationId,
			studyId,
			breakdown: {
				...(savedBreakdown as any ?? {}),
				concretePrices: concretePricesNum,
				steelPriceD6: Number(steelPriceD6) || 0,
				steelPriceD8: Number(steelPriceD8) || 0,
				steelPriceMain: Number(steelPriceMain) || 0,
				storagePercent: storagePct,
				// Keep legacy fields updated for backward compatibility
				concretePrice: Object.values(concretePricesNum)[0] ?? 0,
				steelPrice: Number(steelPriceMain) || 0,
			},
		});

		// 2. Distribute material costs across CostingItems with per-grade/per-diameter pricing
		const cItems = (costingItems as any[]) ?? [];
		if (cItems.length === 0) return;

		const structItems = (items as any[]) ?? [];
		const d6Price = Number(steelPriceD6) || 0;
		const d8Price = Number(steelPriceD8) || 0;
		const mainPrice = Number(steelPriceMain) || 0;

		const updateItems = cItems.map((ci: any) => {
			const matchItem = structItems.find(
				(it: any) => it.name === ci.description || it.id === ci.sourceItemId,
			);

			if (!matchItem) {
				return { id: ci.id, materialUnitCost: 0 };
			}

			// Concrete cost — per-grade
			const grade = matchItem.concreteType || "C30";
			const itemConcreteVol = Number(matchItem.concreteVolume ?? 0);
			const gradePrice = concretePricesNum[grade] ?? concretePricesNum["C30"] ?? 0;
			const concreteCost = itemConcreteVol * gradePrice;

			// Steel cost — per-diameter using recalculateItem
			let steelCost = 0;
			try {
				const dims = matchItem.dimensions ?? {};
				const recalc = recalculateItem(
					matchItem.category,
					matchItem.subCategory,
					dims,
					Number(matchItem.quantity ?? 1),
					matchItem.name,
				);

				for (const stock of recalc.totals.stocksNeeded) {
					const price =
						stock.diameter <= 6 ? d6Price :
						stock.diameter <= 8 ? d8Price :
						mainPrice;
					const weightPerMeter = REBAR_WEIGHTS_MAP[stock.diameter] ?? 0;
					const weightTons = (stock.count * stock.length * weightPerMeter) / 1000;
					steelCost += weightTons * price;
				}
			} catch {
				// Fallback: use total steel weight with main price
				const itemSteelTons = Number(matchItem.steelWeight ?? 0) / 1000;
				steelCost = itemSteelTons * mainPrice;
			}

			const storageCost = (concreteCost + steelCost) * (storagePct / 100);
			const qty = Number(ci.quantity) || 1;

			return {
				id: ci.id,
				materialUnitCost: qty > 0 ? (concreteCost + steelCost + storageCost) / qty : 0,
			};
		});

		// Scale per-item costs so their sum matches the display grandTotal
		let rawSum = 0;
		for (const ui of updateItems) {
			const ci = cItems.find((c: any) => c.id === ui.id);
			const ciQty = Number(ci?.quantity) || 1;
			rawSum += ui.materialUnitCost * ciQty;
		}
		const scaleFactor = rawSum > 0 ? grandTotal / rawSum : 0;
		const scaledItems = updateItems.map((ui: any) => ({
			...ui,
			materialUnitCost: ui.materialUnitCost * scaleFactor,
		}));

		(bulkUpdateMutation as any).mutate({
			organizationId,
			studyId,
			items: scaledItems,
		});
	};

	const handleSaveAndNavigate = () => {
		handleSave();
		onNavigateToTab?.("labor");
	};

	const isSaving = bulkUpdateMutation.isPending || setBreakdownMutation.isPending;
	const isLoading = itemsLoading || costingLoading || breakdownLoading;

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
			{/* ─── Section A: Quantity Cards ─── */}
			<div className="space-y-3">
				<h4 className="font-medium text-sm text-muted-foreground">كميات الخرسانة</h4>
				<div className="flex flex-wrap gap-3">
					{concreteGrades.map((g) => {
						const vol = getConcreteVol(g.grade, g.volume);
						const isEditing = editingCard === `concrete-${g.grade}`;
						return (
							<div
								key={g.grade}
								className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3 min-w-[140px] flex-1 max-w-[200px]"
							>
								<div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
									خرسانة {g.grade}
								</div>
								{isEditing ? (
									<div className="flex items-center gap-1">
										<Input
											type="number"
											className="h-7 w-20 text-sm rounded-lg"
											dir="ltr"
											autoFocus
											value={concreteOverrides[g.grade] ?? String(g.volume)}
											onChange={(e: any) =>
												setConcreteOverrides((p) => ({ ...p, [g.grade]: e.target.value }))
											}
											onBlur={() => setEditingCard(null)}
											onKeyDown={(e: any) => e.key === "Enter" && setEditingCard(null)}
										/>
										<span className="text-xs text-muted-foreground">م³</span>
									</div>
								) : (
									<div className="flex items-center justify-between">
										<span className="text-lg font-bold" dir="ltr">
											{formatNum(vol)} <span className="text-xs font-normal">م³</span>
										</span>
										<button
											type="button"
											onClick={() => setEditingCard(`concrete-${g.grade}`)}
											className="text-blue-400 hover:text-blue-600 transition-colors"
										>
											<Pencil className="h-3.5 w-3.5" />
										</button>
									</div>
								)}
							</div>
						);
					})}
				</div>

				{steelGroups.length > 0 && (
					<>
						<h4 className="font-medium text-sm text-muted-foreground mt-4">كميات الحديد</h4>
						<div className="flex flex-wrap gap-3">
							{steelGroups.map((sg) => {
								const tons = getSteelTons(sg.key, sg.tons);
								const isEditing = editingCard === `steel-${sg.key}`;
								return (
									<div
										key={sg.key}
										className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-3 min-w-[140px] flex-1 max-w-[200px]"
									>
										<div className="text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">
											{sg.label}
										</div>
										{isEditing ? (
											<div className="flex items-center gap-1">
												<Input
													type="number"
													className="h-7 w-20 text-sm rounded-lg"
													dir="ltr"
													autoFocus
													value={steelOverrides[sg.key] ?? String(sg.tons)}
													onChange={(e: any) =>
														setSteelOverrides((p) => ({ ...p, [sg.key]: e.target.value }))
													}
													onBlur={() => setEditingCard(null)}
													onKeyDown={(e: any) => e.key === "Enter" && setEditingCard(null)}
												/>
												<span className="text-xs text-muted-foreground">طن</span>
											</div>
										) : (
											<div className="flex items-center justify-between">
												<span className="text-lg font-bold" dir="ltr">
													{formatNum(tons)} <span className="text-xs font-normal">طن</span>
												</span>
												<button
													type="button"
													onClick={() => setEditingCard(`steel-${sg.key}`)}
													className="text-orange-400 hover:text-orange-600 transition-colors"
												>
													<Pencil className="h-3.5 w-3.5" />
												</button>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</>
				)}
			</div>

			{/* ─── Section B: Pricing Table ─── */}
			<div className="rounded-xl border border-border bg-card overflow-hidden">
				<div className="px-4 py-3 bg-muted/30 border-b border-border">
					<h4 className="font-semibold">أسعار المواد</h4>
				</div>
				<Table>
					<TableHeader>
						<TableRow className="bg-muted/20">
							<TableHead className="text-right font-medium">المادة</TableHead>
							<TableHead className="text-center font-medium">الكمية</TableHead>
							<TableHead className="text-center font-medium">الوحدة</TableHead>
							<TableHead className="text-center font-medium">السعر</TableHead>
							<TableHead className="text-center font-medium">الإجمالي</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{pricingRows.map((row) => (
							<TableRow key={row.key} className="hover:bg-muted/20">
								<TableCell className="font-medium">{row.label}</TableCell>
								<TableCell className="text-center" dir="ltr">
									{formatNum(row.quantity)}
								</TableCell>
								<TableCell className="text-center text-muted-foreground">
									{row.unit}
								</TableCell>
								<TableCell className="text-center">
									<Input
										type="number"
										className="h-8 w-28 mx-auto text-center rounded-lg"
										dir="ltr"
										placeholder="0"
										value={row.priceState}
										onChange={(e: any) => row.setPrice(e.target.value)}
									/>
								</TableCell>
								<TableCell className="text-center font-medium" dir="ltr">
									{row.total > 0 ? `${formatNum(row.total)}` : "—"}
								</TableCell>
							</TableRow>
						))}

						{/* Storage row */}
						<TableRow className="hover:bg-muted/20 border-t border-dashed">
							<TableCell className="font-medium">التشوين</TableCell>
							<TableCell className="text-center text-muted-foreground">—</TableCell>
							<TableCell className="text-center text-muted-foreground">%</TableCell>
							<TableCell className="text-center">
								<Input
									type="number"
									className="h-8 w-28 mx-auto text-center rounded-lg"
									dir="ltr"
									placeholder="2"
									value={storagePercent}
									onChange={(e: any) => setStoragePercent(e.target.value)}
								/>
							</TableCell>
							<TableCell className="text-center font-medium" dir="ltr">
								{storageTotal > 0 ? `${formatNum(storageTotal)}` : "—"}
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</div>

			{/* ─── Grand total bar ─── */}
			<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
				<div className="flex items-center justify-between">
					<span className="font-semibold">إجمالي تكلفة المواد الإنشائية</span>
					<span className="text-lg font-bold text-primary" dir="ltr">
						{grandTotal > 0 ? `${formatNum(grandTotal)} ر.س` : "—"}
					</span>
				</div>
				{buildingArea > 0 && grandTotal > 0 && (
					<div className="flex items-center justify-between mt-1">
						<span className="text-sm text-muted-foreground">تكلفة المتر المربع</span>
						<span className="text-sm font-medium" dir="ltr">
							{formatNum(grandTotal / buildingArea)} ر.س/م²
						</span>
					</div>
				)}
			</div>

			{/* ─── Section C: Full-Width Save Button ─── */}
			<Button
				onClick={handleSaveAndNavigate}
				disabled={isSaving}
				className="w-full gap-2 py-6 text-base rounded-xl"
				size="lg"
			>
				{isSaving ? (
					<Loader2 className="h-5 w-5 animate-spin" />
				) : (
					<>
						<Save className="h-5 w-5" />
						حفظ تكلفة أسعار المواد والانتقال إلى المصنعيات
						<ArrowLeft className="h-4 w-4" />
					</>
				)}
			</Button>
		</div>
	);
}
