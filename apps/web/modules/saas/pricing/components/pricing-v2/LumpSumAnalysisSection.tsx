"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@ui/lib";
import {
	TrendingUp,
	TrendingDown,
	Shield,
	AlertTriangle,
	CheckCircle2,
	XCircle,
} from "lucide-react";
import { useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────

interface LumpSumAnalysisSectionProps {
	organizationId: string;
	studyId: string;
	contractValue: number;
	totalCost: number;
	buildingArea: number;
}

// ─── Constants ───────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
	STRUCTURAL: "إنشائي",
	FINISHING: "تشطيبات",
	MEP: "كهروميكانيكية",
	LABOR: "عمالة عامة",
	MANUAL: "بنود يدوية",
};

const formatNum = (n: number) =>
	Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

// ─── Helpers ─────────────────────────────────────────────────────

function getRecommendation(profitPct: number) {
	if (profitPct > 20) {
		return {
			label: "ممتاز",
			description: "هامش ربح ممتاز — يُنصح بالمضي قدمًا في المشروع",
			color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
			borderColor: "border-emerald-200 dark:border-emerald-800",
			bgColor: "bg-emerald-50/50 dark:bg-emerald-950/20",
			icon: CheckCircle2,
		};
	}
	if (profitPct > 10) {
		return {
			label: "جيد",
			description: "هامش ربح جيد — مقبول للتنفيذ",
			color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
			borderColor: "border-blue-200 dark:border-blue-800",
			bgColor: "bg-blue-50/50 dark:bg-blue-950/20",
			icon: CheckCircle2,
		};
	}
	if (profitPct > 5) {
		return {
			label: "مقبول",
			description: "هامش ربح منخفض — يُنصح بمراجعة التكاليف وتقليلها",
			color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
			borderColor: "border-amber-200 dark:border-amber-800",
			bgColor: "bg-amber-50/50 dark:bg-amber-950/20",
			icon: AlertTriangle,
		};
	}
	if (profitPct > 0) {
		return {
			label: "ضعيف",
			description: "هامش ربح ضعيف جدًا — يجب إعادة النظر في التكاليف أو قيمة العقد",
			color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
			borderColor: "border-orange-200 dark:border-orange-800",
			bgColor: "bg-orange-50/50 dark:bg-orange-950/20",
			icon: AlertTriangle,
		};
	}
	return {
		label: "خسارة",
		description: "المشروع سيحقق خسارة — لا يُنصح بالتنفيذ بهذه القيم",
		color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
		borderColor: "border-red-200 dark:border-red-800",
		bgColor: "bg-red-50/50 dark:bg-red-950/20",
		icon: XCircle,
	};
}

// ─── Component ───────────────────────────────────────────────────

