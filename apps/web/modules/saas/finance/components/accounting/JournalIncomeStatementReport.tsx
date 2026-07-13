"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { DollarSign, TrendingDown, TrendingUp, BarChart3, Printer } from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { formatAccounting, formatPercent } from "./formatters";
import { Currency } from "../shared/Currency";
import { ReportPrintHeader } from "../shared/ReportPrintHeader";

interface Props {
	organizationId: string;
	organizationSlug: string;
}

type PeriodType = "month" | "quarter" | "year" | "custom";

export function JournalIncomeStatementReport({ organizationId }: Props) {
	const t = useTranslations();
	const [periodType, setPeriodType] = useState<PeriodType>("quarter");
	const [includeComparison, setIncludeComparison] = useState(false);

	const { dateFrom, dateTo } = useMemo(() => {
		const today = new Date();
		switch (periodType) {
			case "month": {
				return { dateFrom: new Date(today.getFullYear(), today.getMonth(), 1), dateTo: new Date(today.getFullYear(), today.getMonth() + 1, 0) };
			}
			case "quarter": {
				const q = Math.floor(today.getMonth() / 3);
				return { dateFrom: new Date(today.getFullYear(), q * 3, 1), dateTo: new Date(today.getFullYear(), q * 3 + 3, 0) };
			}
			case "year": {
				return { dateFrom: new Date(today.getFullYear(), 0, 1), dateTo: new Date(today.getFullYear(), 11, 31) };
			}
			default:
				return { dateFrom: new Date(today.getFullYear(), today.getMonth(), 1), dateTo: today };
		}
	}, [periodType]);

	const { data, isLoading } = useQuery(
		orpc.accounting.reports.incomeStatement.queryOptions({
			input: {
				organizationId,
				dateFrom: dateFrom.toISOString(),
				dateTo: dateTo.toISOString(),
				includeComparison,
			},
		}),
	);

	if (isLoading) return <DashboardSkeleton />;

	return (
		<div className="space-y-6">
			<ReportPrintHeader reportTitle={t("finance.accounting.incomeStatement.title")} dateRange={`${dateFrom.toLocaleDateString("en-SA")} — ${dateTo.toLocaleDateString("en-SA")}`} />
			{/* Period Selector */}
			<div className="flex flex-wrap items-center gap-3 print:hidden">
				<div className="flex gap-1 bg-muted rounded-xl p-1">
					{([
						{ key: "month" as const, label: t("finance.accounting.income.month") },
						{ key: "quarter" as const, label: t("finance.accounting.income.quarter") },
						{ key: "year" as const, label: t("finance.accounting.income.year") },
					]).map((p) => (
						<Button key={p.key} variant={periodType === p.key ? "primary" : "ghost"} size="sm" className="rounded-lg" onClick={() => setPeriodType(p.key)}>
							{p.label}
						</Button>
					))}
				</div>
				<label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
					<input type="checkbox" checked={includeComparison} onChange={(e) => setIncludeComparison(e.target.checked)} className="rounded" />
					{t("finance.accounting.incomeStatement.compareWithPrevious")}
				</label>
				<Button variant="outline" size="sm" className="rounded-xl ms-auto" onClick={() => window.print()}>
					<Printer className="h-4 w-4 me-1" />
					{t("common.print")}
				</Button>
			</div>

			{data && (
				<>
					{/* KPI Cards */}
					<div className="grid gap-4 sm:grid-cols-4">
						<KPICard label={t("finance.accounting.incomeStatement.totalRevenue")} value={data.revenue.total} color="green" icon={TrendingUp} />
						<KPICard label={t("finance.accounting.incomeStatement.costOfProjects")} value={data.costOfProjects.total} color="amber" icon={TrendingDown} />
						<KPICard label={t("finance.accounting.incomeStatement.grossProfit")} value={data.grossProfit} color="blue" icon={BarChart3} subtitle={formatPercent(data.grossProfitMargin)} />
						<KPICard label={t("finance.accounting.incomeStatement.netProfit")} value={data.netProfit} color={data.netProfit >= 0 ? "green" : "red"} icon={DollarSign} subtitle={formatPercent(data.netProfitMargin)} />
					</div>

					{/* Income Statement - Accounting Format */}
					<Card className="rounded-2xl">
						<CardHeader>
							<CardTitle>{t("finance.accounting.incomeStatement.title")}</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-mono text-sm space-y-0.5">
								{/* Revenue */}
								<SectionHeader label={t("finance.accounting.incomeStatement.revenue")} color="green" />
								{data.revenue.accounts.map((a: any) => (
									<StatementLine key={a.code} label={a.nameAr} amount={a.amount} indent={1} />
								))}
								<SubtotalLine label={t("finance.accounting.incomeStatement.totalRevenue")} amount={data.revenue.total} />

								{/* Cost of Projects */}
								<div className="pt-3" />
								<SectionHeader label={t("finance.accounting.incomeStatement.costOfProjects")} color="amber" />
								{data.costOfProjects.accounts.map((a: any) => (
									<StatementLine key={a.code} label={a.nameAr} amount={a.amount} indent={1} />
								))}
								<SubtotalLine label={`${t("finance.accounting.incomeStatement.totalCost")}`} amount={-data.costOfProjects.total} />

								{/* Gross Profit */}
								<TotalLine label={t("finance.accounting.incomeStatement.grossProfit")} amount={data.grossProfit} />
								<PercentLine label={t("finance.accounting.incomeStatement.grossProfitMargin")} value={data.grossProfitMargin} />

								{/* Operating Expenses */}
								<div className="pt-3" />
								<SectionHeader label={t("finance.accounting.incomeStatement.operatingExpenses")} color="red" />
								{data.operatingExpenses.accounts.map((a: any) => (
									<StatementLine key={a.code} label={a.nameAr} amount={a.amount} indent={1} />
								))}
								<SubtotalLine label={`${t("finance.accounting.incomeStatement.totalOpex")}`} amount={-data.operatingExpenses.total} />

								{/* Net Profit */}
								<TotalLine label={t("finance.accounting.incomeStatement.netProfit")} amount={data.netProfit} isGrandTotal />
								<PercentLine label={t("finance.accounting.incomeStatement.netProfitMargin")} value={data.netProfitMargin} />
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}

function KPICard({ label, value, color, icon: Icon, subtitle }: { label: string; value: number; color: string; icon: any; subtitle?: string }) {
	const colorMap: Record<string, { text: string; bg: string }> = {
		green: { text: "text-success", bg: "bg-success/15" },
		red: { text: "text-destructive", bg: "bg-destructive/15" },
		blue: { text: "text-chart-4", bg: "bg-chart-4/15" },
		amber: { text: "text-chart-1", bg: "bg-chart-1/15" },
	};
	const c = colorMap[color] ?? colorMap.blue;
	return (
		<Card className="rounded-2xl">
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm text-muted-foreground">{label}</p>
						<p className={`text-xl font-bold ${c.text} mt-1`}>{formatAccounting(Math.abs(value)) || "0"}</p>
						{subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
					</div>
					<div className={`p-2.5 ${c.bg} rounded-xl`}><Icon className={`h-5 w-5 ${c.text}`} /></div>
				</div>
			</CardContent>
		</Card>
	);
}

function SectionHeader({ label, color }: { label: string; color: string }) {
	const bgMap: Record<string, string> = {
		green: "bg-success/10",
		amber: "bg-chart-1/10",
		red: "bg-destructive/10",
	};
	return <div className={`font-bold text-foreground py-2 px-3 rounded-lg ${bgMap[color] ?? ""}`}>{label}</div>;
}

function StatementLine({ label, amount, indent = 0 }: { label: string; amount: number; indent?: number }) {
	return (
		<div className="flex justify-between py-1" style={{ paddingInlineStart: `${indent * 1.5}rem` }}>
			<span className="text-muted-foreground">{label}</span>
			<span className="text-foreground">{formatAccounting(amount)}</span>
		</div>
	);
}

function SubtotalLine({ label, amount }: { label: string; amount: number }) {
	return (
		<div className="flex justify-between py-1 border-t border-border font-semibold">
			<span className="text-foreground">{label}</span>
			<span className={amount < 0 ? "text-destructive" : "text-foreground"}>{formatAccounting(amount)}</span>
		</div>
	);
}

function TotalLine({ label, amount, isGrandTotal }: { label: string; amount: number; isGrandTotal?: boolean }) {
	return (
		<div className={`flex justify-between py-2 font-bold ${isGrandTotal ? "border-t-2 border-b-2 border-border" : "border-t border-border"}`}>
			<span className="text-foreground">{label}</span>
			<span className={amount < 0 ? "text-destructive" : "text-success"}>{formatAccounting(amount)}</span>
		</div>
	);
}

function PercentLine({ label, value }: { label: string; value: number }) {
	return (
		<div className="flex justify-between py-0.5">
			<span className="text-xs text-muted-foreground">{label}</span>
			<span className="text-xs text-muted-foreground">{formatPercent(value)}</span>
		</div>
	);
}
