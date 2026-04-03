"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Label } from "@ui/components/label";
import { Switch } from "@ui/components/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Loader2, Save, Settings2, Shield, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { calculateColumn } from "../../lib/calculations";
import { getRebarWeightPerMeter } from "../../lib/structural-calculations";
import { formatNumber } from "../../lib/utils";
import { BLOCK_TYPES, WALL_CATEGORIES } from "../../constants/blocks";
import { STOCK_LENGTHS } from "../../constants/prices";

// ═══════════════════════════════════════════════════════════════
// TYPES & OPTIONS
// ═══════════════════════════════════════════════════════════════

interface StructuralSpecsProps {
	organizationId: string;
	studyId: string;
}

interface ElementSpec {
	concreteType: string;
	steelGrade: string;
}

interface BlockSpec {
	blockType: string;
	thickness?: number;
}

interface SpecValues {
	elements: Record<string, ElementSpec>;
	steelBrand: string;
	hasIsolatedSteel: boolean;
	blockSpecs: Record<string, BlockSpec>;
}

// ═══════════════════════════════════════════════════════════════
// خيارات الخرسانة والحديد
// ═══════════════════════════════════════════════════════════════

const CONCRETE_OPTIONS = ["C15", "C20", "C25", "C30", "C35", "C40"];

// رتبة الحديد تلقائية Grade 60 لجميع العناصر
const DEFAULT_STEEL_GRADE = "60";

// ═══════════════════════════════════════════════════════════════
// العلامات التجارية للحديد
// ═══════════════════════════════════════════════════════════════

const STEEL_BRANDS = [
	{ value: "sabic", label: "سابك (SABIC)" },
	{ value: "rajhi", label: "حديد الراجحي (Al-Rajhi Steel)" },
	{ value: "yamamah", label: "حديد اليمامة (Yamamah Steel)" },
	{ value: "hadeed", label: "حديد (HADEED / ArcelorMittal)" },
	{ value: "riyadh", label: "حديد الرياض (Riyadh Steel)" },
	{ value: "jizan", label: "حديد جازان (Jizan Steel)" },
	{ value: "ittefaq", label: "حديد الاتفاق (Al-Ittefaq Steel)" },
	{ value: "tuwairqi", label: "حديد الطويرقي (Al-Tuwairqi)" },
	{ value: "other", label: "أخرى" },
];

// ═══════════════════════════════════════════════════════════════
// تعريف العناصر الإنشائية مع الاختيارات التلقائية
// ═══════════════════════════════════════════════════════════════

interface ElementRow {
	id: string;
	label: string;
	icon: string;
	defaultConcrete: string;
	hasConcrete: boolean;
}

const ELEMENT_ROWS: ElementRow[] = [
	{ id: "plainConcrete", label: "صبة النظافة / خرسانة عادية", icon: "🧱", defaultConcrete: "C15", hasConcrete: true },
	{ id: "foundations", label: "القواعد والأساسات", icon: "🏗️", defaultConcrete: "C30", hasConcrete: true },
	{ id: "columns", label: "الأعمدة", icon: "🏛️", defaultConcrete: "C35", hasConcrete: true },
	{ id: "beams", label: "الكمرات", icon: "📏", defaultConcrete: "C30", hasConcrete: true },
	{ id: "slabs", label: "البلاطات", icon: "⬛", defaultConcrete: "C30", hasConcrete: true },
	{ id: "stairs", label: "السلالم", icon: "🪜", defaultConcrete: "C30", hasConcrete: true },
];

function getDefaultElements(): Record<string, ElementSpec> {
	const elements: Record<string, ElementSpec> = {};
	for (const row of ELEMENT_ROWS) {
		elements[row.id] = {
			concreteType: row.defaultConcrete,
			steelGrade: DEFAULT_STEEL_GRADE,
		};
	}
	return elements;
}

const DEFAULT_SPECS: SpecValues = {
	elements: getDefaultElements(),
	steelBrand: "",
	hasIsolatedSteel: false,
	blockSpecs: {},
};

// ═══════════════════════════════════════════════════════════════
// HELPERS — حساب الرقاب (نسخ منطق ColumnsSection)
// ═══════════════════════════════════════════════════════════════

function calculateCuttingDetails(
	barLength: number,
	barCount: number,
	diameter: number,
) {
	const stockLength = STOCK_LENGTHS[diameter] || 12;
	const cutsPerStock = Math.floor(stockLength / barLength) || 1;
	const stocksNeeded = Math.ceil(barCount / cutsPerStock);
	const totalLength = barCount * barLength;
	const grossLength = stocksNeeded * stockLength;
	const weight = totalLength * getRebarWeightPerMeter(diameter);

	return {
		diameter,
		barLength,
		barCount,
		stocksNeeded,
		weight: Number(weight.toFixed(2)),
		stockLength,
		grossWeight: Number((stocksNeeded * stockLength * getRebarWeightPerMeter(diameter)).toFixed(2)),
	};
}

