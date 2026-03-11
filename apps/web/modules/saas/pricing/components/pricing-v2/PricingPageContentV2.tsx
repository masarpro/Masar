"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { cn } from "@ui/lib";
import {
	Calculator,
	CheckCircle2,
	ChevronDown,
	ChevronLeft,
	DollarSign,
	Loader2,
	Lock,
	Percent,
	Ruler,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LumpSumAnalysisSection } from "./LumpSumAnalysisSection";
import { ProfitAnalysisCard } from "./ProfitAnalysisCard";

interface PricingPageContentV2Props {
	organizationId: string;
	organizationSlug: string;
	studyId: string;
}

type MarkupMethod = "uniform" | "per_section" | "manual_price" | "per_sqm";

const SECTION_LABELS: Record<string, string> = {
	STRUCTURAL: "إنشائي",
	FINISHING: "تشطيبات",
	MEP: "كهروميكانيكية",
	LABOR: "عمالة عامة",
	MANUAL: "بنود يدوية",
};

const formatNum = (n: number) =>
	Number(n).toLocaleString("ar-SA", { maximumFractionDigits: 2 });

export function PricingPageContentV2({
	organizationId,
	organizationSlug,
	studyId,
}: PricingPageContentV2Props) {
	const queryClient = useQueryClient();

	// ─── Queries ──────────────────────────────────────────────────

	const { data: stagesData, isLoading: stagesLoading } = useQuery(
		orpc.pricing.studies.studyStages.get.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const { data: markupSettings } = useQuery(
		orpc.pricing.studies.markup.getSettings.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const { data: profitData, isLoading: profitLoading } = useQuery(
		orpc.pricing.studies.markup.getProfitAnalysis.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const { data: costingItems } = useQuery(
		orpc.pricing.studies.costing.getItems.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	const { data: studyData } = useQuery(
		orpc.pricing.studies.getById.queryOptions({
			input: { id: studyId, organizationId },
		}),
	);

	// ─── Local state ──────────────────────────────────────────────

	const [method, setMethod] = useState<MarkupMethod>("uniform");

	// Uniform
	const [overheadPct, setOverheadPct] = useState("");
	const [profitPct, setProfitPct] = useState("");
	const [contingencyPct, setContingencyPct] = useState("");
	const [vatIncluded, setVatIncluded] = useState(true);

	// Per-section
	const [sectionMarkups, setSectionMarkups] = useState<Record<string, string>>(
		{},
	);

	// Manual price
	const [manualPrice, setManualPrice] = useState("");

	// Per sqm
	const [pricePerSqmInput, setPricePerSqmInput] = useState("");

	// Per-item overrides
	const [itemPriceOverrides, setItemPriceOverrides] = useState<
		Record<string, string>
	>({});
	const [itemsExpanded, setItemsExpanded] = useState(false);

	// ─── Derived values ───────────────────────────────────────────

	const stages = (stagesData as any)?.stages ?? [];
	const costingStage = stages.find((s: { stage: string }) => s.stage === "COSTING");
	const isCostingApproved = costingStage?.status === "APPROVED";

	const totalCost = (profitData as any)?.totalCost ?? 0;
	const buildingArea =
		(markupSettings as any)?.buildingArea ?? (studyData as any)?.buildingArea ?? 0;
	const costPerSqm = buildingArea > 0 ? totalCost / buildingArea : 0;

	const ms = markupSettings as any;
	const overhead = overheadPct
		? Number(overheadPct)
		: (ms?.uniformSettings?.overheadPercent ?? 5);
	const profit = profitPct
		? Number(profitPct)
		: (ms?.uniformSettings?.profitPercent ?? 15);
	const contingency = contingencyPct
		? Number(contingencyPct)
		: (ms?.uniformSettings?.contingencyPercent ?? 2);
	const isVat =
		vatIncluded || (ms?.uniformSettings?.vatIncluded ?? true);

	// Manual price calculations
	const manualPriceNum = manualPrice ? Number(manualPrice) : 0;
	const manualMarkupPct =
		totalCost > 0 ? ((manualPriceNum - totalCost) / totalCost) * 100 : 0;
	const manualOverhead = totalCost > 0 ? manualPriceNum * 0.05 : 0;
	const manualProfit = manualPriceNum - totalCost - manualOverhead;

	// Per sqm calculations
	const sqmPriceNum = pricePerSqmInput ? Number(pricePerSqmInput) : 0;
	const sqmTotalPrice = sqmPriceNum * buildingArea;
	const sqmMarkupPct =
		totalCost > 0 ? ((sqmTotalPrice - totalCost) / totalCost) * 100 : 0;

	// Uniform markup factor
	const uniformMarkupFactor = 1 + (overhead + profit + contingency) / 100;

	// Items with calculated selling prices
	const itemsWithPrices = useMemo(() => {
		const items = (costingItems as any[]) ?? [];
		return items.map((item: any) => {
			const cost = Number(item.totalCost ?? 0);
			let calculatedPrice = cost;

			if (method === "uniform") {
				calculatedPrice = cost * uniformMarkupFactor;
			} else if (method === "per_section") {
				const sections = (profitData as any)?.sections ?? [];
				const sec = sections.find((s: any) => s.section === item.section);
				const pct = sectionMarkups[item.section]
					? Number(sectionMarkups[item.section])
					: (sec?.markupPercent ?? 0);
				calculatedPrice = cost * (1 + pct / 100);
			} else if (method === "manual_price" && totalCost > 0) {
				calculatedPrice = cost * (manualPriceNum / totalCost);
			} else if (method === "per_sqm" && totalCost > 0) {
				calculatedPrice = cost * (sqmTotalPrice / totalCost);
			}

			const overrideVal = itemPriceOverrides[item.id];
			const sellingPrice =
				overrideVal !== undefined && overrideVal !== ""
					? Number(overrideVal)
					: calculatedPrice;

			return {
				...item,
				cost,
				calculatedPrice,
				sellingPrice,
				hasOverride:
					overrideVal !== undefined && overrideVal !== "",
			};
		});
	}, [
		costingItems,
		method,
		uniformMarkupFactor,
		profitData,
		sectionMarkups,
		manualPriceNum,
		sqmTotalPrice,
		totalCost,
		itemPriceOverrides,
	]);

	// Seed initial values from server data
	useEffect(() => {
		if (ms?.uniformSettings) {
			const s = ms.uniformSettings;
			if (!overheadPct) setOverheadPct(String(s.overheadPercent ?? ""));
			if (!profitPct) setProfitPct(String(s.profitPercent ?? ""));
			if (!contingencyPct)
				setContingencyPct(String(s.contingencyPercent ?? ""));
			setVatIncluded(s.vatIncluded ?? true);
		}
	}, [markupSettings]);

	// ─── Mutations ────────────────────────────────────────────────

	const uniformMutation = useMutation(
		orpc.pricing.studies.markup.setUniform.mutationOptions({
			onSuccess: () => {
				toast.success("تم حفظ إعدادات الهامش");
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "markup"],
				});
			},
			onError: () => {
				toast.error("حدث خطأ أثناء الحفظ");
			},
		}),
	);

	const sectionMutation = useMutation(
		orpc.pricing.studies.markup.setSectionMarkups.mutationOptions({
			onSuccess: () => {
				toast.success("تم حفظ هوامش الأقسام");
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "markup"],
				});
			},
			onError: () => {
				toast.error("حدث خطأ أثناء الحفظ");
			},
		}),
	);

	const approveMutation = useMutation(
		orpc.pricing.studies.studyStages.approve.mutationOptions({
			onSuccess: () => {
				toast.success("تم اعتماد مرحلة التسعير");
				queryClient.invalidateQueries({
					queryKey: ["pricing", "studies", "studyStages"],
				});
			},
		}),
	);

	// ─── Handlers ─────────────────────────────────────────────────

	const handleSaveUniform = () => {
		(uniformMutation as any).mutate({
			organizationId,
			studyId,
			overheadPercent: overhead,
			profitPercent: profit,
			contingencyPercent: contingency,
			vatIncluded: isVat,
		});
	};

	const handleSaveSections = () => {
		const sections = (profitData as any)?.sections ?? [];
		const markups = sections.map((s: any) => ({
			section: s.section,
			markupPercent: sectionMarkups[s.section]
				? Number(sectionMarkups[s.section])
				: s.markupPercent,
		}));
		(sectionMutation as any).mutate({
			organizationId,
			studyId,
			markups,
		});
	};

	const handleSaveManualPrice = () => {
		if (!manualPriceNum || manualPriceNum <= 0) {
			toast.error("يرجى إدخال سعر بيع صحيح");
			return;
		}
		const effectiveMarkup = manualMarkupPct;
		(uniformMutation as any).mutate({
			organizationId,
			studyId,
			overheadPercent: Math.max(effectiveMarkup * 0.25, 0),
			profitPercent: Math.max(effectiveMarkup * 0.65, 0),
			contingencyPercent: Math.max(effectiveMarkup * 0.1, 0),
			vatIncluded: isVat,
		});
	};

	const handleSavePerSqm = () => {
		if (!sqmPriceNum || sqmPriceNum <= 0) {
			toast.error("يرجى إدخال سعر المتر المربع");
			return;
		}
		const effectiveMarkup = sqmMarkupPct;
		(uniformMutation as any).mutate({
			organizationId,
			studyId,
			overheadPercent: Math.max(effectiveMarkup * 0.25, 0),
			profitPercent: Math.max(effectiveMarkup * 0.65, 0),
			contingencyPercent: Math.max(effectiveMarkup * 0.1, 0),
			vatIncluded: isVat,
		});
	};

	// ─── Loading & guard ──────────────────────────────────────────

	if (stagesLoading) return null;

	if (!isCostingApproved) {
		return (
			<div
				className="flex flex-col items-center justify-center py-16 text-center"
				dir="rtl"
			>
				<div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 mb-4">
					<Lock className="h-10 w-10 text-amber-500" />
				</div>
				<h3 className="text-lg font-semibold mb-2">مرحلة التسعير مقفلة</h3>
				<p className="text-muted-foreground mb-4 max-w-md">
					يجب اعتماد مرحلة تسعير التكلفة أولاً قبل البدء في التسعير
				</p>
				<Button asChild variant="outline" className="rounded-xl">
					<Link
						href={`/app/${organizationSlug}/pricing/studies/${studyId}/costing`}
					>
						الرجوع لتسعير التكلفة
					</Link>
				</Button>
			</div>
		);
	}

	// ─── Method definitions ───────────────────────────────────────

	const methodOptions: {
		key: MarkupMethod;
		label: string;
		icon: React.ReactNode;
		desc: string;
	}[] = [
		{
			key: "uniform",
			label: "نسبة موحدة",
			icon: <Percent className="h-4 w-4" />,
			desc: "مصاريف عامة + ربح + احتياطي",
		},
		{
			key: "per_section",
			label: "نسبة لكل قسم",
			icon: <TrendingUp className="h-4 w-4" />,
			desc: "هامش مختلف حسب القسم",
		},
		{
			key: "manual_price",
			label: "سعر بيع يدوي",
			icon: <DollarSign className="h-4 w-4" />,
			desc: "أدخل سعر البيع المطلوب",
		},
		{
			key: "per_sqm",
			label: "سعر المتر المربع",
			icon: <Ruler className="h-4 w-4" />,
			desc: "حدد سعر بيع المتر",
		},
	];

	// ─── Render ───────────────────────────────────────────────────

	return (
		<div className="space-y-6" dir="rtl">
			{/* ═══ Hero cost summary card ═══ */}
			<div className="rounded-2xl bg-gradient-to-bl from-primary/15 via-primary/5 to-background border border-primary/20 p-6">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground font-medium">
							إجمالي التكلفة المحسوبة
						</p>
						<p className="text-3xl font-bold text-primary" dir="ltr">
							{profitData ? `${formatNum(totalCost)} ر.س` : "—"}
						</p>
					</div>
					<div className="flex gap-6">
						{buildingArea > 0 && (
							<div className="text-center">
								<p className="text-xs text-muted-foreground mb-1">
									تكلفة المتر المربع
								</p>
								<p className="text-lg font-semibold" dir="ltr">
									{formatNum(costPerSqm)} ر.س/م²
								</p>
							</div>
						)}
						{buildingArea > 0 && (
							<div className="text-center">
								<p className="text-xs text-muted-foreground mb-1">
									مساحة البناء
								</p>
								<p className="text-lg font-semibold" dir="ltr">
									{formatNum(buildingArea)} م²
								</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ═══ Markup method selector ═══ */}
			<div className="rounded-xl border border-border bg-card p-4">
				<Label className="text-sm font-medium mb-3 block">طريقة التسعير</Label>
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
					{methodOptions.map((opt) => (
						<button
							key={opt.key}
							type="button"
							onClick={() => setMethod(opt.key)}
							className={cn(
								"flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all text-center",
								method === opt.key
									? "border-primary bg-primary/5 text-primary shadow-sm"
									: "border-border hover:border-muted-foreground/30",
							)}
						>
							{opt.icon}
							<span className="font-semibold text-xs">{opt.label}</span>
							<span className="text-[10px] text-muted-foreground leading-tight">
								{opt.desc}
							</span>
						</button>
					))}
				</div>
			</div>

			{/* ═══ Method: Uniform ═══ */}
			{method === "uniform" && (
				<div className="rounded-xl border border-border bg-card p-4 space-y-4">
					<div className="flex items-center gap-2 mb-2">
						<Percent className="h-4 w-4 text-primary" />
						<h4 className="font-semibold text-sm">نسبة موحدة على إجمالي التكلفة</h4>
					</div>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						<div className="space-y-1">
							<Label className="text-xs">مصاريف عامة (%)</Label>
							<Input
								type="number"
								className="h-9 rounded-lg"
								dir="ltr"
								placeholder="5"
								value={overheadPct}
								onChange={(e: any) => setOverheadPct(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">هامش الربح (%)</Label>
							<Input
								type="number"
								className="h-9 rounded-lg"
								dir="ltr"
								placeholder="15"
								value={profitPct}
								onChange={(e: any) => setProfitPct(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">احتياطي (%)</Label>
							<Input
								type="number"
								className="h-9 rounded-lg"
								dir="ltr"
								placeholder="2"
								value={contingencyPct}
								onChange={(e: any) => setContingencyPct(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs">ضريبة القيمة المضافة</Label>
							<label className="flex items-center gap-2 h-9 cursor-pointer">
								<input
									type="checkbox"
									checked={vatIncluded || isVat}
									onChange={(e: any) => setVatIncluded(e.target.checked)}
									className="rounded"
								/>
								<span className="text-sm">تشمل (15%)</span>
							</label>
						</div>
					</div>
					{/* Live preview */}
					<div className="rounded-lg bg-muted/30 p-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
						<div>
							<span className="text-muted-foreground text-xs">إجمالي الهامش</span>
							<p className="font-semibold" dir="ltr">
								{formatNum(overhead + profit + contingency)}%
							</p>
						</div>
						<div>
							<span className="text-muted-foreground text-xs">سعر البيع التقديري</span>
							<p className="font-semibold" dir="ltr">
								{formatNum(totalCost * uniformMarkupFactor)} ر.س
							</p>
						</div>
						{buildingArea > 0 && (
							<div>
								<span className="text-muted-foreground text-xs">سعر المتر التقديري</span>
								<p className="font-semibold" dir="ltr">
									{formatNum((totalCost * uniformMarkupFactor) / buildingArea)} ر.س/م²
								</p>
							</div>
						)}
					</div>
					<div className="flex justify-end">
						<Button
							onClick={handleSaveUniform}
							disabled={uniformMutation.isPending}
							className="gap-2 rounded-xl"
							size="sm"
						>
							{uniformMutation.isPending && (
								<Loader2 className="h-4 w-4 animate-spin" />
							)}
							حفظ الإعدادات
						</Button>
					</div>
				</div>
			)}

			{/* ═══ Method: Per-section ═══ */}
			{method === "per_section" && (
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<div className="flex items-center gap-2 p-4 pb-2">
						<TrendingUp className="h-4 w-4 text-primary" />
						<h4 className="font-semibold text-sm">هامش مخصص لكل قسم</h4>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/30 text-muted-foreground">
									<th className="px-4 py-3 text-right font-medium">القسم</th>
									<th className="px-4 py-3 text-center font-medium">التكلفة</th>
									<th className="px-4 py-3 text-center font-medium">
										نسبة الهامش (%)
									</th>
									<th className="px-4 py-3 text-center font-medium">
										سعر البيع
									</th>
								</tr>
							</thead>
							<tbody>
								{((profitData as any)?.sections ?? []).map((sec: any) => {
									const markupPct = sectionMarkups[sec.section]
										? Number(sectionMarkups[sec.section])
										: sec.markupPercent;
									const sellingPrice = sec.cost * (1 + markupPct / 100);

									return (
										<tr
											key={sec.section}
											className="border-b last:border-0 hover:bg-muted/20"
										>
											<td className="px-4 py-3 font-medium">
												{SECTION_LABELS[sec.section] ?? sec.section}
											</td>
											<td className="px-4 py-3 text-center" dir="ltr">
												{formatNum(sec.cost)}
											</td>
											<td className="px-4 py-3">
												<Input
													type="number"
													className="h-8 w-20 mx-auto text-center rounded-lg"
													dir="ltr"
													placeholder="15"
													value={
														sectionMarkups[sec.section] ??
														String(sec.markupPercent)
													}
													onChange={(e: any) =>
														setSectionMarkups((prev) => ({
															...prev,
															[sec.section]: e.target.value,
														}))
													}
												/>
											</td>
											<td
												className="px-4 py-3 text-center font-medium"
												dir="ltr"
											>
												{formatNum(sellingPrice)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<div className="p-3 border-t border-border flex justify-end">
						<Button
							onClick={handleSaveSections}
							disabled={sectionMutation.isPending}
							className="gap-2 rounded-xl"
							size="sm"
						>
							{sectionMutation.isPending && (
								<Loader2 className="h-4 w-4 animate-spin" />
							)}
							حفظ الهوامش
						</Button>
					</div>
				</div>
			)}

			{/* ═══ Method: Manual price ═══ */}
			{method === "manual_price" && (
				<div className="rounded-xl border border-border bg-card p-4 space-y-4">
					<div className="flex items-center gap-2 mb-2">
						<DollarSign className="h-4 w-4 text-primary" />
						<h4 className="font-semibold text-sm">
							أدخل سعر البيع المطلوب (قبل الضريبة)
						</h4>
					</div>
					<div className="max-w-sm space-y-1">
						<Label className="text-xs">سعر البيع الإجمالي (ر.س)</Label>
						<Input
							type="number"
							className="h-10 rounded-lg text-lg"
							dir="ltr"
							placeholder="0"
							value={manualPrice}
							onChange={(e: any) => setManualPrice(e.target.value)}
						/>
					</div>

					{manualPriceNum > 0 && totalCost > 0 && (
						<div className="rounded-lg bg-muted/30 p-4 space-y-3 text-sm">
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">إجمالي التكلفة</span>
								<span className="font-medium" dir="ltr">
									{formatNum(totalCost)} ر.س
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">سعر البيع المطلوب</span>
								<span className="font-semibold text-primary" dir="ltr">
									{formatNum(manualPriceNum)} ر.س
								</span>
							</div>
							<div className="border-t border-border pt-2 flex items-center justify-between">
								<span className="text-muted-foreground">
									نسبة الهامش المحسوبة
								</span>
								<span
									className={cn(
										"font-bold text-lg",
										manualMarkupPct >= 0 ? "text-emerald-600" : "text-red-600",
									)}
									dir="ltr"
								>
									{formatNum(manualMarkupPct)}%
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">
									مصاريف عامة تقديرية (25%)
								</span>
								<span dir="ltr">{formatNum(manualOverhead)} ر.س</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">
									صافي الربح التقديري
								</span>
								<span
									className={cn(
										"font-medium",
										manualProfit >= 0 ? "text-emerald-600" : "text-red-600",
									)}
									dir="ltr"
								>
									{formatNum(manualProfit)} ر.س
								</span>
							</div>
							{buildingArea > 0 && (
								<div className="flex items-center justify-between">
									<span className="text-muted-foreground">
										سعر المتر المربع
									</span>
									<span className="font-medium" dir="ltr">
										{formatNum(manualPriceNum / buildingArea)} ر.س/م²
									</span>
								</div>
							)}
						</div>
					)}

					<div className="flex items-center gap-3">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={vatIncluded || isVat}
								onChange={(e: any) => setVatIncluded(e.target.checked)}
								className="rounded"
							/>
							<span className="text-sm">تشمل ضريبة القيمة المضافة (15%)</span>
						</label>
					</div>

					<div className="flex justify-end">
						<Button
							onClick={handleSaveManualPrice}
							disabled={uniformMutation.isPending || manualPriceNum <= 0}
							className="gap-2 rounded-xl"
							size="sm"
						>
							{uniformMutation.isPending && (
								<Loader2 className="h-4 w-4 animate-spin" />
							)}
							حفظ السعر
						</Button>
					</div>
				</div>
			)}

			{/* ═══ Method: Per sqm ═══ */}
			{method === "per_sqm" && (
				<div className="rounded-xl border border-border bg-card p-4 space-y-4">
					<div className="flex items-center gap-2 mb-2">
						<Ruler className="h-4 w-4 text-primary" />
						<h4 className="font-semibold text-sm">تسعير حسب المتر المربع</h4>
					</div>

					{buildingArea <= 0 && (
						<div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-400">
							لم يتم تحديد مساحة البناء في بيانات الدراسة. يرجى إضافة المساحة
							أولاً.
						</div>
					)}

					{buildingArea > 0 && (
						<>
							<div className="flex items-center gap-4 text-sm text-muted-foreground">
								<span>
									مساحة البناء:{" "}
									<strong className="text-foreground">
										{formatNum(buildingArea)} م²
									</strong>
								</span>
								<span>
									تكلفة المتر الحالية:{" "}
									<strong className="text-foreground">
										{formatNum(costPerSqm)} ر.س/م²
									</strong>
								</span>
							</div>

							<div className="max-w-sm space-y-1">
								<Label className="text-xs">
									سعر بيع المتر المربع (ر.س/م²)
								</Label>
								<Input
									type="number"
									className="h-10 rounded-lg text-lg"
									dir="ltr"
									placeholder="0"
									value={pricePerSqmInput}
									onChange={(e: any) => setPricePerSqmInput(e.target.value)}
								/>
							</div>

							{sqmPriceNum > 0 && (
								<div className="rounded-lg bg-muted/30 p-4 space-y-3 text-sm">
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											سعر البيع الإجمالي المحسوب
										</span>
										<span className="font-semibold text-primary text-lg" dir="ltr">
											{formatNum(sqmTotalPrice)} ر.س
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											نسبة الهامش المحسوبة
										</span>
										<span
											className={cn(
												"font-bold",
												sqmMarkupPct >= 0
													? "text-emerald-600"
													: "text-red-600",
											)}
											dir="ltr"
										>
											{formatNum(sqmMarkupPct)}%
										</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-muted-foreground">
											الربح لكل متر
										</span>
										<span
											className={cn(
												"font-medium",
												sqmPriceNum - costPerSqm >= 0
													? "text-emerald-600"
													: "text-red-600",
											)}
											dir="ltr"
										>
											{formatNum(sqmPriceNum - costPerSqm)} ر.س/م²
										</span>
									</div>
								</div>
							)}

							<div className="flex items-center gap-3">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={vatIncluded || isVat}
										onChange={(e: any) => setVatIncluded(e.target.checked)}
										className="rounded"
									/>
									<span className="text-sm">
										تشمل ضريبة القيمة المضافة (15%)
									</span>
								</label>
							</div>

							<div className="flex justify-end">
								<Button
									onClick={handleSavePerSqm}
									disabled={uniformMutation.isPending || sqmPriceNum <= 0}
									className="gap-2 rounded-xl"
									size="sm"
								>
									{uniformMutation.isPending && (
										<Loader2 className="h-4 w-4 animate-spin" />
									)}
									حفظ السعر
								</Button>
							</div>
						</>
					)}
				</div>
			)}

			{/* ═══ Per-item price adjustment table ═══ */}
			{itemsWithPrices.length > 0 && (
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<button
						type="button"
						onClick={() => setItemsExpanded(!itemsExpanded)}
						className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors"
					>
						<div className="flex items-center gap-2">
							<Calculator className="h-4 w-4 text-primary" />
							<h4 className="font-semibold text-sm">
								تعديل أسعار البنود ({itemsWithPrices.length} بند)
							</h4>
						</div>
						<ChevronDown
							className={cn(
								"h-4 w-4 text-muted-foreground transition-transform",
								itemsExpanded && "rotate-180",
							)}
						/>
					</button>

					{itemsExpanded && (
						<>
							<div className="overflow-x-auto border-t border-border">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-muted/30 text-muted-foreground">
											<th className="px-4 py-3 text-right font-medium w-8">
												#
											</th>
											<th className="px-4 py-3 text-right font-medium">
												البند
											</th>
											<th className="px-4 py-3 text-center font-medium">
												القسم
											</th>
											<th className="px-4 py-3 text-center font-medium">
												الوحدة
											</th>
											<th className="px-4 py-3 text-center font-medium">
												الكمية
											</th>
											<th className="px-4 py-3 text-center font-medium">
												التكلفة
											</th>
											<th className="px-4 py-3 text-center font-medium">
												سعر البيع المحسوب
											</th>
											<th className="px-4 py-3 text-center font-medium">
												تعديل السعر
											</th>
										</tr>
									</thead>
									<tbody>
										{itemsWithPrices.map((item, idx) => (
											<tr
												key={item.id}
												className={cn(
													"border-b last:border-0 hover:bg-muted/20",
													item.hasOverride && "bg-amber-50/50 dark:bg-amber-950/10",
												)}
											>
												<td className="px-4 py-2.5 text-muted-foreground text-xs">
													{idx + 1}
												</td>
												<td className="px-4 py-2.5 font-medium max-w-[200px] truncate">
													{item.description}
												</td>
												<td className="px-4 py-2.5 text-center text-xs text-muted-foreground">
													{SECTION_LABELS[item.section] ?? item.section}
												</td>
												<td className="px-4 py-2.5 text-center text-xs">
													{item.unit}
												</td>
												<td className="px-4 py-2.5 text-center" dir="ltr">
													{formatNum(item.quantity)}
												</td>
												<td className="px-4 py-2.5 text-center" dir="ltr">
													{formatNum(item.cost)}
												</td>
												<td className="px-4 py-2.5 text-center" dir="ltr">
													{formatNum(item.calculatedPrice)}
												</td>
												<td className="px-4 py-2.5">
													<Input
														type="number"
														className={cn(
															"h-7 w-24 mx-auto text-center rounded-lg text-xs",
															item.hasOverride &&
																"border-amber-400 dark:border-amber-600",
														)}
														dir="ltr"
														placeholder={formatNum(item.calculatedPrice)}
														value={itemPriceOverrides[item.id] ?? ""}
														onChange={(e: any) =>
															setItemPriceOverrides((prev) => ({
																...prev,
																[item.id]: e.target.value,
															}))
														}
													/>
												</td>
											</tr>
										))}
									</tbody>
									<tfoot>
										<tr className="border-t-2 border-border bg-muted/20 font-semibold">
											<td className="px-4 py-3" colSpan={5} />
											<td className="px-4 py-3 text-center" dir="ltr">
												{formatNum(
													itemsWithPrices.reduce((s, i) => s + i.cost, 0),
												)}
											</td>
											<td className="px-4 py-3 text-center" dir="ltr">
												{formatNum(
													itemsWithPrices.reduce(
														(s, i) => s + i.calculatedPrice,
														0,
													),
												)}
											</td>
											<td className="px-4 py-3 text-center text-primary" dir="ltr">
												{formatNum(
													itemsWithPrices.reduce(
														(s, i) => s + i.sellingPrice,
														0,
													),
												)}
											</td>
										</tr>
									</tfoot>
								</table>
							</div>
							{Object.keys(itemPriceOverrides).length > 0 && (
								<div className="p-3 border-t border-border flex items-center justify-between">
									<span className="text-xs text-muted-foreground">
										{
											Object.values(itemPriceOverrides).filter(
												(v) => v !== "",
											).length
										}{" "}
										بند معدّل يدوياً
									</span>
									<Button
										variant="ghost"
										size="sm"
										className="text-xs"
										onClick={() => setItemPriceOverrides({})}
									>
										إعادة تعيين الكل
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			)}

			{/* ═══ Profit analysis ═══ */}
			{profitLoading ? (
				<div className="flex justify-center py-8">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			) : profitData ? (
				<ProfitAnalysisCard data={profitData as any} />
			) : null}

			{/* ═══ Lump sum analysis (if applicable) ═══ */}
			{(studyData as any)?.studyType === "LUMP_SUM_ANALYSIS" && (studyData as any)?.contractValue > 0 && (
				<LumpSumAnalysisSection
					organizationId={organizationId}
					studyId={studyId}
					contractValue={Number((studyData as any).contractValue)}
					totalCost={totalCost}
					buildingArea={buildingArea}
				/>
			)}

			{/* ═══ Approve & navigate ═══ */}
			<div className="flex gap-3 justify-end">
				<Button
					onClick={() =>
						(approveMutation as any).mutate({ 
							organizationId,
							studyId,
							stage: "PRICING",
						})
					}
					disabled={approveMutation.isPending}
					className="gap-2 rounded-xl"
				>
					{approveMutation.isPending ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<CheckCircle2 className="h-4 w-4" />
					)}
					اعتماد التسعير
				</Button>
				<Button asChild variant="outline" className="gap-2 rounded-xl">
					<Link
						href={`/app/${organizationSlug}/pricing/studies/${studyId}/quotation`}
					>
						عرض السعر
						<ChevronLeft className="h-4 w-4" />
					</Link>
				</Button>
			</div>
		</div>
	);
}
