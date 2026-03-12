"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface StructuralCostingTabProps {
	organizationId: string;
	studyId: string;
	buildingArea: number;
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

	// ─── Local state ───
	const [concretePrice, setConcretePrice] = useState("");
	const [steelPrice, setSteelPrice] = useState("");
	const [storagePercent, setStoragePercent] = useState("2");
	const [totalConcreteVol, setTotalConcreteVol] = useState("");
	const [totalSteelWeight, setTotalSteelWeight] = useState("");
	const [initialized, setInitialized] = useState(false);

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
	const generateMutation = useMutation(
		orpc.pricing.studies.costing.generate.mutationOptions({
			onSuccess: (data: any) => {
				if (data.generated > 0) {
					toast.success(`تم توليد ${data.generated} بند للتسعير`);
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
	}, [costingLoading, itemsLoading]);

	// ─── Auto-aggregate quantities from structural items ───
	const autoAggregates = useMemo(() => {
		let concrete = 0;
		let steel = 0;
		for (const item of ((items as any) ?? [])) {
			concrete += Number(item.concreteVolume ?? 0);
			steel += Number(item.steelWeight ?? 0);
		}
		return { concrete, steel };
	}, [items]);

	// ─── Initialize from saved data ───
	useEffect(() => {
		if (initialized || breakdownLoading) return;

		const bd = savedBreakdown as any;
		if (bd && (bd.concretePrice != null || bd.steelPrice != null)) {
			setConcretePrice(bd.concretePrice != null ? String(bd.concretePrice) : "");
			setSteelPrice(bd.steelPrice != null ? String(bd.steelPrice) : "");
			setStoragePercent(bd.storagePercent != null ? String(bd.storagePercent) : "2");
		}

		// Set quantities from saved or auto-aggregated
		if (!totalConcreteVol && autoAggregates.concrete > 0) {
			setTotalConcreteVol(String(autoAggregates.concrete));
		}
		if (!totalSteelWeight && autoAggregates.steel > 0) {
			setTotalSteelWeight(String(autoAggregates.steel));
		}

		setInitialized(true);
	}, [breakdownLoading, savedBreakdown, autoAggregates, initialized, totalConcreteVol, totalSteelWeight]);

	// ─── Computed totals ───
	const concreteTotal = (Number(totalConcreteVol) || 0) * (Number(concretePrice) || 0);
	const steelTotal = (Number(totalSteelWeight) || 0) * (Number(steelPrice) || 0);
	const materialSubtotal = concreteTotal + steelTotal;
	const storagePct = Number(storagePercent) || 2;
	const storageTotal = materialSubtotal * (storagePct / 100);
	const grandTotal = materialSubtotal + storageTotal;

	// ─── Helpers ───
	const formatNum = (n: number | null | undefined) =>
		n != null
			? Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 })
			: "—";

	// ─── Save handler ───
	const handleSave = () => {
		if (grandTotal <= 0) {
			toast.error("يرجى إدخال أسعار المواد");
			return;
		}

		// 1. Save prices to laborBreakdown JSON
		(setBreakdownMutation as any).mutate({
			organizationId,
			studyId,
			breakdown: {
				...(savedBreakdown as any ?? {}),
				concretePrice: Number(concretePrice) || 0,
				steelPrice: Number(steelPrice) || 0,
				storagePercent: storagePct,
			},
		});

		// 2. Distribute material costs across CostingItems proportionally
		const cItems = (costingItems as any[]) ?? [];
		if (cItems.length === 0) return;

		const totalConcrete = Number(totalConcreteVol) || 0;
		const totalSteel = Number(totalSteelWeight) || 0;
		const cPrice = Number(concretePrice) || 0;
		const sPrice = Number(steelPrice) || 0;

		const updateItems = cItems.map((ci: any) => {
			// Find matching structural item to get its concrete/steel share
			const matchItem = ((items as any[]) ?? []).find(
				(it: any) => it.name === ci.description || it.id === ci.sourceItemId,
			);
			const itemConcrete = Number(matchItem?.concreteVolume ?? 0);
			const itemSteel = Number(matchItem?.steelWeight ?? 0);

			// Material cost for this item
			const matCost = (itemConcrete * cPrice) + (itemSteel * sPrice);
			const storageCost = matCost * (storagePct / 100);
			const qty = Number(ci.quantity) || 1;

			return {
				id: ci.id,
				materialUnitCost: qty > 0 ? (matCost + storageCost) / qty : 0,
				laborUnitCost: null,
				storageCostPercent: storagePct,
			};
		});

		(bulkUpdateMutation as any).mutate({
			organizationId,
			studyId,
			items: updateItems,
		});
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
		<div className="space-y-4">
			{/* ─── Quantities summary ─── */}
			<div className="rounded-xl border border-border bg-card p-4 space-y-3">
				<h4 className="font-medium">ملخص الكميات الإنشائية</h4>
				<p className="text-xs text-muted-foreground">
					محسوبة من المواصفات — يمكن التعديل يدوياً
				</p>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<Label className="text-xs">إجمالي الخرسانة (م³)</Label>
						<Input
							type="number"
							className="rounded-lg"
							dir="ltr"
							placeholder="0"
							value={totalConcreteVol}
							onChange={(e: any) => setTotalConcreteVol(e.target.value)}
						/>
						{autoAggregates.concrete > 0 && totalConcreteVol !== String(autoAggregates.concrete) && (
							<button
								type="button"
								className="text-xs text-primary hover:underline"
								onClick={() => setTotalConcreteVol(String(autoAggregates.concrete))}
							>
								إعادة من المواصفات ({formatNum(autoAggregates.concrete)} م³)
							</button>
						)}
					</div>
					<div className="space-y-1">
						<Label className="text-xs">إجمالي الحديد (طن)</Label>
						<Input
							type="number"
							className="rounded-lg"
							dir="ltr"
							placeholder="0"
							value={totalSteelWeight}
							onChange={(e: any) => setTotalSteelWeight(e.target.value)}
						/>
						{autoAggregates.steel > 0 && totalSteelWeight !== String(autoAggregates.steel) && (
							<button
								type="button"
								className="text-xs text-primary hover:underline"
								onClick={() => setTotalSteelWeight(String(autoAggregates.steel))}
							>
								إعادة من المواصفات ({formatNum(autoAggregates.steel)} طن)
							</button>
						)}
					</div>
				</div>
			</div>

			{/* ─── Material prices ─── */}
			<div className="rounded-xl border border-border bg-card p-4 space-y-4">
				<h4 className="font-medium">أسعار المواد</h4>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="space-y-1">
						<Label className="text-xs">سعر الخرسانة (ر.س/م³)</Label>
						<Input
							type="number"
							className="rounded-lg"
							dir="ltr"
							placeholder="0"
							value={concretePrice}
							onChange={(e: any) => setConcretePrice(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">سعر الحديد (ر.س/طن)</Label>
						<Input
							type="number"
							className="rounded-lg"
							dir="ltr"
							placeholder="0"
							value={steelPrice}
							onChange={(e: any) => setSteelPrice(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs">التشوين (%)</Label>
						<Input
							type="number"
							className="rounded-lg"
							dir="ltr"
							placeholder="2"
							value={storagePercent}
							onChange={(e: any) => setStoragePercent(e.target.value)}
						/>
					</div>
				</div>

				{/* Subtotals */}
				<div className="space-y-2 pt-2 border-t border-border">
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">إجمالي الخرسانة</span>
						<span dir="ltr" className="font-medium">
							{concreteTotal > 0 ? `${formatNum(concreteTotal)} ر.س` : "—"}
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">إجمالي الحديد</span>
						<span dir="ltr" className="font-medium">
							{steelTotal > 0 ? `${formatNum(steelTotal)} ر.س` : "—"}
						</span>
					</div>
					<div className="flex items-center justify-between text-sm">
						<span className="text-muted-foreground">التشوين ({storagePct}%)</span>
						<span dir="ltr" className="font-medium">
							{storageTotal > 0 ? `${formatNum(storageTotal)} ر.س` : "—"}
						</span>
					</div>
				</div>
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

			{/* ─── Save button ─── */}
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
					حفظ
				</Button>
			</div>
		</div>
	);
}
