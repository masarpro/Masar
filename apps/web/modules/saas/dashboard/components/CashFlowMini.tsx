"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Currency } from "@saas/finance/components/shared/Currency";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { ChevronLeft, DollarSign, FilePlus2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

const chartConfig: ChartConfig = {
	inflow: { label: "المقبوضات", color: "#0ea5e9" },
	outflow: { label: "المصروفات", color: "#ef4444" },
};

export function CashFlowMini() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const organizationSlug = activeOrganization?.slug ?? "";

	// Use orgDashboard for real financial totals (always available, no feature gate)
	const { data: orgFinance } = useQuery(
		orpc.finance.orgDashboard.queryOptions({
			input: { organizationId },
		}),
	);

	const totalInflow = orgFinance?.payments?.total ?? 0;
	const totalOutflow = orgFinance?.totalMoneyOut ?? 0;
	const netFlow = totalInflow - totalOutflow;
	const hasData = totalInflow > 0 || totalOutflow > 0;

	// Build chart data from recent expenses/payments for visual representation
	const chartData = (() => {
		const recentPayments = orgFinance?.recentPayments ?? [];
		const recentExpenses = orgFinance?.recentExpenses ?? [];

		// Group by date (last 7 entries max)
		const dayMap = new Map<string, { inflow: number; outflow: number }>();

		for (const p of recentPayments) {
			const day = new Date(p.date ?? p.createdAt).toLocaleDateString("ar-SA", { weekday: "short" });
			const entry = dayMap.get(day) ?? { inflow: 0, outflow: 0 };
			entry.inflow += Number(p.amount ?? 0);
			dayMap.set(day, entry);
		}

		for (const e of recentExpenses) {
			const day = new Date(e.date ?? e.createdAt).toLocaleDateString("ar-SA", { weekday: "short" });
			const entry = dayMap.get(day) ?? { inflow: 0, outflow: 0 };
			entry.outflow += Number(e.amount ?? 0);
			dayMap.set(day, entry);
		}

		const entries = Array.from(dayMap.entries())
			.slice(-7)
			.map(([day, val]) => ({ day, ...val }));

		return entries.length > 0 ? entries : null;
	})();

	const getAmountColor = (value: number, type: "income" | "expense" | "balance") => {
		if (type === "expense") return "text-red-600 dark:text-red-400";
		if (value > 0) return "text-green-600 dark:text-green-400";
		if (value < 0) return "text-red-600 dark:text-red-400";
		return "text-muted-foreground";
	};

	return (
		<div
			className={`${glassCard} flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500`}
			style={{ animationDelay: "160ms", maxHeight: 260 }}
		>
			{/* Header */}
			<div className="flex items-center justify-between px-4 pt-3 pb-2">
				<div className="flex items-center gap-1.5">
					<DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
					<span className="text-[11px] font-semibold text-muted-foreground">
						{t("dashboard.cashFlow.title")}
					</span>
				</div>
				<Link
					href={`/app/${organizationSlug}/finance`}
					className="flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-2 py-1 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
				>
					<span>{t("dashboard.cashFlow.goToFinance")}</span>
					<ChevronLeft className="h-3 w-3" />
				</Link>
			</div>

			{!hasData ? (
				/* Empty state */
				<div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 pb-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
						<DollarSign className="h-5 w-5 text-muted-foreground/50" />
					</div>
					<p className="text-xs text-muted-foreground text-center">
						{t("dashboard.cashflow.empty")}
					</p>
					<Link
						href={`/app/${organizationSlug}/finance/invoices/new`}
						className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-700 dark:text-blue-400 transition-colors"
					>
						<FilePlus2 className="h-3 w-3" />
						{t("dashboard.cashflow.emptyCta")}
					</Link>
				</div>
			) : (
				<div className="flex flex-1 flex-col px-4 pb-3">
					{/* Summary chips */}
					<div className="grid grid-cols-3 gap-2 mb-2">
						<div className="text-center p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20">
							<span className={`text-xs font-bold block ${getAmountColor(totalInflow, "income")}`}>
								<Currency amount={totalInflow} />
							</span>
							<span className="text-[8px] text-muted-foreground">{t("dashboard.cashFlow.income")}</span>
						</div>
						<div className="text-center p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20">
							<span className="text-xs font-bold text-red-600 dark:text-red-400 block">
								<Currency amount={totalOutflow} />
							</span>
							<span className="text-[8px] text-muted-foreground">{t("dashboard.cashFlow.expenses")}</span>
						</div>
						<div className={`text-center p-1.5 rounded-lg ${netFlow >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
							<span className={`text-xs font-bold block ${getAmountColor(netFlow, "balance")}`}>
								<Currency amount={netFlow} />
							</span>
							<span className="text-[8px] text-muted-foreground">{t("dashboard.cashFlow.net")}</span>
						</div>
					</div>

					{/* Chart */}
					{chartData && chartData.length > 1 ? (
						<ChartContainer config={chartConfig} className="h-28 w-full flex-1">
							<AreaChart
								data={chartData}
								margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
							>
								<defs>
									<linearGradient id="miniIncomeGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.22} />
										<stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
									</linearGradient>
									<linearGradient id="miniExpenseGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
										<stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<XAxis
									dataKey="day"
									tickLine={false}
									axisLine={false}
									fontSize={8}
									tickMargin={4}
								/>
								<YAxis hide />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Area
									type="monotone"
									dataKey="inflow"
									stroke="#0ea5e9"
									fill="url(#miniIncomeGrad)"
									strokeWidth={2}
									dot={false}
								/>
								<Area
									type="monotone"
									dataKey="outflow"
									stroke="#ef4444"
									fill="url(#miniExpenseGrad)"
									strokeWidth={1.5}
									dot={false}
								/>
							</AreaChart>
						</ChartContainer>
					) : (
						/* No chart points — just show summary */
						<div className="flex flex-1 items-center justify-center">
							<p className="text-[10px] text-muted-foreground">
								{t("dashboard.cashFlow.goToFinance")}
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
