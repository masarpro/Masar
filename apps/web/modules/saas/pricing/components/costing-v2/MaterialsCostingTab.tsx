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
import {
	aggregateBlockMaterials,
	CEMENT_BAGS_PER_BLOCK,
	SAND_VOLUME_PER_BLOCK,
} from "@saas/pricing/lib/block-materials";
import {
	buildMaterialCostUpdates,
	isIsolatedSteelItem,
	ISOLATED_STEEL_LABEL,
	type MaterialPrices,
} from "@saas/pricing/lib/cost-report";

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
	// سعر حديد الأساسات المعزول (إيبوكسي) — يظهر عند تفعيله في المواصفات
	const [steelPriceIsolated, setSteelPriceIsolated] = useState("");
	const [storagePercent, setStoragePercent] = useState("2");
	const [initialized, setInitialized] = useState(false);

	// ─── البلوك ومونته وأعتابه ───
	const [blockPrices, setBlockPrices] = useState<Record<string, string>>({});
	const [mortarSandPrice, setMortarSandPrice] = useState("");
	const [mortarCementPrice, setMortarCementPrice] = useState("");
	const [lintelConcretePrice, setLintelConcretePrice] = useState("");
	const [lintelSteelPrice, setLintelSteelPrice] = useState("");

	// Manual overrides for quantities
	const [concreteOverrides, setConcreteOverrides] = useState<Record<string, string>>({});
	const [steelOverrides, setSteelOverrides] = useState<Record<string, string>>({});
	// تجاوزات كميات البلوك/المونة/الأعتاب (مفتاح واحد لكل بطاقة)
	const [extraOverrides, setExtraOverrides] = useState<Record<string, string>>({});
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

	// مواصفات الأعمال الإنشائية — منها تفعيل الحديد المعزول (إيبوكسي)
	const { data: structuralSpecs } = useQuery(
		orpc.pricing.studies.structuralSpecs.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);
	const hasIsolatedSteel = !!(structuralSpecs as any)?.hasIsolatedSteel;

	// أدوار المبنى — تحدد مراحل التنفيذ ونطاق إعادة استخدام بواقي الأسياخ.
	// لا بد أن تكون نفسها المستخدمة في جدول الكميات وتقرير التكلفة، وإلا
	// اختلف التقطيع المُحسَّن فاختلفت أطنان الحديد بين الشاشات.
	const enabledFloors = useMemo(() => {
		const floors = (structuralSpecs as any)?.buildingConfig?.floors;
		if (!Array.isArray(floors)) return undefined;
		return floors
			.filter((f: any) => f?.enabled)
			.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
			.map((f: any) => ({
				id: String(f.id),
				label: String(f.label ?? ""),
				icon: f.icon,
				sortOrder: Number(f.sortOrder ?? 0),
			}));
	}, [structuralSpecs]);

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

	// ─── بنود البلوك تُسعَّر بصفوفها الخاصة (بلوك + مونة + أعتاب) ───
	// استبعادها من تجميع الخرسانة/الحديد العام يمنع ازدواج احتساب الأعتاب
	const nonBlockItems = useMemo(
		() => ((items as any[]) ?? []).filter((it) => it.category !== "blocks"),
		[items],
	);

	const blockAgg = useMemo(
		() => aggregateBlockMaterials(((items as any[]) ?? []) as any),
		[items],
	);

	// ─── Aggregate concrete by grade ───
	const concreteGrades = useMemo<ConcreteGradeAgg[]>(() => {
		const gradeMap: Record<string, number> = {};
		for (const item of nonBlockItems) {
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
	}, [nonBlockItems]);

	// تقطيع مُحسَّن مرة واحدة — يغذّي مجموعات الحديد وتكلفة كل بند عند الحفظ
	// حتى يخرج الرقمان من أساس واحد (طلبية المصنع بعد إعادة استخدام البواقي)
	const boqResult = useMemo(() => {
		if (nonBlockItems.length === 0) return null;
		try {
			return aggregateBOQ(nonBlockItems as any, enabledFloors);
		} catch {
			return null;
		}
	}, [nonBlockItems, enabledFloors]);

	// ─── Aggregate steel by diameter groups using aggregateBOQ ───
	const steelGroups = useMemo<SteelGroupAgg[]>(() => {
		const structItems = nonBlockItems;
		if (structItems.length === 0) return [];

		try {
			if (!boqResult) throw new Error("no boq");
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

			// حديد محسوب بالنِسَب (قباب/مآذن…) لا يظهر في طلبية المصنع لأنه
			// بلا أقطار — كان يسقط من التسعير كلياً، يُسعَّر الآن بسعر الحديد الرئيسي
			mainTons += (boqResult.unscheduledSteelWeight ?? 0) / 1000;

			// حديد الأساسات المعزول (إيبوكسي) يُسعَّر بسعره الخاص، فيُفصل
			// من مجموعات الأقطار بأطنانه الفعلية من نفس التقطيع المُحسَّن
			let isolatedTons = 0;
			if (hasIsolatedSteel) {
				for (const section of boqResult.sections) {
					for (const group of section.subGroups) {
						for (const detail of group.items) {
							if (!isIsolatedSteelItem(detail.item)) continue;
							const stocks = detail.recalc.totals.stocksNeeded;
							if (stocks.length === 0) {
								isolatedTons += detail.item.steelWeight / 1000;
								mainTons -= detail.item.steelWeight / 1000;
								continue;
							}
							for (const stock of stocks) {
								const tons =
									(stock.count *
										stock.length *
										(REBAR_WEIGHTS_MAP[stock.diameter] ?? 0)) /
									1000;
								isolatedTons += tons;
								if (stock.diameter === 6) d6Tons -= tons;
								else if (stock.diameter === 8) d8Tons -= tons;
								else mainTons -= tons;
							}
						}
					}
				}
			}

			const groups: SteelGroupAgg[] = [];
			if (isolatedTons > 0)
				groups.push({ label: ISOLATED_STEEL_LABEL, key: "isolated", tons: isolatedTons });
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
	}, [nonBlockItems, boqResult, hasIsolatedSteel]);

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
			if (bd.steelPriceIsolated != null)
				setSteelPriceIsolated(String(bd.steelPriceIsolated));
			if (bd.steelPriceMain != null) setSteelPriceMain(String(bd.steelPriceMain));
			else if (bd.steelPrice != null) {
				// Legacy: single steel price — apply to all groups
				const legacy = String(bd.steelPrice);
				setSteelPriceD6(legacy);
				setSteelPriceD8(legacy);
				setSteelPriceMain(legacy);
			}

			if (bd.storagePercent != null) setStoragePercent(String(bd.storagePercent));

			// البلوك والمونة والأعتاب
			if (bd.blockPrices) {
				const bp: Record<string, string> = {};
				for (const [k, v] of Object.entries(bd.blockPrices)) {
					bp[k] = String(v);
				}
				setBlockPrices(bp);
			}
			if (bd.mortarSandPrice != null) setMortarSandPrice(String(bd.mortarSandPrice));
			if (bd.mortarCementPrice != null) setMortarCementPrice(String(bd.mortarCementPrice));
			if (bd.lintelConcretePrice != null) setLintelConcretePrice(String(bd.lintelConcretePrice));
			if (bd.lintelSteelPrice != null) setLintelSteelPrice(String(bd.lintelSteelPrice));
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

	const getExtraQty = (key: string, autoQty: number) => {
		if (extraOverrides[key] != null && extraOverrides[key] !== "") {
			return Number(extraOverrides[key]) || 0;
		}
		return autoQty;
	};

	// ─── كميات البلوك والمونة والأعتاب الفعّالة ───
	const sandVolume = getExtraQty("mortar-sand", blockAgg.mortar.sandVolume);
	const cementBags = getExtraQty("mortar-cement", blockAgg.mortar.cementBags);
	const lintelConcrete = getExtraQty("lintel-concrete", blockAgg.lintels.concreteVolume);
	const lintelSteelTons = getExtraQty("lintel-steel", blockAgg.lintels.steelKg / 1000);

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
				sg.key === "isolated" ? Number(steelPriceIsolated) || 0 :
				sg.key === "d6" ? Number(steelPriceD6) || 0 :
				sg.key === "d8" ? Number(steelPriceD8) || 0 :
				Number(steelPriceMain) || 0;
			rows.push({
				key: `steel-${sg.key}`,
				label: sg.label,
				quantity: tons,
				unit: "طن",
				priceState:
					sg.key === "isolated" ? steelPriceIsolated :
					sg.key === "d6" ? steelPriceD6 :
					sg.key === "d8" ? steelPriceD8 :
					steelPriceMain,
				setPrice:
					sg.key === "isolated" ? setSteelPriceIsolated :
					sg.key === "d6" ? setSteelPriceD6 :
					sg.key === "d8" ? setSteelPriceD8 :
					setSteelPriceMain,
				total: tons * price,
			});
		}

		// ─── البلوك: صف لكل نوع ومقاس (مثلاً «بلوك 20 سم — عازل») ───
		for (const g of blockAgg.groups) {
			const count = getExtraQty(`block-${g.key}`, g.blockCount);
			const price = Number(blockPrices[g.key] ?? "") || 0;
			rows.push({
				key: `block-${g.key}`,
				label: g.label,
				quantity: count,
				unit: "حبة",
				priceState: blockPrices[g.key] ?? "",
				setPrice: (v: string) => setBlockPrices((p) => ({ ...p, [g.key]: v })),
				total: count * price,
			});
		}

		// ─── مونة البناء: متوسط بطحة وأسمنت لكل حبة بلوك (كمية تلقائية) ───
		if (blockAgg.totalBlockCount > 0) {
			const sandPrice = Number(mortarSandPrice) || 0;
			rows.push({
				key: "mortar-sand",
				label: "بطحة (رمل المونة)",
				quantity: sandVolume,
				unit: "م³",
				priceState: mortarSandPrice,
				setPrice: setMortarSandPrice,
				total: sandVolume * sandPrice,
			});

			const cementPrice = Number(mortarCementPrice) || 0;
			rows.push({
				key: "mortar-cement",
				label: "أسمنت المونة",
				quantity: cementBags,
				unit: "كيس",
				priceState: mortarCementPrice,
				setPrice: setMortarCementPrice,
				total: cementBags * cementPrice,
			});
		}

		// ─── أعتاب الأبواب والشبابيك (من الفتحات المدخلة) ───
		if (lintelConcrete > 0) {
			const price = Number(lintelConcretePrice) || 0;
			rows.push({
				key: "lintel-concrete",
				label: "خرسانة الأعتاب (أبواب وشبابيك)",
				quantity: lintelConcrete,
				unit: "م³",
				priceState: lintelConcretePrice,
				setPrice: setLintelConcretePrice,
				total: lintelConcrete * price,
			});
		}
		if (lintelSteelTons > 0) {
			const price = Number(lintelSteelPrice) || 0;
			rows.push({
				key: "lintel-steel",
				label: "حديد الأعتاب",
				quantity: lintelSteelTons,
				unit: "طن",
				priceState: lintelSteelPrice,
				setPrice: setLintelSteelPrice,
				total: lintelSteelTons * price,
			});
		}

		return rows;
	}, [
		concreteGrades,
		steelGroups,
		concretePrices,
		steelPriceD6,
		steelPriceD8,
		steelPriceMain,
		steelPriceIsolated,
		concreteOverrides,
		steelOverrides,
		blockAgg,
		blockPrices,
		mortarSandPrice,
		mortarCementPrice,
		lintelConcretePrice,
		lintelSteelPrice,
		sandVolume,
		cementBags,
		lintelConcrete,
		lintelSteelTons,
		extraOverrides,
	]);

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

		// Build block prices map (numbers) — مفتاح: نوع البلوك|السماكة
		const blockPricesNum: Record<string, number> = {};
		for (const [k, v] of Object.entries(blockPrices)) {
			blockPricesNum[k] = Number(v) || 0;
		}

		const sandPriceNum = Number(mortarSandPrice) || 0;
		const cementPriceNum = Number(mortarCementPrice) || 0;
		const lintelConcretePriceNum = Number(lintelConcretePrice) || 0;
		const lintelSteelPriceNum = Number(lintelSteelPrice) || 0;

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
				steelPriceIsolated: Number(steelPriceIsolated) || 0,
				// نسخة من حالة التفعيل حتى يقرأها تقرير التكلفة من الأسعار مباشرة
				hasIsolatedSteel,
				storagePercent: storagePct,
				blockPrices: blockPricesNum,
				mortarSandPrice: sandPriceNum,
				mortarCementPrice: cementPriceNum,
				lintelConcretePrice: lintelConcretePriceNum,
				lintelSteelPrice: lintelSteelPriceNum,
				// Keep legacy fields updated for backward compatibility
				concretePrice: Object.values(concretePricesNum)[0] ?? 0,
				steelPrice: Number(steelPriceMain) || 0,
			},
		});

		// 2. Distribute material costs across CostingItems with per-grade/per-diameter pricing
		const cItems = (costingItems as any[]) ?? [];
		if (cItems.length === 0) return;

		const structItems = (items as any[]) ?? [];

		// نفس دالة حساب تكلفة البند التي يستخدمها تقرير التكلفة والتسعير —
		// مصدر واحد يمنع اختلاف الأرقام بين التبويب والتقرير
		const itemPrices: MaterialPrices = {
			concretePrices: concretePricesNum,
			steelPriceD6: Number(steelPriceD6) || 0,
			steelPriceD8: Number(steelPriceD8) || 0,
			steelPriceMain: Number(steelPriceMain) || 0,
			steelPriceIsolated: Number(steelPriceIsolated) || 0,
			hasIsolatedSteel,
			blockPrices: blockPricesNum,
			mortarSandPrice: sandPriceNum,
			mortarCementPrice: cementPriceNum,
			lintelConcretePrice: lintelConcretePriceNum,
			lintelSteelPrice: lintelSteelPriceNum,
			storagePercent: storagePct,
		};

		const updateItems = buildMaterialCostUpdates(
			structItems as any,
			cItems as any,
			itemPrices,
			enabledFloors,
		);

		// Scale per-item costs so their sum matches materialSubtotal (without storage)
		let rawSum = 0;
		for (const ui of updateItems) {
			const ci = cItems.find((c: any) => c.id === ui.id);
			const ciQty = Number(ci?.quantity) || 1;
			rawSum += ui.materialUnitCost * ciQty;
		}
		const scaleFactor = rawSum > 0 ? materialSubtotal / rawSum : 0;
		const scaledItems = updateItems.map((ui: any) => ({
			...ui,
			materialUnitCost: ui.materialUnitCost * scaleFactor,
			storageCostPercent: storagePct,
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
								className="rounded-xl border border-chart-4 bg-chart-4/15 dark:bg-chart-4/20 dark:border-chart-4 p-3 min-w-[140px] flex-1 max-w-[200px]"
							>
								<div className="text-xs text-chart-4 dark:text-chart-4 font-medium mb-1">
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
											className="text-chart-4 hover:text-chart-4 transition-colors"
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
										className="rounded-xl border border-chart-1 bg-chart-1/15 dark:bg-chart-1/20 dark:border-chart-1 p-3 min-w-[140px] flex-1 max-w-[200px]"
									>
										<div className="text-xs text-chart-1 dark:text-chart-1 font-medium mb-1">
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
													className="text-chart-1 hover:text-chart-1 transition-colors"
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

				{blockAgg.groups.length > 0 && (
					<>
						<h4 className="font-medium text-sm text-muted-foreground mt-4">
							كميات البلوك
						</h4>
						<div className="flex flex-wrap gap-3">
							{blockAgg.groups.map((g) => {
								const count = getExtraQty(`block-${g.key}`, g.blockCount);
								const isEditing = editingCard === `block-${g.key}`;
								return (
									<div
										key={g.key}
										className="rounded-xl border border-chart-2 bg-chart-2/15 dark:bg-chart-2/20 dark:border-chart-2 p-3 min-w-[160px] flex-1 max-w-[220px]"
									>
										<div className="text-xs text-chart-2 dark:text-chart-2 font-medium mb-1">
											{g.label}
										</div>
										{isEditing ? (
											<div className="flex items-center gap-1">
												<Input
													type="number"
													className="h-7 w-20 text-sm rounded-lg"
													dir="ltr"
													autoFocus
													value={extraOverrides[`block-${g.key}`] ?? String(g.blockCount)}
													onChange={(e: any) =>
														setExtraOverrides((p) => ({
															...p,
															[`block-${g.key}`]: e.target.value,
														}))
													}
													onBlur={() => setEditingCard(null)}
													onKeyDown={(e: any) => e.key === "Enter" && setEditingCard(null)}
												/>
												<span className="text-xs text-muted-foreground">حبة</span>
											</div>
										) : (
											<div className="flex items-center justify-between">
												<span className="text-lg font-bold" dir="ltr">
													{formatNum(count)}{" "}
													<span className="text-xs font-normal">حبة</span>
												</span>
												<button
													type="button"
													onClick={() => setEditingCard(`block-${g.key}`)}
													className="text-chart-2 hover:text-chart-2 transition-colors"
												>
													<Pencil className="h-3.5 w-3.5" />
												</button>
											</div>
										)}
										<div className="text-[10px] text-muted-foreground mt-1" dir="ltr">
											{formatNum(g.netArea)} م² صافي
										</div>
									</div>
								);
							})}
						</div>

						<div className="rounded-xl border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground leading-relaxed">
							مونة البناء تُحسب تلقائياً بمتوسط{" "}
							<span className="font-medium text-foreground" dir="ltr">
								{SAND_VOLUME_PER_BLOCK.toFixed(5)} م³
							</span>{" "}
							بطحة و{" "}
							<span className="font-medium text-foreground" dir="ltr">
								{CEMENT_BAGS_PER_BLOCK.toFixed(4)} كيس
							</span>{" "}
							أسمنت لكل حبة بلوك — أدخل سعر متر البطحة وكيس الأسمنت في جدول
							الأسعار أدناه.
							{blockAgg.lintels.count > 0 && (
								<>
									{" "}
									والأعتاب محسوبة من{" "}
									<span className="font-medium text-foreground" dir="ltr">
										{formatNum(blockAgg.lintels.count)}
									</span>{" "}
									فتحة (أبواب وشبابيك) بطول إجمالي{" "}
									<span className="font-medium text-foreground" dir="ltr">
										{formatNum(blockAgg.lintels.length)} م
									</span>
									.
								</>
							)}
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
							<TableHead className="text-start font-medium">المادة</TableHead>
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