export function LumpSumAnalysisSection({
	organizationId,
	studyId,
	contractValue,
	totalCost,
	buildingArea,
}: LumpSumAnalysisSectionProps) {
	// ─── Fetch costing items ─────────────────────────────────────
	const { data: costingItems } = useQuery(
		orpc.pricing.studies.costing.getItems.queryOptions({
			input: { organizationId, studyId },
		}),
	);

	// ─── Derived calculations ────────────────────────────────────
	const difference = contractValue - totalCost;
	const profitPct = contractValue > 0 ? (difference / contractValue) * 100 : 0;
	const safetyMarginPct = totalCost > 0 ? (difference / totalCost) * 100 : 0;
	const costAsPercentOfContract = contractValue > 0 ? (totalCost / contractValue) * 100 : 0;
	const profitPerSqm = buildingArea > 0 ? difference / buildingArea : 0;
	const isProfit = difference >= 0;

	const recommendation = getRecommendation(profitPct);
	const RecommendationIcon = recommendation.icon;

	// ─── Section breakdown ───────────────────────────────────────
	const sectionBreakdown = useMemo(() => {
		const items = (costingItems as any[]) ?? [];
		if (items.length === 0) return [];

		const grouped: Record<string, number> = {};
		for (const item of items) {
			const section = item.section ?? "MANUAL";
			const cost = Number(item.totalCost ?? 0);
			grouped[section] = (grouped[section] ?? 0) + cost;
		}

		const totalFromItems = Object.values(grouped).reduce((sum, v) => sum + v, 0);

		return Object.entries(grouped).map(([section, cost]) => {
			const share = totalFromItems > 0 ? cost / totalFromItems : 0;
			const allocated = contractValue * share;
			const margin = allocated - cost;
			return {
				section,
				label: SECTION_LABELS[section] ?? section,
				cost,
				allocated,
				margin,
				share,
			};
		});
	}, [costingItems, contractValue]);

	// ─── Progress bar width ──────────────────────────────────────
	const progressPct = Math.min(costAsPercentOfContract, 100);

	// ─── Render ──────────────────────────────────────────────────

	return (
		<div className="space-y-6" dir="rtl">
			{/* ═══ 1. Hero Comparison Card ═══ */}
			<div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-bl from-primary/10 via-primary/5 to-background p-6 space-y-5">
				<h3 className="text-lg font-bold">تحليل المقطوعية</h3>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
					{/* Contract value */}
					<div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
						<p className="text-sm text-muted-foreground font-medium">قيمة العقد</p>
						<p className="text-2xl font-bold text-primary" dir="ltr">
							{formatNum(contractValue)} ر.س
						</p>
					</div>

					{/* Difference (center) */}
					<div
						className={cn(
							"rounded-xl border-2 p-4 text-center space-y-1",
							isProfit
								? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/30"
								: "border-red-300 dark:border-red-700 bg-red-50/60 dark:bg-red-950/30",
						)}
					>
						<p className="text-sm font-medium text-muted-foreground">الفرق</p>
						<div className="flex items-center justify-center gap-2">
							{isProfit ? (
								<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
							) : (
								<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
							)}
							<p
								className={cn(
									"text-2xl font-bold",
									isProfit
										? "text-emerald-700 dark:text-emerald-300"
										: "text-red-700 dark:text-red-300",
								)}
								dir="ltr"
							>
								{isProfit ? "+" : ""}{formatNum(difference)} ر.س
							</p>
						</div>
						<p
							className={cn(
								"text-xs font-medium",
								isProfit
									? "text-emerald-600 dark:text-emerald-400"
									: "text-red-600 dark:text-red-400",
							)}
						>
							{isProfit ? "ربح" : "خسارة"} ({formatNum(Math.abs(profitPct))}%)
						</p>
					</div>

					{/* Calculated cost */}
					<div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
						<p className="text-sm text-muted-foreground font-medium">التكلفة المحسوبة</p>
						<p className="text-2xl font-bold text-foreground" dir="ltr">
							{formatNum(totalCost)} ر.س
						</p>
					</div>
				</div>

				{/* Animated progress bar */}
				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>نسبة التكلفة من قيمة العقد</span>
						<span dir="ltr" className="font-medium">{formatNum(costAsPercentOfContract)}%</span>
					</div>
					<div className="h-3 w-full rounded-full bg-muted/40 overflow-hidden">
						<div
							className={cn(
								"h-full rounded-full transition-all duration-1000 ease-out",
								costAsPercentOfContract <= 80
									? "bg-emerald-500"
									: costAsPercentOfContract <= 95
										? "bg-amber-500"
										: "bg-red-500",
							)}
							style={{ width: `${progressPct}%` }}
						/>
					</div>
				</div>
			</div>

			{/* ═══ 2. Key Metrics Row ═══ */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
				{/* Profit % */}
				<div className="rounded-xl border border-border bg-card p-4 space-y-2">
					<div className="flex items-center gap-2">
						{isProfit ? (
							<TrendingUp className="h-4 w-4 text-emerald-600" />
						) : (
							<TrendingDown className="h-4 w-4 text-red-600" />
						)}
						<span className="text-xs text-muted-foreground font-medium">نسبة الربح</span>
					</div>
					<p
						className={cn(
							"text-xl font-bold",
							isProfit ? "text-emerald-600" : "text-red-600",
						)}
						dir="ltr"
					>
						{formatNum(profitPct)}%
					</p>
				</div>

				{/* Safety margin */}
				<div className="rounded-xl border border-border bg-card p-4 space-y-2">
					<div className="flex items-center gap-2">
						<Shield className="h-4 w-4 text-blue-600" />
						<span className="text-xs text-muted-foreground font-medium">هامش الأمان</span>
					</div>
					<p className="text-xl font-bold text-blue-600" dir="ltr">
						{formatNum(safetyMarginPct)}%
					</p>
				</div>

				{/* Profit per sqm */}
				{buildingArea > 0 && (
					<div className="rounded-xl border border-border bg-card p-4 space-y-2">
						<div className="flex items-center gap-2">
							{profitPerSqm >= 0 ? (
								<TrendingUp className="h-4 w-4 text-emerald-600" />
							) : (
								<TrendingDown className="h-4 w-4 text-red-600" />
							)}
							<span className="text-xs text-muted-foreground font-medium">الربح لكل متر مربع</span>
						</div>
						<p
							className={cn(
								"text-xl font-bold",
								profitPerSqm >= 0 ? "text-emerald-600" : "text-red-600",
							)}
							dir="ltr"
						>
							{formatNum(profitPerSqm)} ر.س/م²
						</p>
					</div>
				)}

				{/* Cost as % of contract */}
				<div className="rounded-xl border border-border bg-card p-4 space-y-2">
					<div className="flex items-center gap-2">
						{costAsPercentOfContract <= 90 ? (
							<CheckCircle2 className="h-4 w-4 text-emerald-600" />
						) : (
							<AlertTriangle className="h-4 w-4 text-amber-600" />
						)}
						<span className="text-xs text-muted-foreground font-medium">نسبة التكلفة من العقد</span>
					</div>
					<p
						className={cn(
							"text-xl font-bold",
							costAsPercentOfContract <= 80
								? "text-emerald-600"
								: costAsPercentOfContract <= 95
									? "text-amber-600"
									: "text-red-600",
						)}
						dir="ltr"
					>
						{formatNum(costAsPercentOfContract)}%
					</p>
				</div>
			</div>

			{/* ═══ 3. Recommendation Section ═══ */}
			<div
				className={cn(
					"rounded-xl border p-5 space-y-3",
					recommendation.borderColor,
					recommendation.bgColor,
				)}
			>
				<div className="flex items-center gap-3">
					<RecommendationIcon className="h-5 w-5" />
					<div className="flex items-center gap-2">
						<h4 className="font-semibold">التوصية</h4>
						<span
							className={cn(
								"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
								recommendation.color,
							)}
						>
							{recommendation.label}
						</span>
					</div>
				</div>
				<p className="text-sm text-muted-foreground leading-relaxed">
					{recommendation.description}
				</p>
			</div>

			{/* ═══ 4. Cost Breakdown Comparison Table ═══ */}
			{sectionBreakdown.length > 0 && (
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<div className="p-4 pb-2">
						<h4 className="font-semibold text-sm">مقارنة التكلفة حسب القسم</h4>
						<p className="text-xs text-muted-foreground mt-1">
							توزيع قيمة العقد بنسبة حصة كل قسم من إجمالي التكلفة
						</p>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/30 text-muted-foreground">
									<th className="px-4 py-3 text-right font-medium">القسم</th>
									<th className="px-4 py-3 text-center font-medium">التكلفة</th>
									<th className="px-4 py-3 text-center font-medium">الحصة من العقد</th>
									<th className="px-4 py-3 text-center font-medium">المخصص من العقد</th>
									<th className="px-4 py-3 text-center font-medium">الهامش</th>
								</tr>
							</thead>
							<tbody>
								{sectionBreakdown.map((row) => (
									<tr
										key={row.section}
										className="border-b last:border-0 hover:bg-muted/20"
									>
										<td className="px-4 py-3 font-medium">{row.label}</td>
										<td className="px-4 py-3 text-center" dir="ltr">
											{formatNum(row.cost)} ر.س
										</td>
										<td className="px-4 py-3 text-center" dir="ltr">
											{formatNum(row.share * 100)}%
										</td>
										<td className="px-4 py-3 text-center" dir="ltr">
											{formatNum(row.allocated)} ر.س
										</td>
										<td className="px-4 py-3 text-center" dir="ltr">
											<span
												className={cn(
													"font-medium",
													row.margin >= 0
														? "text-emerald-600"
														: "text-red-600",
												)}
											>
												{row.margin >= 0 ? "+" : ""}{formatNum(row.margin)} ر.س
											</span>
										</td>
									</tr>
								))}
							</tbody>
							<tfoot>
								<tr className="border-t-2 border-border bg-muted/20 font-semibold">
									<td className="px-4 py-3">الإجمالي</td>
									<td className="px-4 py-3 text-center" dir="ltr">
										{formatNum(
											sectionBreakdown.reduce((s, r) => s + r.cost, 0),
										)}{" "}
										ر.س
									</td>
									<td className="px-4 py-3 text-center" dir="ltr">
										100%
									</td>
									<td className="px-4 py-3 text-center" dir="ltr">
										{formatNum(contractValue)} ر.س
									</td>
									<td className="px-4 py-3 text-center" dir="ltr">
										<span
											className={cn(
												"font-bold",
												difference >= 0
													? "text-emerald-600"
													: "text-red-600",
											)}
										>
											{difference >= 0 ? "+" : ""}{formatNum(difference)} ر.س
										</span>
									</td>
								</tr>
							</tfoot>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
