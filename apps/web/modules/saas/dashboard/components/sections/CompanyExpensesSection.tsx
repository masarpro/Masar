"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import {
	ChartContainer,
} from "@ui/components/chart";
import { ChevronLeft, Receipt } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart } from "recharts";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

const COMPANY_EXPENSE_COLORS: Record<string, string> = {
	RENT: "#0ea5e9",
	UTILITIES: "#3b82f6",
	COMMUNICATIONS: "#8b5cf6",
	INSURANCE: "#f59e0b",
	LICENSES: "#06b6d4",
	SUBSCRIPTIONS: "#ec4899",
	MAINTENANCE: "#84cc16",
	BANK_FEES: "#6366f1",
	MARKETING: "#f97316",
	TRANSPORT: "#0ea5e9",
	HOSPITALITY: "#a855f7",
	OTHER: "#6b7280",
};

interface CompanyExpensesSectionProps {
	byCategory: Record<string, number>;
	monthlyExpenses: Array<{ month: number; year: number; amount: number }>;
	organizationSlug: string;
}

export function CompanyExpensesSection({
	byCategory,
	monthlyExpenses,
	organizationSlug,
}: CompanyExpensesSectionProps) {
	const t = useTranslations();

	// Derive breakdown for pie chart
	const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
	const expenseBreakdown =
		total === 0
			? []
			: Object.entries(byCategory)
					.map(([cat, amt]) => ({
						name: t(`company.expenses.categories.${cat}`),
						value: Math.round((amt / total) * 100),
						color: COMPANY_EXPENSE_COLORS[cat] ?? "#6b7280",
					}))
					.filter((e) => e.value > 0)
					.sort((a, b) => b.value - a.value);

	// Derive monthly trend
	const monthlyTrend = monthlyExpenses.map((m) => ({
		month: t(`dashboard.expenseBreakdown.months.${m.month}`),
		amount: m.amount,
	}));

	return (
		<div
			className={`${glassCard} flex h-full min-h-[240px] flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500`}
			style={{ animationDelay: "520ms" }}
		>
			{/* Header */}
			<div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-2">
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/20 to-sky-500/20">
						<Receipt className="h-4 w-4 text-sky-600 dark:text-sky-400" />
					</div>
					<span className="text-sm font-semibold text-foreground">
						{t("dashboard.expenseBreakdown.title")}
					</span>
				</div>
				<Link
					href={`/app/${organizationSlug}/company/expenses`}
					className="flex items-center gap-1 rounded-lg bg-sky-500/10 px-2.5 py-1.5 text-xs font-medium text-sky-600 transition-colors hover:bg-sky-500/20 dark:text-sky-400"
				>
					{t("dashboard.expenseBreakdown.details")}
					<ChevronLeft className="h-3.5 w-3.5" />
				</Link>
			</div>

			{/* Main content */}
			<div className="flex flex-1 min-h-0 flex-col gap-3 px-4 pb-4">
				{expenseBreakdown.length === 0 && monthlyTrend.length === 0 ? (
					<div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
						<p className="text-sm text-muted-foreground">
							{t("dashboard.expenseBreakdown.noData")}
						</p>
						<Link
							href={`/app/${organizationSlug}/company/expenses`}
							className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
						>
							{t("dashboard.expenseBreakdown.details")}
						</Link>
					</div>
				) : (
					<>
						{/* Donut + Legend */}
						<div className="flex flex-1 min-h-0 items-center gap-4">
							<div className="relative h-28 w-28 shrink-0">
								{expenseBreakdown.length > 0 ? (
									<>
										<ChartContainer
											config={{ value: { label: "\u0627\u0644\u0642\u064a\u0645\u0629" } }}
											className="h-28 w-28"
										>
											<PieChart>
												<Pie
													data={expenseBreakdown}
													cx="50%"
													cy="50%"
													outerRadius={48}
													innerRadius={28}
													dataKey="value"
													stroke="none"
													paddingAngle={1}
													cornerRadius={4}
												>
													{expenseBreakdown.map((entry, idx) => (
														<Cell key={idx} fill={entry.color} />
													))}
												</Pie>
											</PieChart>
										</ChartContainer>
										<div className="absolute inset-0 flex items-center justify-center">
											<span className="text-lg font-bold text-foreground/80">
												{expenseBreakdown.reduce((s, e) => s + e.value, 0)}%
											</span>
										</div>
									</>
								) : (
									<div className="flex h-full w-full items-center justify-center rounded-full bg-muted/50">
										<span className="text-2xl font-bold text-muted-foreground/50">
											&mdash;
										</span>
									</div>
								)}
							</div>
							<div className="flex flex-1 flex-col gap-1.5 min-w-0">
								{expenseBreakdown.map((entry, idx) => (
									<div key={idx} className="flex items-center gap-2">
										<div
											className="h-2 w-2 shrink-0 rounded-full"
											style={{ background: entry.color }}
										/>
										<span className="flex-1 truncate text-xs text-foreground/80">
											{entry.name}
										</span>
										<span className="text-xs font-bold tabular-nums text-foreground">
											{entry.value}%
										</span>
									</div>
								))}
							</div>
						</div>

						{/* Monthly trend */}
						<div className="shrink-0 space-y-2">
							<div className="flex items-center justify-between text-[10px] text-muted-foreground">
								<span>{t("dashboard.expenseBreakdown.monthlyTrend")}</span>
								<span className="font-medium text-foreground/80">
									<Currency
										amount={
											monthlyTrend[monthlyTrend.length - 1]?.amount ?? 0
										}
										className="text-xs"
									/>
								</span>
							</div>
							<div className="flex gap-1.5">
								{monthlyTrend.length > 0 ? (
									monthlyTrend.map((m, idx) => {
										const maxVal = Math.max(
											...monthlyTrend.map((x) => x.amount),
											1,
										);
										const pct =
											maxVal > 0 ? (m.amount / maxVal) * 100 : 0;
										const isCurrent = idx === monthlyTrend.length - 1;
										return (
											<div
												key={idx}
												className="flex flex-1 flex-col items-center gap-1"
											>
												<div className="relative h-12 w-full min-w-[20px] overflow-hidden rounded-md bg-muted/50">
													<div
														className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500 ${
															isCurrent
																? "bg-gradient-to-t from-sky-500 to-sky-400"
																: "bg-muted-foreground/20"
														}`}
														style={{
															height: `${Math.max(pct, 8)}%`,
														}}
													/>
												</div>
												<span
													className={`text-[9px] ${isCurrent ? "font-semibold text-sky-600 dark:text-sky-400" : "text-muted-foreground"}`}
												>
													{m.month}
												</span>
											</div>
										);
									})
								) : (
									<div className="flex w-full items-center justify-center py-4 text-[10px] text-muted-foreground">
										{t("dashboard.expenseBreakdown.noData")}
									</div>
								)}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);
}