function computeNeckCalc(params: {
	quantity: number;
	width: number;
	depth: number;
	height: number;
	mainBarsCount: number;
	mainBarDiameter: number;
	stirrupDiameter: number;
	stirrupSpacing: number;
	concreteType: string;
}) {
	const baseCalc = calculateColumn(params);

	const mainBarLength = params.height + 0.8;
	const widthM = params.width / 100;
	const depthM = params.depth / 100;
	const stirrupPerimeter = 2 * (widthM + depthM - 0.08) + 0.3;
	const stirrupsCount =
		Math.ceil((params.height * 1000) / params.stirrupSpacing) + 1;

	const cuttingDetails = [
		calculateCuttingDetails(
			mainBarLength,
			params.mainBarsCount * params.quantity,
			params.mainBarDiameter,
		),
		calculateCuttingDetails(
			stirrupPerimeter,
			stirrupsCount * params.quantity,
			params.stirrupDiameter,
		),
	];

	const grossWeight = cuttingDetails.reduce(
		(sum, d) => sum + d.grossWeight,
		0,
	);

	return {
		concreteVolume: baseCalc.concreteVolume,
		grossWeight,
	};
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export function StructuralSpecs({
	organizationId,
	studyId,
}: StructuralSpecsProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [specs, setSpecs] = useState<SpecValues>(DEFAULT_SPECS);
	const [isDirty, setIsDirty] = useState(false);

	// جلب المواصفات المحفوظة
	const { data, isLoading } = useQuery(
		orpc.pricing.studies.structuralSpecs.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// جلب العناصر الإنشائية (للحديد المعزول والبلوك)
	const { data: structuralItems } = useQuery(
		orpc.pricing.studies.getStructuralItems.queryOptions({
			input: { organizationId, costStudyId: studyId },
		}),
	);

	useEffect(() => {
		if (data) {
			const d = data as Record<string, any>;
			setSpecs({
				elements: d.elements ?? getDefaultElements(),
				steelBrand: d.steelBrand ?? "",
				hasIsolatedSteel: d.hasIsolatedSteel ?? false,
				blockSpecs: d.blockSpecs ?? {},
			});
		}
	}, [data]);

	const saveMutation = useMutation(
		orpc.pricing.studies.structuralSpecs.set.mutationOptions({
			onSuccess: () => {
				toast.success(t("pricing.pipeline.specsSaved"));
				setIsDirty(false);
				queryClient.invalidateQueries({
					queryKey: [["pricing", "studies", "structuralSpecs"]],
				});
			},
			onError: (e: any) => toast.error(e.message || "حدث خطأ"),
		}),
	);

	// ─── حساب كميات الحديد المعزول ───

	const isolatedSteelQuantities = useMemo(() => {
		if (!structuralItems || !specs.hasIsolatedSteel) return null;

		const items = structuralItems as Array<{
			category: string;
			subCategory?: string | null;
			steelWeight: number;
			quantity: number;
			dimensions: Record<string, number>;
			concreteVolume: number;
		}>;

		// القواعد
		const foundationSteel = items
			.filter((i) => i.category === "foundations")
			.reduce((sum, i) => sum + (i.steelWeight || 0), 0);

		// الميدة
		const groundBeamSteel = items
			.filter((i) => i.category === "beams" && i.subCategory === "groundBeam")
			.reduce((sum, i) => sum + (i.steelWeight || 0), 0);

		// الرقاب — حساب من أعمدة الدور الأرضي
		const groundColumns = items.filter(
			(i) => i.category === "columns" && (i.subCategory === "ground" || !i.subCategory),
		);
		let neckSteel = 0;
		groundColumns.forEach((col) => {
			const calc = computeNeckCalc({
				quantity: col.quantity || 1,
				width: col.dimensions?.width || 30,
				depth: col.dimensions?.depth || 30,
				height: 1, // ارتفاع رقبة افتراضي 1م
				mainBarsCount: col.dimensions?.mainBarsCount || 8,
				mainBarDiameter: col.dimensions?.mainBarDiameter || 16,
				stirrupDiameter: col.dimensions?.stirrupDiameter || 8,
				stirrupSpacing: col.dimensions?.stirrupSpacing || 150,
				concreteType: specs.elements?.columns?.concreteType || "C35",
			});
			neckSteel += calc.grossWeight;
		});

		return {
			foundations: Number(foundationSteel.toFixed(2)),
			groundBeam: Number(groundBeamSteel.toFixed(2)),
			necks: Number(neckSteel.toFixed(2)),
		};
	}, [structuralItems, specs.hasIsolatedSteel, specs.elements]);

	// ─── بيانات البلوك مجمعة حسب تصنيف الجدار ───

	const blockData = useMemo(() => {
		if (!structuralItems) return [];

		const items = structuralItems as Array<{
			category: string;
			subCategory?: string | null;
			dimensions: Record<string, any>;
			quantity: number;
		}>;

		const blockItems = items.filter((i) => i.category === "blocks");
		if (blockItems.length === 0) return [];

		// تجميع حسب subCategory (wallCategory)
		const grouped: Record<string, { count: number; thickness: number; blockType: string }> = {};
		blockItems.forEach((item) => {
			const cat = item.subCategory || "internal";
			if (!grouped[cat]) {
				grouped[cat] = {
					count: 0,
					thickness: item.dimensions?.thickness || 20,
					blockType: item.dimensions?.blockType || WALL_CATEGORIES[cat as keyof typeof WALL_CATEGORIES]?.defaultBlockType || "hollow",
				};
			}
			grouped[cat].count += 1;
		});

		return Object.entries(grouped).map(([category, info]) => ({
			category,
			categoryInfo: WALL_CATEGORIES[category as keyof typeof WALL_CATEGORIES],
			count: info.count,
			thickness: info.thickness,
			blockType: specs.blockSpecs[category]?.blockType || info.blockType,
		}));
	}, [structuralItems, specs.blockSpecs]);

	// ─── Handlers ───

	const handleElementChange = useCallback(
		(elementId: string, field: "concreteType", value: string) => {
			setSpecs((prev) => ({
				...prev,
				elements: {
					...prev.elements,
					[elementId]: {
						...prev.elements[elementId],
						[field]: value,
					},
				},
			}));
			setIsDirty(true);
		},
		[],
	);

	const handleSteelBrandChange = useCallback((value: string) => {
		setSpecs((prev) => ({ ...prev, steelBrand: value }));
		setIsDirty(true);
	}, []);

	const handleIsolatedSteelChange = useCallback((checked: boolean) => {
		setSpecs((prev) => ({ ...prev, hasIsolatedSteel: checked }));
		setIsDirty(true);
	}, []);

	const handleBlockSpecChange = useCallback((category: string, blockType: string) => {
		setSpecs((prev) => ({
			...prev,
			blockSpecs: {
				...prev.blockSpecs,
				[category]: {
					...prev.blockSpecs[category],
					blockType,
				},
			},
		}));
		setIsDirty(true);
	}, []);

	const handleSave = () => {
		(saveMutation as any).mutate({
			organizationId,
			studyId,
			specs,
		});
	};

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		);
	}

	return (
		<Card dir="rtl">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Settings2 className="h-5 w-5 text-amber-600" />
						<CardTitle className="text-base">مواصفات المواد الانشائية</CardTitle>
					</div>
					<Button
						size="sm"
						onClick={handleSave}
						disabled={!isDirty || saveMutation.isPending}
						className="gap-1.5"
					>
						{saveMutation.isPending ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Save className="h-3.5 w-3.5" />
						)}
						{t("pricing.pipeline.specsSave")}
					</Button>
				</div>
				<p className="text-sm text-muted-foreground">
					اختيارات تلقائية بحسب نوع العنصر — يمكنك تعديلها
				</p>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* ═══ القسم أ: مواصفات الخرسانة والحديد ═══ */}
				<div className="border rounded-lg overflow-hidden">
					<table className="w-full">
						<thead>
							<tr className="bg-muted/50 text-sm">
								<th className="text-right py-2.5 px-4 font-medium">العنصر الإنشائي</th>
								<th className="text-center py-2.5 px-4 font-medium">نوع الخرسانة</th>
							</tr>
						</thead>
						<tbody>
							{ELEMENT_ROWS.map((row, idx) => (
								<tr
									key={row.id}
									className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
								>
									<td className="py-2.5 px-4">
										<div className="flex items-center gap-2">
											<span className="text-lg">{row.icon}</span>
											<span className="font-medium text-sm">{row.label}</span>
										</div>
									</td>
									<td className="py-2 px-4">
										{row.hasConcrete ? (
											<div className="flex justify-center">
												<Select
													value={specs.elements[row.id]?.concreteType || row.defaultConcrete}
													onValueChange={(val: any) => handleElementChange(row.id, "concreteType", val)}
												>
													<SelectTrigger className="w-28 h-8 text-center text-sm">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														{CONCRETE_OPTIONS.map((c) => (
															<SelectItem key={c} value={c}>{c}</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>
										) : (
											<p className="text-center text-xs text-muted-foreground">—</p>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* ═══ القسم ب: نوع الحديد ═══ */}
				<div className="border rounded-lg p-4 space-y-4">
					<div className="flex items-center gap-2">
						<Shield className="h-4 w-4 text-blue-600" />
						<h3 className="font-medium text-sm">نوع الحديد</h3>
					</div>

					{/* العلامة التجارية */}
					<div className="space-y-2">
						<Label className="text-sm">العلامة التجارية للحديد</Label>
						<Select
							value={specs.steelBrand || undefined}
							onValueChange={handleSteelBrandChange}
						>
							<SelectTrigger className="w-72 h-9">
								<SelectValue placeholder="اختر العلامة التجارية" />
							</SelectTrigger>
							<SelectContent>
								{STEEL_BRANDS.map((brand) => (
									<SelectItem key={brand.value} value={brand.value}>
										{brand.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* الحديد المعزول */}
					<div className="space-y-3">
						<div className="flex items-center gap-3">
							<Switch
								id="isolated-steel"
								checked={specs.hasIsolatedSteel}
								onCheckedChange={handleIsolatedSteelChange}
							/>
							<Label htmlFor="isolated-steel" className="text-sm cursor-pointer">
								هل يوجد حديد معزول (إيبوكسي) بالأساسات؟
							</Label>
						</div>

						{specs.hasIsolatedSteel && isolatedSteelQuantities && (
							<div className="border rounded-lg overflow-hidden bg-blue-50/30">
								<table className="w-full text-sm">
									<thead>
										<tr className="bg-blue-100/50">
											<th className="text-right py-2 px-4 font-medium">العنصر</th>
											<th className="text-center py-2 px-4 font-medium">كمية الحديد (كجم)</th>
										</tr>
									</thead>
									<tbody>
										<tr className="border-t">
											<td className="py-2 px-4">القواعد</td>
											<td className="py-2 px-4 text-center font-medium">
												{formatNumber(isolatedSteelQuantities.foundations)}
											</td>
										</tr>
										<tr className="border-t bg-muted/10">
											<td className="py-2 px-4">الميدة</td>
											<td className="py-2 px-4 text-center font-medium">
												{formatNumber(isolatedSteelQuantities.groundBeam)}
											</td>
										</tr>
										<tr className="border-t">
											<td className="py-2 px-4">الرقاب</td>
											<td className="py-2 px-4 text-center font-medium">
												{formatNumber(isolatedSteelQuantities.necks)}
											</td>
										</tr>
										<tr className="border-t bg-blue-100/30 font-bold">
											<td className="py-2 px-4">الإجمالي</td>
											<td className="py-2 px-4 text-center">
												{formatNumber(
													isolatedSteelQuantities.foundations +
													isolatedSteelQuantities.groundBeam +
													isolatedSteelQuantities.necks
												)}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						)}

						{specs.hasIsolatedSteel && !isolatedSteelQuantities && (
							<p className="text-sm text-muted-foreground bg-muted/30 rounded p-3">
								لم يتم إدخال بيانات الكميات بعد — ستظهر الكميات تلقائياً بعد إدخالها
							</p>
						)}
					</div>
				</div>

				{/* ═══ القسم ج: مواصفات البلوك ═══ */}
				<div className="border rounded-lg p-4 space-y-4">
					<div className="flex items-center gap-2">
						<Package className="h-4 w-4 text-orange-600" />
						<h3 className="font-medium text-sm">مواصفات البلوك</h3>
					</div>

					{blockData.length > 0 ? (
						<div className="border rounded-lg overflow-hidden">
							<table className="w-full text-sm">
								<thead>
									<tr className="bg-muted/50">
										<th className="text-right py-2.5 px-4 font-medium">تصنيف الجدار</th>
										<th className="text-center py-2.5 px-4 font-medium">نوع البلوك</th>
										<th className="text-center py-2.5 px-4 font-medium">السماكة</th>
									</tr>
								</thead>
								<tbody>
									{blockData.map((block, idx) => (
										<tr
											key={block.category}
											className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
										>
											<td className="py-2.5 px-4">
												<div className="flex items-center gap-2">
													<span>{block.categoryInfo?.icon || "🧱"}</span>
													<span className="font-medium">
														{block.categoryInfo?.nameAr || block.category}
													</span>
													<span className="text-xs text-muted-foreground">
														({block.count} عنصر)
													</span>
												</div>
											</td>
											<td className="py-2 px-4">
												<div className="flex justify-center">
													<Select
														value={block.blockType}
														onValueChange={(val: any) => handleBlockSpecChange(block.category, val)}
													>
														<SelectTrigger className="w-48 h-8 text-sm">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{Object.entries(BLOCK_TYPES).map(([key, value]) => (
																<SelectItem key={key} value={key}>
																	{value.nameAr}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
											</td>
											<td className="py-2 px-4 text-center text-muted-foreground">
												{block.thickness} سم
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p className="text-sm text-muted-foreground bg-muted/30 rounded p-3 text-center">
							لم يتم إدخال بيانات البلوك في مرحلة الكميات
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
