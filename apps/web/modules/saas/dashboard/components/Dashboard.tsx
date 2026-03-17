"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { Currency } from "@saas/finance/components/shared/Currency";
import { CircleProgress } from "./CircleProgress";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Progress } from "@ui/components/progress";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import {
	AlertTriangle,
	ArrowDownRight,
	ArrowUpLeft,
	Bell,
	Calculator,
	CheckCircle2,
	ChevronLeft,
	ClipboardList,
	Clock,
	DollarSign,
	FilePlus2,
	HardHat,
	Landmark,
	Lightbulb,
	Plus,
	Receipt,
	TrendingDown,
	TrendingUp,
	UserSearch,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from "recharts";

// Type definitions
interface Milestone {
	id: string;
	title: string;
	plannedEnd: Date | string | null;
	status: string;
	progress: number;
	project: { id: string; name: string };
}

interface Activity {
	type: "change_order" | "claim" | "issue";
	id: string;
	title: string;
	createdAt: Date | string;
	createdBy: { id: string; name: string };
	project: { id: string; name: string };
	metadata?: Record<string, unknown>;
}

function formatDate(date: Date | string): string {
	return new Date(date).toLocaleDateString("ar-SA", {
		month: "short",
		day: "numeric",
	});
}

function formatRelativeTime(date: Date | string): string {
	const now = new Date();
	const d = new Date(date);
	const diffMs = now.getTime() - d.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffHours < 1) return "الآن";
	if (diffHours < 24) return `منذ ${diffHours} ساعة`;
	if (diffDays === 1) return "أمس";
	return `منذ ${diffDays} يوم`;
}

