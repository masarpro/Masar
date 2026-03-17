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
import { ChevronLeft, DollarSign, Landmark, Wallet } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig: ChartConfig = {
	inflow: { label: "المقبوضات", color: "#10b981" },
	outflow: { label: "المصروفات", color: "#ef4444" },
};

export function FinanceCard() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id ?? "";
	const organizationSlug = activeOrganization?.slug ?? "";

	const { data: orgFinance } = useQuery(
		orpc.finance.orgDashboard.queryOptions({ input: { organizationId } }),
	);

	const bankBalance = orgFinance?.balances?.totalBankBalance ?? 0;
	const cashBalance = orgFinance?.balances?.totalCashBalance ?? 0;
	const totalIncome = orgFinance?.payments?.total ?? 0;
	const totalExpenses = orgFinance?.totalMoneyOut ?? 0;
	const netFlow = totalIncome - totalExpenses;

	// Chart data from recent transactions
	const chartData = (() => {
		const recentPayments = orgFinance?.recentPayments ?? [];
		const recentExpenses = orgFinance?.recentExpenses ?? [];
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

		const entries = Array.from(dayMap.entries()).slice(-7).map(([day, val]) => ({ day, ...val }));
		return entries.length > 1 ? entries : null;
	})();

	return (
		<div className="rounded-2xl border border-border/50 bg-card p-5 flex flex-col h-full animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: "180ms" }}>
			{/* Title */}
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-sm font-bold text-foreground">{t("dashboard.finance.title")}</h3>
				<Link href={`/app/${organizationSlug}/finance`} className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
					{t("dashboard.finance.viewAll")} <ChevronLeft className="h-3 w-3" />
				</Link>
			</div>

			{/* Balances row */}
			<div className="grid grid-cols-2 gap-3 mb-4">
				{/* Bank */}
				<div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/30">
					<div className="flex items-center gap-2 mb-2">
						<div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
							<Landmark className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
						</div>
						<span className="text-[11px] text-muted-foreground font-medium">{t("dashboard.finance.bank")}</span>
					</div>
					{bankBalance > 0 ? (
						<p className="text-lg font-black text-foreground tracking-tight"><Currency amount={bankBalance} /></p>
					) : (
						<>
							<p className="text-lg font-black text-gray-300 dark:text-gray-600 tracking-tight">—</p>
							<Link href={`/app/${organizationSlug}/finance`} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1 block transition-colors">
								{t("dashboard.finance.addBank")} <span className="opacity-50">&#x2039;</span>
							</Link>
						</>
					)}
				</div>

				{/* Cash */}
				<div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/30">
					<div className="flex items-center gap-2 mb-2">
						<div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
							<Wallet className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
						</div>
						<span className="text-[11px] text-muted-foreground font-medium">{t("dashboard.finance.cash")}</span>
					</div>
					{cashBalance > 0 ? (
						<p className="text-lg font-black text-foreground tracking-tight"><Currency amount={cashBalance} /></p>
					) : (
						<>
							<p className="text-lg font-black text-gray-300 dark:text-gray-600 tracking-tight">—</p>
							<Link href={`/app/${organizationSlug}/finance`} className="text-[10px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1 block transition-colors">
								{t("dashboard.finance.recordBalance")} <span className="opacity-50">&#x2039;</span>
							</Link>
						</>
					)}
				</div>
			</div>

			{/* Dashed separator */}
			<div className="border-t border-dashed border-gray-100 dark:border-gray-800 my-1" />

			{/* Income / Expenses / Net row */}
			<div className="grid grid-cols-3 gap-2 my-3">
				<div className="text-center p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-900/15">
					<p className="text-base font-black text-emerald-600 dark:text-emerald-400"><Currency amount={totalIncome} /></p>
					<p className="text-[10px] text-muted-foreground mt-0.5">{t("dashboard.finance.income")}</p>
				</div>
				<div className="text-center p-2 rounded-lg bg-rose-50/60 dark:bg-rose-900/15">
					<p className="text-base font-black text-rose-500 dark:text-rose-400"><Currency amount={totalExpenses} /></p>
					<p className="text-[10px] text-muted-foreground mt-0.5">{t("dashboard.finance.expenses")}</p>
				</div>
				<div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
					<p className={`text-base font-black ${netFlow >= 0 ? "text-foreground" : "text-rose-500 dark:text-rose-400"}`}><Currency amount={netFlow} /></p>
					<p className="text-[10px] text-muted-foreground mt-0.5">{t("dashboard.finance.net")}</p>
				</div>
			</div>

			{/* Chart */}
			<div className="flex-1 min-h-0 mt-2">
				{chartData ? (
					<ChartContainer config={chartConfig} className="h-full w-full min-h-[100px]">
						<AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
							<defs>
								<linearGradient id="finIncomeGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
									<stop offset="100%" stopColor="#10b981" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" vertical={false} />
							<XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={9} tickMargin={4} />
							<YAxis hide />
							<ChartTooltip content={<ChartTooltipContent />} />
							<Area type="monotone" dataKey="inflow" stroke="#10b981" fill="url(#finIncomeGrad)" strokeWidth={2} dot={false} />
							<Area type="monotone" dataKey="outflow" stroke="#f43f5e" fill="none" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
						</AreaChart>
					</ChartContainer>
				) : (
					<div className="flex items-center justify-center h-full text-xs text-gray-300 dark:text-gray-600">
						{t("dashboard.finance.chartPlaceholder")}
					</div>
				)}
			</div>
		</div>
	);
}
