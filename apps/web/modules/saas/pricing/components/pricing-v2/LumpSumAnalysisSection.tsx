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
import { useTranslations } from "next-intl";
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

const formatNum = (n: number) =>
	Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });

// ─── Helpers ─────────────────────────────────────────────────────

function getRecommendation(profitPct: number) {
	if (profitPct > 20) {
		return {
			labelKey: "lumpSum.recommendations.excellent.label" as const,
			descriptionKey: "lumpSum.recommendations.excellent.description" as const,
			color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
			borderColor: "border-emerald-200 dark:border-emerald-800",
			bgColor: "bg-emerald-50/50 dark:bg-emerald-950/20",
			icon: CheckCircle2,
		};
	}
	if (profitPct > 10) {
		return {
			labelKey: "lumpSum.recommendations.good.label" as const,
			descriptionKey: "lumpSum.recommendations.good.description" as const,
			color: "bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4",
			borderColor: "border-chart-4 dark:border-chart-4",
			bgColor: "bg-chart-4/15 dark:bg-chart-4/20",
			icon: CheckCircle2,
		};
	}
	if (profitPct > 5) {
		return {
			labelKey: "lumpSum.recommendations.acceptable.label" as const,
			descriptionKey: "lumpSum.recommendations.acceptable.description" as const,
			color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
			borderColor: "border-amber-200 dark:border-amber-800",
			bgColor: "bg-amber-50/50 dark:bg-amber-950/20",
			icon: AlertTriangle,
		};
	}
	if (profitPct > 0) {
		return {
			labelKey: "lumpSum.recommendations.weak.label" as const,
			descriptionKey: "lumpSum.recommendations.weak.description" as const,
			color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
			borderColor: "border-orange-200 dark:border-orange-800",
			bgColor: "bg-orange-50/50 dark:bg-orange-950/20",
			icon: AlertTriangle,
		};
	}
	return {
		labelKey: "lumpSum.recommendations.loss.label" as const,
		descriptionKey: "lumpSum.recommendations.loss.description" as const,
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
	const t = useTranslations("pricing.pricingV2");

	const sectionLabels: Record<string, string> = {
		STRUCTURAL: t("sections.structural"),
		FINISHING: t("sections.finishing"),
		MEP: t("sections.mep"),
		LABOR: t("sections.labor"),
		MANUAL: t("sections.manual"),
	};

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
				<h3 className="text-lg font-bold">{t("lumpSum.title")}</h3>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
					{/* Contract value */}
					<div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
						<p className="text-sm text-muted-foreground font-medium">
							{t("lumpSum.contractValue")}
						</p>
						<p className="text-2xl font-bold text-primary break-words" dir="ltr">
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
						<p className="text-sm font-medium text-muted-foreground">
							{t("lumpSum.difference")}
						</p>
						<div className="flex items-center justify-center gap-2">
							{isProfit ? (
								<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
							) : (
								<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
							)}
							<p
								className={cn(
									"text-2xl font-bold break-words",
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
							{isProfit ? t("lumpSum.profit") : t("lumpSum.loss")} (
							{formatNum(Math.abs(profitPct))}%)
						</p>
					</div>

					{/* Calculated cost */}
					<div className="rounded-xl border border-border bg-card p-4 text-center space-y-1">
						<p className="text-sm text-muted-foreground font-medium">
							{t("lumpSum.calculatedCost")}
						</p>
						<p className="text-2xl font-bold text-foreground break-words" dir="ltr">
							{formatNum(totalCost)} ر.س
						</p>
					</div>
				</div>

				{/* Animated progress bar */}
				<div className="space-y-2">
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>{t("lumpSum.costPctOfContract")}</span>
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
						<span className="text-xs text-muted-foreground font-medium">
							{t("lumpSum.profitPct")}
						</span>
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
						<Shield className="h-4 w-4 text-chart-4" />
						<span className="text-xs text-muted-foreground font-medium">
							{t("lumpSum.safetyMargin")}
						</span>
					</div>
					<p className="text-xl font-bold text-chart-4" dir="ltr">
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
							<span className="text-xs text-muted-foreground font-medium">
								{t("lumpSum.profitPerSqm")}
							</span>
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
						<span className="text-xs text-muted-foreground font-medium">
							{t("lumpSum.costPctOfContractShort")}
						</span>
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
						<h4 className="font-semibold">{t("lumpSum.recommendation")}</h4>
						<span
							className={cn(
								"inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
								recommendation.color,
							)}
						>
							{t(recommendation.labelKey)}
						</span>
					</div>
				</div>
				<p className="text-sm text-muted-foreground leading-relaxed">
					{t(recommendation.descriptionKey)}
				</p>
			</div>

			{/* ═══ 4. Cost Breakdown Comparison Table ═══ */}
			{sectionBreakdown.length > 0 && (
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					<div className="p-4 pb-2">
						<h4 className="font-semibold text-sm">
							{t("lumpSum.sectionComparisonTitle")}
						</h4>
						<p className="text-xs text-muted-foreground mt-1">
							{t("lumpSum.sectionComparisonDesc")}
						</p>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-muted/30 text-muted-foreground">
									<th className="px-4 py-3 text-start font-medium">
										{t("table.section")}
									</th>
									<th className="px-4 py-3 text-center font-medium">
										{t("table.cost")}
									</th>
									<th className="px-4 py-3 text-center font-medium">
										{t("lumpSum.contractShare")}
									</th>
									<th className="px-4 py-3 text-center font-medium">
										{t("lumpSum.contractAllocated")}
									</th>
									<th className="px-4 py-3 text-center font-medium">
										{t("lumpSum.margin")}
									</th>
								</tr>
							</thead>
							<tbody>
								{sectionBreakdown.map((row) => (
									<tr
										key={row.section}
										className="border-b last:border-0 hover:bg-muted/20"
									>
										<td className="px-4 py-3 font-medium">
											{sectionLabels[row.section] ?? row.section}
										</td>
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
									<td className="px-4 py-3">{t("table.total")}</td>
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