function daysRemaining(endDate: Date | string | null): number {
	if (!endDate) return 0;
	const now = new Date();
	const end = new Date(endDate);
	return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// Mock data for charts (will be replaced with real data later)
const cashFlowData = [
	{ day: "السبت", income: 45000, expense: 12000 },
	{ day: "الأحد", income: 32000, expense: 8000 },
	{ day: "الاثنين", income: 0, expense: 15000 },
	{ day: "الثلاثاء", income: 78000, expense: 22000 },
	{ day: "الأربعاء", income: 15000, expense: 5000 },
	{ day: "الخميس", income: 120000, expense: 35000 },
	{ day: "الجمعة", income: 0, expense: 0 },
];

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

const cashFlowChartConfig: ChartConfig = {
	income: { label: "المقبوضات", color: "#0ea5e9" },
	expense: { label: "المصروفات", color: "#ef4444" },
};

// Glass card style constant
const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

export function Dashboard() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationSlug = activeOrganization?.slug ?? "";
	const organizationId = activeOrganization?.id ?? "";

	// Combined dashboard data — single API call for stats + activities + upcoming
	const { data: dashboardData, isLoading: statsLoading } = useQuery({
		...orpc.dashboard.getAll.queryOptions({
			input: { organizationId, activitiesLimit: 5, upcomingLimit: 5 },
		}),
		enabled: !!organizationId,
		staleTime: STALE_TIMES.DASHBOARD_STATS,
	});

	const stats = dashboardData?.stats ?? null;
	const activities = dashboardData?.activities ?? [];
	const upcomingMilestones = dashboardData?.upcoming ?? [];

	// Org financial data (bank, cash, profit)
	const { data: orgFinance } = useQuery(
		orpc.finance.orgDashboard.queryOptions({
			input: { organizationId },
		}),
	);

	// Projects list
	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId, status: "ACTIVE" as const },
		}),
	);

	// Company expense dashboard data (from قسم المنشأة)
	const { data: companyExpenseData } = useQuery({
		...orpc.company.expenses.getDashboardData.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	// Derived: expense breakdown for pie chart (from byCategory)
	const expenseBreakdown = (() => {
		const byCat = companyExpenseData?.byCategory ?? {};
		const total = Object.values(byCat).reduce((s, v) => s + v, 0);
		if (total === 0) return [];
		return Object.entries(byCat)
			.map(([cat, amt]) => ({
				name: t(`company.expenses.categories.${cat}`),
				value: Math.round((amt / total) * 100),
				color: COMPANY_EXPENSE_COLORS[cat] ?? "#6b7280",
			}))
			.filter((e) => e.value > 0)
			.sort((a, b) => b.value - a.value);
	})();

	// Derived: monthly expenses for bar chart (from expense runs)
	const monthlyExpenses = (companyExpenseData?.monthlyExpenses ?? []).map((m) => ({
		month: t(`dashboard.expenseBreakdown.months.${m.month}`),
		amount: m.amount,
	}));

	if (statsLoading) {
		return <HomeDashboardSkeleton />;
	}

	const bankBalance = orgFinance?.balances?.totalBankBalance ?? 0;
	const cashBalance = orgFinance?.balances?.totalCashBalance ?? 0;
	const totalIncome = orgFinance?.payments?.total ?? 0;
	const totalExpenses = orgFinance?.totalMoneyOut ?? stats?.financials?.totalExpenses ?? 0;
	const projects = projectsData?.projects ?? [];

	// Suggested actions (mock data — replace with real API endpoints)
	const suggestedActions = [
		{
			id: "overdue-invoices",
			icon: AlertTriangle,
			iconColor: "text-red-500",
			bgColor: "bg-red-50 dark:bg-red-950/20",
			text: t("dashboard.suggestedActions.overdueInvoices", { count: 3, amount: "45,000" }),
			buttonLabel: t("dashboard.suggestedActions.collect"),
			buttonColor: "text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-950/30 dark:hover:bg-red-950/50",
			href: `/app/${organizationSlug}/finance/invoices`,
			priority: "hot" as const,
		},
		{
			id: "expiring-quote",
			icon: Clock,
			iconColor: "text-orange-500",
			bgColor: "bg-orange-50 dark:bg-orange-950/20",
			text: t("dashboard.suggestedActions.expiringQuote", { id: "1042", days: 3 }),
			buttonLabel: t("dashboard.suggestedActions.followUp"),
			buttonColor: "text-orange-600 bg-orange-50 hover:bg-orange-100 dark:text-orange-400 dark:bg-orange-950/30 dark:hover:bg-orange-950/50",
			href: `/app/${organizationSlug}/pricing/quotations`,
			priority: "warm" as const,
		},
		{
			id: "due-payment",
			icon: CheckCircle2,
			iconColor: "text-green-500",
			bgColor: "bg-green-50 dark:bg-green-950/20",
			text: t("dashboard.suggestedActions.duePayment", { project: projects[0]?.name ?? "—" }),
			buttonLabel: t("dashboard.suggestedActions.record"),
			buttonColor: "text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-950/30 dark:hover:bg-green-950/50",
			href: `/app/${organizationSlug}/finance/payments`,
			priority: "normal" as const,
		},
	];

	// Dynamic amount color: positive=green, negative=red, zero=muted
	const getAmountColor = (value: number, type: "income" | "expense" | "balance") => {
		if (type === "expense") return "text-red-600 dark:text-red-400";
		if (value > 0) return "text-green-600 dark:text-green-400";
		if (value < 0) return "text-red-600 dark:text-red-400";
		return "text-muted-foreground";
	};

	// KPI data
	const kpis = [
		{
			label: t("dashboard.kpi.bankBalance"),
			value: bankBalance,
			icon: Landmark,
			iconColor: "text-sky-600 dark:text-sky-400",
			bgColor: "bg-sky-100 dark:bg-sky-900/30",
			valueColor: getAmountColor(bankBalance, "balance"),
		},
		{
			label: t("dashboard.kpi.cashBalance"),
			value: cashBalance,
			icon: Wallet,
			iconColor: "text-blue-600 dark:text-blue-400",
			bgColor: "bg-blue-100 dark:bg-blue-900/30",
			valueColor: getAmountColor(cashBalance, "balance"),
		},
		{
			label: t("dashboard.kpi.totalIncome"),
			value: totalIncome,
			icon: ArrowDownRight,
			iconColor: "text-sky-600 dark:text-sky-400",
			bgColor: "bg-sky-100 dark:bg-sky-900/30",
			valueColor: getAmountColor(totalIncome, "income"),
			sub: t("dashboard.kpi.thisMonth"),
		},
		{
			label: t("dashboard.kpi.totalExpenses"),
			value: totalExpenses,
			icon: ArrowUpLeft,
			iconColor: "text-red-600 dark:text-red-400",
			bgColor: "bg-red-100 dark:bg-red-900/30",
			valueColor: getAmountColor(totalExpenses, "expense"),
			sub: t("dashboard.kpi.thisMonth"),
		},
	];

	// Quick Actions - Finance-style two-section cards (section + action)
	const quickActions = [
		{
			id: "expenses",
			icon: TrendingDown,
			sectionLabel: t("dashboard.actions.expenses"),
			actionLabel: t("dashboard.actions.addExpense"),
			browsePath: `/app/${organizationSlug}/finance/expenses`,
			createPath: `/app/${organizationSlug}/finance/expenses/new`,
			iconColor: "text-red-500",
			iconBg: "bg-red-50 dark:bg-red-950/30",
		},
		{
			id: "payments",
			icon: TrendingUp,
			sectionLabel: t("dashboard.actions.payments"),
			actionLabel: t("dashboard.actions.addPayment"),
			browsePath: `/app/${organizationSlug}/finance/payments`,
			createPath: `/app/${organizationSlug}/finance/payments/new`,
			iconColor: "text-emerald-500",
			iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
		},
		{
			id: "invoices",
			icon: Receipt,
			sectionLabel: t("dashboard.actions.invoices"),
			actionLabel: t("dashboard.actions.createInvoice"),
			browsePath: `/app/${organizationSlug}/finance/invoices`,
			createPath: `/app/${organizationSlug}/finance/invoices/new`,
			iconColor: "text-blue-500",
			iconBg: "bg-blue-50 dark:bg-blue-950/30",
		},
		{
			id: "pricing",
			icon: FilePlus2,
			sectionLabel: t("dashboard.actions.pricing"),
			actionLabel: t("dashboard.actions.newQuotation"),
			browsePath: `/app/${organizationSlug}/pricing/quotations`,
			createPath: `/app/${organizationSlug}/pricing/quotations/new`,
			iconColor: "text-blue-500",
			iconBg: "bg-blue-50 dark:bg-blue-950/30",
		},
		{
			id: "quantities",
			icon: Calculator,
			sectionLabel: t("dashboard.actions.quantityStudies"),
			actionLabel: t("dashboard.actions.calculateQuantities"),
			browsePath: `/app/${organizationSlug}/quantities`,
			createPath: `/app/${organizationSlug}/quantities`,
			iconColor: "text-blue-500",
			iconBg: "bg-blue-50 dark:bg-blue-950/30",
		},
		{
			id: "leads",
			icon: UserSearch,
			sectionLabel: t("dashboard.actions.leads"),
			actionLabel: t("dashboard.actions.newLead"),
			browsePath: `/app/${organizationSlug}/pricing/leads`,
			createPath: `/app/${organizationSlug}/pricing/leads/new`,
			iconColor: "text-blue-500",
			iconBg: "bg-blue-50 dark:bg-blue-950/30",
		},
		// Hidden cards — kept in code but filtered out below
		{
			id: "dailyReport",
			icon: ClipboardList,
			sectionLabel: t("dashboard.actions.dailyReport"),
			actionLabel: t("dashboard.actions.dailyReport"),
			browsePath: `/app/${organizationSlug}/projects`,
			createPath: `/app/${organizationSlug}/projects`,
			iconColor: "text-blue-500",
			iconBg: "bg-blue-50 dark:bg-blue-950/30",
		},
		{
			id: "manageCompany",
			icon: HardHat,
			sectionLabel: t("dashboard.actions.manageCompany"),
			actionLabel: t("dashboard.actions.manageCompany"),
			browsePath: `/app/${organizationSlug}/company`,
			createPath: `/app/${organizationSlug}/company`,
			iconColor: "text-blue-500",
			iconBg: "bg-blue-50 dark:bg-blue-950/30",
		},
	];

	// Filter out hidden cards (facility & daily report)
	const hiddenActions = new Set(["dailyReport", "manageCompany"]);
	const visibleActions = quickActions.filter((a) => !hiddenActions.has(a.id));

	const totalIncomeChart = cashFlowData.reduce((s, d) => s + d.income, 0);
	const totalExpenseChart = cashFlowData.reduce((s, d) => s + d.expense, 0);
	const netChart = totalIncomeChart - totalExpenseChart;

	return (
		<div className="space-y-4" dir="rtl">
			{/* ═══ KPI CARDS ═══ */}
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				{kpis.map((kpi, i) => {
					const Icon = kpi.icon;
					return (
						<div
							key={i}
							className={`${glassCard} masar-glow p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500`}
							style={{ animationDelay: `${i * 60}ms` }}
						>
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-medium text-muted-foreground">
									{kpi.label}
								</span>
								<div className={`p-1.5 rounded-lg ${kpi.bgColor}`}>
									<Icon className={`h-3.5 w-3.5 ${kpi.iconColor}`} />
								</div>
							</div>
							<p className={`text-lg font-bold ${kpi.valueColor}`}>
								<Currency amount={kpi.value} />
							</p>
							<p className="text-[10px] text-muted-foreground/70 mt-1">
								{kpi.sub ?? t("dashboard.kpi.vsLastMonth")}
							</p>
						</div>
					);
				})}
			</div>

			{/* ═══ SUGGESTED ACTIONS + ACTIVE PROJECTS ═══ */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{/* Card 1: Suggested Actions (Right side in RTL) */}
				<div
					className={`${glassCard} flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500`}
					style={{ animationDelay: "160ms", maxHeight: 260 }}
				>
					<div className="flex items-center gap-2 px-4 pt-3 pb-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
							<Lightbulb className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
						</div>
						<h3 className="text-sm font-semibold text-foreground">
							{t("dashboard.suggestedActions.title")}
						</h3>
					</div>
					<div className="flex-1 space-y-2 overflow-y-auto px-4 pb-3">
						{suggestedActions.length === 0 ? (
							<div className="flex flex-1 items-center justify-center py-8">
								<p className="text-sm text-muted-foreground">
									{t("dashboard.suggestedActions.noActions")}
								</p>
							</div>
						) : (
							suggestedActions.map((action) => {
								const ActionIcon = action.icon;
								return (
									<Link
										key={action.id}
										href={action.href}
										className={`flex items-center gap-3 rounded-xl border p-3 transition-transform duration-150 hover:-translate-x-0.5 hover:shadow-sm ${
											action.priority === "hot"
												? "border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10"
												: action.priority === "warm"
													? "border-orange-200 bg-orange-50/50 dark:border-orange-900/30 dark:bg-orange-950/10"
													: "border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/10"
										}`}
									>
										<div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.bgColor}`}>
											<ActionIcon className={`h-4 w-4 ${action.iconColor}`} />
										</div>
										<span className="flex-1 text-xs font-medium text-foreground/80">
											{action.text}
										</span>
										<span className={`shrink-0 rounded-lg px-3 py-1 text-xs font-bold ${action.buttonColor}`}>
											{action.buttonLabel}
										</span>
									</Link>
								);
							})
						)}
					</div>
				</div>

				{/* Card 2: Active Projects (Left side in RTL) */}
				<div
					className={`${glassCard} flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500`}
					style={{ animationDelay: "220ms", maxHeight: 260 }}
				>
					<div className="flex items-center justify-between px-4 pt-3 pb-2">
						<h3 className="text-sm font-semibold text-foreground">
							{t("dashboard.activeProjects")}
						</h3>
						<Link
							href={`/app/${organizationSlug}/projects`}
							className="flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-2 py-1 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
						>
							<span>{t("dashboard.viewAll")}</span>
							<ChevronLeft className="h-3 w-3" />
						</Link>
					</div>
					<div className="flex-1 overflow-y-auto px-4 pb-3">
						{projects.length === 0 ? (
							<div className="flex flex-col items-center justify-center gap-3 py-6">
								<p className="text-sm text-muted-foreground">
									{t("dashboard.emptyProjects.description")}
								</p>
								<Link
									href={`/app/${organizationSlug}/projects/new`}
									className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
								>
									<Plus className="h-4 w-4" />
									{t("dashboard.emptyProjects.cta")}
								</Link>
							</div>
						) : (
							projects.slice(0, 3).map((project, idx) => {
								const progress = Math.round(Number(project.progress ?? 0));
								const contractValue = project.contractValue ?? 0;
								const progressColor = progress > 80 ? "#22c55e" : "#0ea5e9";
								return (
									<Link
										key={project.id}
										href={`/app/${organizationSlug}/projects/${project.id}`}
										className={`block py-2.5 transition-transform duration-150 hover:-translate-x-0.5 ${
											idx < Math.min(projects.length, 3) - 1 ? "border-b border-gray-50 dark:border-gray-800/50" : ""
										}`}
									>
										<div className="flex items-center gap-3">
											<CircleProgress
												percentage={progress}
												size={40}
												color={progressColor}
											/>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-2">
													<h4 className="text-sm font-bold text-foreground truncate">
														{project.name || t("projects.unnamed")}
													</h4>
													<div className="flex items-center gap-2 shrink-0">
														<span className="font-extrabold text-sm" style={{ color: progressColor }}>
															{progress}%
														</span>
														<Badge className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-0">
															{t(`projects.status.${project.status}`)}
														</Badge>
													</div>
												</div>
												<p className="text-xs text-gray-400 mt-0.5">
													<Currency amount={contractValue} />
												</p>
											</div>
										</div>
										<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
											<div
												className="h-full rounded-full transition-all duration-1000 ease-out"
												style={{
													width: `${progress}%`,
													background: progress > 80
														? "linear-gradient(90deg, #22c55e, #4ade80)"
														: "linear-gradient(90deg, #0ea5e9, #38bdf8)",
												}}
											/>
										</div>
									</Link>
								);
							})
						)}
					</div>
				</div>
			</div>

			{/* ═══ QUICK ACTIONS - Unified card design ═══ */}
			<div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
				{visibleActions.map((action, i) => {
					const Icon = action.icon;
					return (
						<div
							key={action.id}
							className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900 animate-in fade-in slide-in-from-bottom-3"
							style={{ animationDelay: `${280 + i * 35}ms` }}
						>
							{/* Section (Top) */}
							<Link
								href={action.browsePath}
								className="flex flex-col items-center gap-2 border-b border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
							>
								<div
									className={`rounded-xl p-3 ${action.iconBg}`}
								>
									<Icon className={`h-6 w-6 ${action.iconColor}`} />
								</div>
								<span className="text-center text-sm font-medium text-foreground/80">
									{action.sectionLabel}
								</span>
							</Link>
							{/* Action (Bottom) */}
							<Link
								href={action.createPath}
								className="flex items-center justify-center gap-2 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
							>
								<Plus className="h-4 w-4 text-primary" />
								<span className="text-sm font-medium text-primary hover:text-primary/80">
									{action.actionLabel}
								</span>
							</Link>
						</div>
					);
				})}
			</div>

			{/* ═══ BOTTOM SECTION ═══ */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-11 lg:items-stretch">
				{/* Cash Flow Chart */}
				<div
					className={`${glassCard} flex h-full min-h-[240px] flex-col p-4 lg:col-span-5 animate-in fade-in slide-in-from-bottom-3 duration-500`}
					style={{ animationDelay: "450ms" }}
				>
					{/* Header */}
					<div className="flex items-center justify-between mb-3">
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

					{/* Chips */}
					<div className="grid grid-cols-3 gap-2 mb-3">
						<div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
							<span className={`text-sm font-bold block ${getAmountColor(totalIncomeChart, "income")}`}>
								<Currency amount={totalIncomeChart} />
							</span>
							<span className="text-[9px] text-muted-foreground">{t("dashboard.cashFlow.income")}</span>
						</div>
						<div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
							<span className="text-sm font-bold text-red-600 dark:text-red-400 block">
								<Currency amount={totalExpenseChart} />
							</span>
							<span className="text-[9px] text-muted-foreground">{t("dashboard.cashFlow.expenses")}</span>
						</div>
						<div className={`text-center p-2 rounded-lg ${netChart >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
							<span className={`text-sm font-bold block ${getAmountColor(netChart, "balance")}`}>
								<Currency amount={netChart} />
							</span>
							<span className="text-[9px] text-muted-foreground">{t("dashboard.cashFlow.net")}</span>
						</div>
					</div>

					{/* Chart */}
					<ChartContainer config={cashFlowChartConfig} className="h-40 w-full">
						<AreaChart
							data={cashFlowData}
							margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
						>
							<defs>
								<linearGradient id="dashIncomeGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.22} />
									<stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
								</linearGradient>
								<linearGradient id="dashExpenseGrad" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stopColor="#ef4444" stopOpacity={0.12} />
									<stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" vertical={false} />
							<XAxis
								dataKey="day"
								tickLine={false}
								axisLine={false}
								fontSize={9}
								tickMargin={6}
							/>
							<YAxis hide />
							<ChartTooltip
								content={<ChartTooltipContent />}
							/>
							<Area
								type="monotone"
								dataKey="income"
								stroke="#0ea5e9"
								fill="url(#dashIncomeGrad)"
								strokeWidth={2}
								dot={false}
							/>
							<Area
								type="monotone"
								dataKey="expense"
								stroke="#ef4444"
								fill="url(#dashExpenseGrad)"
								strokeWidth={1.5}
								dot={false}
							/>
						</AreaChart>
					</ChartContainer>
				</div>

				{/* Expense Breakdown - Modern 2026 design */}
				<div
					className={`${glassCard} lg:col-span-3 flex h-full min-h-[240px] flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500`}
					style={{ animationDelay: "520ms" }}
				>
					{/* Compact header */}
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

					{/* Main content - fills remaining space */}
					<div className="flex flex-1 min-h-0 flex-col gap-3 px-4 pb-4">
						{expenseBreakdown.length === 0 && monthlyExpenses.length === 0 ? (
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
								{/* Donut + Legend - integrated layout */}
								<div className="flex flex-1 min-h-0 items-center gap-4">
									<div className="relative h-28 w-28 shrink-0">
										{expenseBreakdown.length > 0 ? (
											<>
												<ChartContainer
													config={{ value: { label: "القيمة" } }}
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
												<span className="text-2xl font-bold text-muted-foreground/50">—</span>
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
												<span className="flex-1 truncate text-xs text-foreground/80">{entry.name}</span>
												<span className="text-xs font-bold tabular-nums text-foreground">{entry.value}%</span>
											</div>
										))}
									</div>
								</div>

								{/* Monthly trend - compact horizontal bars */}
								<div className="shrink-0 space-y-2">
									<div className="flex items-center justify-between text-[10px] text-muted-foreground">
										<span>{t("dashboard.expenseBreakdown.monthlyTrend")}</span>
										<span className="font-medium text-foreground/80">
											<Currency amount={monthlyExpenses[monthlyExpenses.length - 1]?.amount ?? 0} className="text-xs" />
										</span>
									</div>
									<div className="flex gap-1.5">
										{monthlyExpenses.length > 0 ? (
											monthlyExpenses.map((m, idx) => {
												const maxVal = Math.max(...monthlyExpenses.map((x) => x.amount), 1);
												const pct = maxVal > 0 ? (m.amount / maxVal) * 100 : 0;
												const isCurrent = idx === monthlyExpenses.length - 1;
												return (
													<div key={idx} className="flex flex-1 flex-col items-center gap-1">
														<div className="relative h-12 w-full min-w-[20px] overflow-hidden rounded-md bg-muted/50">
															<div
																className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500 ${
																	isCurrent
																		? "bg-gradient-to-t from-sky-500 to-sky-400"
																		: "bg-muted-foreground/20"
																}`}
																style={{ height: `${Math.max(pct, 8)}%` }}
															/>
														</div>
														<span className={`text-[9px] ${isCurrent ? "font-semibold text-sky-600 dark:text-sky-400" : "text-muted-foreground"}`}>
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

				{/* Recent Activity + Upcoming Payments */}
				<div
					className={`${glassCard} flex h-full min-h-[240px] flex-col p-4 lg:col-span-3 animate-in fade-in slide-in-from-bottom-3 duration-500`}
					style={{ animationDelay: "580ms" }}
				>
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-1.5">
							<Bell className="h-3.5 w-3.5 text-muted-foreground" />
							<span className="text-[11px] font-semibold text-muted-foreground">
								{t("dashboard.recentActivity.title")}
							</span>
						</div>
						<Link
							href={`/app/${organizationSlug}/projects`}
							className="flex items-center gap-1 text-[10px] text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 px-2 py-1 rounded-md hover:bg-sky-100 dark:hover:bg-sky-900/30 transition-colors"
						>
							<span>{t("dashboard.viewAll")}</span>
							<ChevronLeft className="h-3 w-3" />
						</Link>
					</div>

					{/* Activities List */}
					<div className="flex-1 space-y-1 overflow-hidden">
						{activities && activities.length > 0 ? (
							activities.slice(0, 4).map((activity: Activity, idx: number) => {
								const iconConfig = {
									change_order: { bg: "bg-amber-50 dark:bg-amber-900/20", color: "text-amber-500", icon: TrendingUp },
									claim: { bg: "bg-sky-50 dark:bg-sky-900/20", color: "text-sky-500", icon: Receipt },
									issue: { bg: "bg-red-50 dark:bg-red-900/20", color: "text-red-500", icon: AlertTriangle },
								};
								const config = iconConfig[activity.type] ?? iconConfig.issue;
								const ActivityIcon = config.icon;
								return (
									<div
										key={`${activity.type}-${activity.id}-${idx}`}
										className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0 animate-in fade-in slide-in-from-right-2 duration-300"
										style={{ animationDelay: `${620 + idx * 50}ms` }}
									>
										<div className={`w-6 h-6 rounded-md ${config.bg} flex items-center justify-center shrink-0`}>
											<ActivityIcon className={`h-3 w-3 ${config.color}`} />
										</div>
										<div className="min-w-0">
											<p className="text-[10px] font-medium text-foreground/80 truncate">
												{activity.title}
											</p>
											<p className="text-[8px] text-muted-foreground">
												{formatRelativeTime(activity.createdAt)}
											</p>
										</div>
									</div>
								);
							})
						) : (
							<p className="text-center text-[11px] text-muted-foreground py-4">
								{t("dashboard.noRecentActivities")}
							</p>
						)}
					</div>

					{/* Upcoming Payments/Milestones */}
					<div className="mt-3 pt-3 border-t border-border/50">
						<div className="flex items-center gap-1.5 mb-2">
							<Clock className="h-3 w-3 text-muted-foreground" />
							<span className="text-[10px] font-semibold text-muted-foreground">
								{t("dashboard.upcomingPayments.title")}
							</span>
						</div>
						{upcomingMilestones && upcomingMilestones.length > 0 ? (
							upcomingMilestones.slice(0, 2).map((m) => (
								<Link
									key={m.id}
									href={`/app/${organizationSlug}/projects/${m.project.id}/execution`}
									className="flex items-center justify-between p-2 rounded-md bg-muted/40 mb-1.5 hover:bg-muted/60 transition-colors"
								>
									<div>
										<p className="text-[10px] font-semibold text-foreground/80">
											{m.project.name}
										</p>
										<p className="text-[8px] text-muted-foreground">
											{m.title} — {m.plannedEnd ? formatDate(m.plannedEnd) : ""}
										</p>
									</div>
									<span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
										{Number(m.progress)}%
									</span>
								</Link>
							))
						) : (
							<p className="text-center text-[10px] text-muted-foreground py-2">
								{t("dashboard.noUpcomingMilestones")}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
