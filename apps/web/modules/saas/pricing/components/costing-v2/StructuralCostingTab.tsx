"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Card, CardContent } from "@ui/components/card";
import { cn } from "@ui/lib";
import { ChevronDown, Hammer, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface StructuralCostingTabProps {
	organizationId: string;
	studyId: string;
	buildingArea: number;
}

type LaborMode = "subcontractor" | "per_sqm" | "lump_sum" | "salary";

interface LocalPrice {
	material: string;
	labor: string;
	storage: string;
}

interface SalaryWorker {
	id: string;
	craft: string;
	count: string;
	salary: string;
	months: string;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const LABOR_MODES: { value: LaborMode; label: string }[] = [
	{ value: "subcontractor", label: "مقاول باطن بالوحدة" },
	{ value: "per_sqm", label: "بالمتر المسطح" },
	{ value: "lump_sum", label: "بالمقطوعية" },
	{ value: "salary", label: "بالراتب الشهري" },
];

let workerIdCounter = 0;
function nextWorkerId() {
	return `worker_${++workerIdCounter}_${Date.now()}`;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function StructuralCostingTab({
	organizationId,
	studyId,
	buildingArea,
}: StructuralCostingTabProps) {
	const queryClient = useQueryClient();
	const [laborMode, setLaborMode] = useState<LaborMode>("subcontractor");

	// ─── Local state ───
	const [prices, setPrices] = useState<Record<string, LocalPrice>>({});
	const [pricePerSqm, setPricePerSqm] = useState("");
	const [lumpSumAmount, setLumpSumAmount] = useState("");
	const [salaryWorkers, setSalaryWorkers] = useState<SalaryWorker[]>([]);
	const [salaryInsurance, setSalaryInsurance] = useState("");
	const [salaryHousing, setSalaryHousing] = useState("");
	const [initialized, setInitialized] = useState(false);
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

	// ─── Queries ───
	const { data: items, isLoading: itemsLoading } = useQuery(
		orpc.pricing.studies.getStructuralItems.queryOptions({
			input: { organizationId, costStudyId: studyId },
		}),
	);

	const {
		data: costingItems,
		isLoading: costingLoading,
	} = useQuery(
		orpc.pricing.studies.costing.getItems.queryOptions({
			input: { organizationId, studyId, section: "STRUCTURAL" },
		}),
	);

	// ─── Mutations ───
	const generateMutation = useMutation(
		orpc.pricing.studies.costing.generate.mutationOptions({
			onSuccess: (data: any) => {
				if (data.generated > 0) {
					toast.success(`تم توليد ${data.generated} بند للتسعير`);
				} else {
					toast.info(data.message || "البنود موجودة مسبقاً");
				}
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "costing"]],
				});
			},
			onError: (e: any) => toast.error(e.message || "حدث خطأ أثناء التوليد"),
		}),
	);

	const bulkUpdateMutation = useMutation(
		orpc.pricing.studies.costing.bulkUpdate.mutationOptions({
			onSuccess: () => {
				toast.success("تم حفظ الأسعار بنجاح");
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "costing"]],
				});
			},
			onError: (e: any) => toast.error(e.message || "حدث خطأ أثناء الحفظ"),
		}),
	);

	const setSectionLaborMutation = useMutation(
		orpc.pricing.studies.costing.setSectionLabor.mutationOptions({
			onSuccess: () => {
				toast.success("تم حفظ بيانات المصنعيات بنجاح");
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "costing"]],
				});
			},
			onError: (e: any) => toast.error(e.message || "حدث خطأ أثناء الحفظ"),
		}),
	);

	// ─── Auto-generate on mount if no costing items ───
	useEffect(() => {
		if (
			!costingLoading &&
			!itemsLoading &&
			costingItems &&
			(costingItems as any).length === 0 &&
			items &&
			(items as any).length > 0 &&
			!generateMutation.isPending
		) {
			(generateMutation as any).mutate({ organizationId, studyId });
		}
		// Run only when data finishes loading
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [costingLoading, itemsLoading]);

	// ─── Initialize local state from fetched costing items ───
	useEffect(() => {
		if (initialized || !costingItems || (costingItems as any).length === 0) return;

		const newPrices: Record<string, LocalPrice> = {};
		for (const ci of (costingItems as any[])) {
			newPrices[ci.id] = {
				material: ci.materialUnitCost != null ? String(Number(ci.materialUnitCost)) : "",
				labor: ci.laborUnitCost != null ? String(Number(ci.laborUnitCost)) : "",
				storage: ci.storageCostPercent != null ? String(Number(ci.storageCostPercent)) : "",
			};
		}
		setPrices(newPrices);
		setInitialized(true);
	}, [costingItems, initialized]);

	// ─── Helpers ───
	const formatNum = (n: number | null | undefined) =>
		n != null
			? Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 })
			: "—";

	const findCostingItem = useCallback(
		(structuralItem: { id: string; name: string }) => {
			return ((costingItems as any) ?? []).find(
				(c: any) =>
					c.description === structuralItem.name ||
					c.sourceItemId === structuralItem.id,
			);
		},
		[costingItems],
	);

	// ─── Per-item row total calculation ───
	const computeRowTotal = useCallback(
		(
			qty: number,
			p: LocalPrice,
			mode: LaborMode,
		) => {
			const mat = p.material ? Number(p.material) : 0;
			const labor = mode === "subcontractor" && p.labor ? Number(p.labor) : 0;
			const storagePct = p.storage ? Number(p.storage) : 2;
			const matTotal = mat * qty;
			const laborTotal = labor * qty;
			const storageTotal = (matTotal + laborTotal) * (storagePct / 100);
			return { matTotal, laborTotal, storageTotal, total: matTotal + laborTotal + storageTotal };
		},
		[],
	);

	// ─── Grand total for subcontractor mode ───
	const subcontractorGrandTotal = useMemo(() => {
		let total = 0;
		for (const item of ((items as any) ?? [])) {
			const ci = findCostingItem(item);
			const key = ci?.id ?? item.id;
			const p = prices[key] ?? { material: "", labor: "", storage: "" };
			const row = computeRowTotal(Number(item.quantity), p, "subcontractor");
			total += row.total;
		}
		return total;
	}, [items, prices, findCostingItem, computeRowTotal]);

	// ─── Per-sqm total ───
	const perSqmTotal = useMemo(() => {
		const price = pricePerSqm ? Number(pricePerSqm) : 0;
		return price * buildingArea;
	}, [pricePerSqm, buildingArea]);

	// ─── Lump sum total ───
	const lumpSumTotal = useMemo(() => {
		return lumpSumAmount ? Number(lumpSumAmount) : 0;
	}, [lumpSumAmount]);

	// ─── Salary totals ───
	const salaryTotals = useMemo(() => {
		let workersTotal = 0;
		for (const w of salaryWorkers) {
			const count = w.count ? Number(w.count) : 0;
			const salary = w.salary ? Number(w.salary) : 0;
			const months = w.months ? Number(w.months) : 0;
			workersTotal += count * salary * months;
		}
		const insurance = salaryInsurance ? Number(salaryInsurance) : 0;
		const housing = salaryHousing ? Number(salaryHousing) : 0;
		return {
			workersTotal,
			insurance,
			housing,
			grandTotal: workersTotal + insurance + housing,
		};
	}, [salaryWorkers, salaryInsurance, salaryHousing]);

	// ─── Add / Remove salary worker ───
	const addWorker = () => {
		setSalaryWorkers((prev) => [
			...prev,
			{ id: nextWorkerId(), craft: "", count: "1", salary: "", months: "" },
		]);
	};

	const removeWorker = (id: string) => {
		setSalaryWorkers((prev) => prev.filter((w) => w.id !== id));
	};

	const updateWorker = (id: string, field: keyof SalaryWorker, value: string) => {
		setSalaryWorkers((prev) =>
			prev.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
		);
	};

	// ─── Save handlers ───
	const handleSaveSubcontractor = () => {
		const updateItems: Array<{
			id: string;
			materialUnitCost: number | null;
			laborUnitCost: number | null;
			storageCostPercent: number | null;
		}> = [];

		for (const item of ((items as any) ?? [])) {
			const ci = findCostingItem(item);
			if (!ci) continue;
			const p = prices[ci.id] ?? { material: "", labor: "", storage: "" };
			updateItems.push({
				id: ci.id,
				materialUnitCost: p.material ? Number(p.material) : null,
				laborUnitCost: p.labor ? Number(p.labor) : null,
				storageCostPercent: p.storage ? Number(p.storage) : null,
			});
		}

		if (updateItems.length === 0) {
			toast.error("لا توجد بنود للحفظ");
			return;
		}

		(bulkUpdateMutation as any).mutate({
			organizationId,
			studyId,
			items: updateItems,
		});
	};

	const handleSavePerSqm = () => {
		const price = pricePerSqm ? Number(pricePerSqm) : 0;
		if (price <= 0) {
			toast.error("يرجى إدخال سعر المتر المسطح");
			return;
		}
		(setSectionLaborMutation as any).mutate({
			organizationId,
			studyId,
			section: "STRUCTURAL",
			laborType: "PER_SQM",
			laborUnitCost: price,
		});
	};

	const handleSaveLumpSum = () => {
		const amount = lumpSumAmount ? Number(lumpSumAmount) : 0;
		if (amount <= 0) {
			toast.error("يرجى إدخال مبلغ المقطوعية");
			return;
		}
		(setSectionLaborMutation as any).mutate({
			organizationId,
			studyId,
			section: "STRUCTURAL",
			laborType: "LUMP_SUM",
			laborUnitCost: amount,
		});
	};

	const handleSaveSalary = () => {
		if (salaryTotals.grandTotal <= 0) {
			toast.error("يرجى إدخال بيانات العمالة");
			return;
		}
		(setSectionLaborMutation as any).mutate({
			organizationId,
			studyId,
			section: "STRUCTURAL",
			laborType: "SALARY",
			laborUnitCost: salaryTotals.grandTotal,
		});
	};

	const isSaving = bulkUpdateMutation.isPending || setSectionLaborMutation.isPending;
	const isLoading = itemsLoading || costingLoading;

	// ═══════════════════════════════════════════════════════════════
	// RENDER
	// ═══════════════════════════════════════════════════════════════

	return (
		<div className="space-y-4">
			{/* ─── Labor method selector ─── */}
			<div className="rounded-xl border border-border bg-card p-4">
				<Label className="text-sm font-medium mb-3 block">
					طريقة حساب عمالة الإنشائي
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
							{mode.label}
						</button>
					))}
				</div>
			</div>

			{/* ─── Per-SQM mode ─── */}
			{laborMode === "per_sqm" && (
				<div className="rounded-xl border border-border bg-card p-4 space-y-3">
					<h4 className="font-medium">مصنعيات عظم شاملة بالمتر المسطح</h4>
					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-1">
							<Label className="text-xs">السعر (ريال/م²)</Label>
							<Input
								type="number"
								placeholder="0"
								className="rounded-lg"
								dir="ltr"
								value={pricePerSqm}
								onChange={(e: any) => setPricePerSqm(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">مساحة البناء</Label>
							<div
								className="h-10 flex items-center px-3 bg-muted rounded-lg text-sm"
								dir="ltr"
							>
								{buildingArea.toLocaleString("ar-SA")} م²
							</div>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">الإجمالي</Label>
							<div
								className="h-10 flex items-center px-3 bg-muted rounded-lg text-sm font-medium"
								dir="ltr"
							>
								{perSqmTotal > 0
									? `${formatNum(perSqmTotal)} ر.س`
									: "—"}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* ─── Lump sum mode ─── */}
			{laborMode === "lump_sum" && (
				<div className="rounded-xl border border-border bg-card p-4 space-y-3">
					<h4 className="font-medium">مصنعيات عظم بالمقطوعية</h4>
					<div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
						<Label className="text-sm font-medium mb-2 block">
							مبلغ المقطوعية الشامل لجميع أعمال الإنشائي
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
							<span className="text-sm text-muted-foreground">
								ريال (شامل مواد ومصنعية وتشوين)
							</span>
						</div>
						{lumpSumTotal > 0 && (
							<div className="mt-3 text-sm">
								<span className="text-muted-foreground">الإجمالي: </span>
								<span className="font-bold text-primary" dir="ltr">
									{formatNum(lumpSumTotal)} ر.س
								</span>
								{buildingArea > 0 && (
									<span className="text-muted-foreground mr-3" dir="ltr">
										({formatNum(lumpSumTotal / buildingArea)} ر.س/م²)
									</span>
								)}
							</div>
						)}
					</div>
				</div>
			)}

			{/* ─── Subcontractor: Expandable item cards ─── */}
			{laborMode === "subcontractor" && (
				<div className="space-y-3">
					{isLoading && (
						<div className="flex justify-center py-8">
							<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
						</div>
					)}
					{!isLoading && (((items as any) ?? []) as any[]).length === 0 && (
						<div className="text-center py-8 text-muted-foreground">
							لا توجد بنود إنشائية
						</div>
					)}
					{(((items as any) ?? []) as any[]).map((item) => {
						const costingItem = findCostingItem(item);
						const key = costingItem?.id ?? item.id;
						const p = prices[key] ?? {
							material: "",
							labor: "",
							storage: "",
						};
						const qty = Number(item.quantity);
						const row = computeRowTotal(qty, p, "subcontractor");
						const isExpanded = expandedItems.has(item.id);

						return (
							<Card key={item.id} className="overflow-hidden">
								{/* Collapsed header */}
								<button
									type="button"
									onClick={() =>
										setExpandedItems((prev) => {
											const next = new Set(prev);
											if (next.has(item.id)) next.delete(item.id);
											else next.add(item.id);
											return next;
										})
									}
									className="w-full flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors text-right"
								>
									<div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
										<Hammer className="h-4 w-4 text-blue-600" />
									</div>
									<div className="flex-1 min-w-0">
										<span className="font-medium text-sm truncate block">
											{item.name}
										</span>
										<span className="text-xs text-muted-foreground" dir="ltr">
											{formatNum(qty)} {item.unit}
										</span>
									</div>
									<div className="text-left shrink-0">
										<span
											className="font-semibold text-sm"
											dir="ltr"
										>
											{row.total > 0
												? `${formatNum(row.total)} ر.س`
												: "—"}
										</span>
									</div>
									<ChevronDown
										className={cn(
											"h-4 w-4 text-muted-foreground transition-transform shrink-0",
											isExpanded && "rotate-180",
										)}
									/>
								</button>

								{/* Expanded content */}
								{isExpanded && (
									<CardContent className="border-t border-border px-4 pb-4 pt-3 space-y-4">
										{/* Price inputs grid */}
										<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
											<div className="space-y-1">
												<Label className="text-xs">سعر المادة (ر.س/وحدة)</Label>
												<Input
													type="number"
													className="h-9 rounded-lg"
													dir="ltr"
													placeholder="0"
													value={p.material}
													onChange={(e: any) =>
														setPrices((prev) => ({
															...prev,
															[key]: {
																...prev[key],
																material: e.target.value,
																labor: prev[key]?.labor ?? "",
																storage: prev[key]?.storage ?? "",
															},
														}))
													}
												/>
												{p.material && qty > 0 && (
													<p className="text-xs text-muted-foreground" dir="ltr">
														= {formatNum(Number(p.material) * qty)} ر.س
													</p>
												)}
											</div>
											<div className="space-y-1">
												<Label className="text-xs">المصنعية (ر.س/وحدة)</Label>
												<Input
													type="number"
													className="h-9 rounded-lg"
													dir="ltr"
													placeholder="0"
													value={p.labor}
													onChange={(e: any) =>
														setPrices((prev) => ({
															...prev,
															[key]: {
																...prev[key],
																material: prev[key]?.material ?? "",
																labor: e.target.value,
																storage: prev[key]?.storage ?? "",
															},
														}))
													}
												/>
												{p.labor && qty > 0 && (
													<p className="text-xs text-muted-foreground" dir="ltr">
														= {formatNum(Number(p.labor) * qty)} ر.س
													</p>
												)}
											</div>
											<div className="space-y-1">
												<Label className="text-xs">التشوين (%)</Label>
												<Input
													type="number"
													className="h-9 rounded-lg"
													dir="ltr"
													placeholder="2"
													value={p.storage}
													onChange={(e: any) =>
														setPrices((prev) => ({
															...prev,
															[key]: {
																...prev[key],
																material: prev[key]?.material ?? "",
																labor: prev[key]?.labor ?? "",
																storage: e.target.value,
															},
														}))
													}
												/>
											</div>
										</div>

										{/* Item total summary */}
										<div className="rounded-lg bg-primary/5 p-3">
											<div className="flex items-center justify-between">
												<span className="text-sm font-medium">إجمالي البند</span>
												<span className="text-lg font-bold text-primary" dir="ltr">
													{row.total > 0 ? `${formatNum(row.total)} ر.س` : "—"}
												</span>
											</div>
											{row.total > 0 && qty > 0 && (
												<div className="flex items-center justify-between mt-1">
													<span className="text-xs text-muted-foreground">تكلفة الوحدة</span>
													<span className="text-xs font-medium" dir="ltr">
														{formatNum(row.total / qty)} ر.س/{item.unit}
													</span>
												</div>
											)}
										</div>
									</CardContent>
								)}
							</Card>
						);
					})}
				</div>
			)}

			{/* ─── Salary mode ─── */}
			{laborMode === "salary" && (
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
						<h4 className="font-medium">عمالة الإنشائي بالراتب الشهري</h4>
						<Button
							variant="outline"
							size="sm"
							onClick={addWorker}
							className="gap-1.5 rounded-lg"
						>
							<Plus className="h-3.5 w-3.5" />
							إضافة عامل
						</Button>
					</div>

					{salaryWorkers.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-muted-foreground text-sm mb-3">
								لم تتم إضافة أي عمالة بعد
							</p>
							<Button
								variant="outline"
								onClick={addWorker}
								className="gap-1.5 rounded-lg"
							>
								<Plus className="h-4 w-4" />
								إضافة عامل
							</Button>
						</div>
					) : (
						<>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-muted/20 text-muted-foreground">
											<th className="px-3 py-2.5 text-right font-medium">
												الحرفة
											</th>
											<th className="px-3 py-2.5 text-center font-medium">
												العدد
											</th>
											<th className="px-3 py-2.5 text-center font-medium">
												الراتب
											</th>
											<th className="px-3 py-2.5 text-center font-medium">
												الأشهر
											</th>
											<th className="px-3 py-2.5 text-center font-medium">
												إجمالي
											</th>
											<th className="px-3 py-2.5 text-center font-medium w-10" />
										</tr>
									</thead>
									<tbody>
										{salaryWorkers.map((w) => {
											const count = w.count ? Number(w.count) : 0;
											const salary = w.salary ? Number(w.salary) : 0;
											const months = w.months ? Number(w.months) : 0;
											const rowTotal = count * salary * months;

											return (
												<tr
													key={w.id}
													className="border-b last:border-0 hover:bg-muted/20"
												>
													<td className="px-3 py-2">
														<Input
															type="text"
															className="h-8 w-32 rounded-lg"
															placeholder="مثال: نجار"
															value={w.craft}
															onChange={(e: any) =>
																updateWorker(
																	w.id,
																	"craft",
																	e.target.value,
																)
															}
														/>
													</td>
													<td className="px-3 py-2">
														<Input
															type="number"
															className="h-8 w-16 mx-auto text-center rounded-lg"
															dir="ltr"
															placeholder="1"
															value={w.count}
															onChange={(e: any) =>
																updateWorker(
																	w.id,
																	"count",
																	e.target.value,
																)
															}
														/>
													</td>
													<td className="px-3 py-2">
														<Input
															type="number"
															className="h-8 w-24 mx-auto text-center rounded-lg"
															dir="ltr"
															placeholder="0"
															value={w.salary}
															onChange={(e: any) =>
																updateWorker(
																	w.id,
																	"salary",
																	e.target.value,
																)
															}
														/>
													</td>
													<td className="px-3 py-2">
														<Input
															type="number"
															className="h-8 w-16 mx-auto text-center rounded-lg"
															dir="ltr"
															placeholder="0"
															value={w.months}
															onChange={(e: any) =>
																updateWorker(
																	w.id,
																	"months",
																	e.target.value,
																)
															}
														/>
													</td>
													<td
														className="px-3 py-2 text-center font-medium"
														dir="ltr"
													>
														{rowTotal > 0
															? formatNum(rowTotal)
															: "—"}
													</td>
													<td className="px-3 py-2 text-center">
														<button
															type="button"
															onClick={() =>
																removeWorker(w.id)
															}
															className="text-destructive hover:text-destructive/80 transition-colors"
														>
															<Trash2 className="h-4 w-4" />
														</button>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>

							{/* Salary footer totals */}
							<div className="border-t border-border bg-muted/10 px-4 py-3 space-y-2">
								<div className="flex items-center gap-4 text-sm">
									<span className="text-muted-foreground w-28">
										إجمالي الرواتب:
									</span>
									<span className="font-medium" dir="ltr">
										{salaryTotals.workersTotal > 0
											? `${formatNum(salaryTotals.workersTotal)} ر.س`
											: "—"}
									</span>
								</div>
								<div className="flex items-center gap-4 text-sm">
									<span className="text-muted-foreground w-28">
										+ تأمين:
									</span>
									<div className="flex items-center gap-2">
										<Input
											type="number"
											className="h-8 w-28 text-center rounded-lg"
											dir="ltr"
											placeholder="0"
											value={salaryInsurance}
											onChange={(e: any) =>
												setSalaryInsurance(e.target.value)
											}
										/>
										<span className="text-xs text-muted-foreground">
											ر.س
										</span>
									</div>
								</div>
								<div className="flex items-center gap-4 text-sm">
									<span className="text-muted-foreground w-28">
										+ سكن:
									</span>
									<div className="flex items-center gap-2">
										<Input
											type="number"
											className="h-8 w-28 text-center rounded-lg"
											dir="ltr"
											placeholder="0"
											value={salaryHousing}
											onChange={(e: any) =>
												setSalaryHousing(e.target.value)
											}
										/>
										<span className="text-xs text-muted-foreground">
											ر.س
										</span>
									</div>
								</div>
								<div className="flex items-center gap-4 text-sm border-t border-border pt-2">
									<span className="font-medium w-28">
										= الإجمالي:
									</span>
									<span
										className="font-bold text-primary"
										dir="ltr"
									>
										{salaryTotals.grandTotal > 0
											? `${formatNum(salaryTotals.grandTotal)} ر.س`
											: "—"}
									</span>
								</div>
							</div>
						</>
					)}
				</div>
			)}

			{/* ─── Running total bar ─── */}
			<div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
				<div className="flex items-center justify-between">
					<span className="font-semibold">
						إجمالي الإنشائي
						<span className="text-xs font-normal text-muted-foreground mr-2">
							({LABOR_MODES.find((m) => m.value === laborMode)?.label})
						</span>
					</span>
					<span className="text-lg font-bold text-primary" dir="ltr">
						{laborMode === "subcontractor" &&
							(subcontractorGrandTotal > 0
								? `${formatNum(subcontractorGrandTotal)} ر.س`
								: "—")}
						{laborMode === "per_sqm" &&
							(perSqmTotal > 0
								? `${formatNum(perSqmTotal)} ر.س`
								: "—")}
						{laborMode === "lump_sum" &&
							(lumpSumTotal > 0
								? `${formatNum(lumpSumTotal)} ر.س`
								: "—")}
						{laborMode === "salary" &&
							(salaryTotals.grandTotal > 0
								? `${formatNum(salaryTotals.grandTotal)} ر.س`
								: "—")}
					</span>
				</div>
				{buildingArea > 0 && (
					<div className="flex items-center justify-between mt-1">
						<span className="text-sm text-muted-foreground">
							تكلفة المتر المربع
						</span>
						<span className="text-sm font-medium" dir="ltr">
							{(() => {
								let total = 0;
								if (laborMode === "subcontractor") total = subcontractorGrandTotal;
								if (laborMode === "per_sqm") total = perSqmTotal;
								if (laborMode === "lump_sum") total = lumpSumTotal;
								if (laborMode === "salary") total = salaryTotals.grandTotal;
								return total > 0
									? `${formatNum(total / buildingArea)} ر.س/م²`
									: "—";
							})()}
						</span>
					</div>
				)}
			</div>

			{/* ─── Save button ─── */}
			<div className="flex justify-end">
				<Button
					onClick={() => {
						if (laborMode === "subcontractor") handleSaveSubcontractor();
						else if (laborMode === "per_sqm") handleSavePerSqm();
						else if (laborMode === "lump_sum") handleSaveLumpSum();
						else if (laborMode === "salary") handleSaveSalary();
					}}
					disabled={isSaving}
					className="gap-2 rounded-xl"
				>
					{isSaving ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Save className="h-4 w-4" />
					)}
					حفظ
				</Button>
			</div>
		</div>
	);
}
