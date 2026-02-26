"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { Currency } from "@saas/finance/components/shared/Currency";
import { orpc } from "@shared/lib/orpc-query-utils";
import { apiClient } from "@shared/lib/api-client";
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
	ChevronLeft,
	ClipboardList,
	Clock,
	DollarSign,
	FilePlus2,
	HardHat,
	Landmark,
	Plus,
	Receipt,
	TrendingDown,
	TrendingUp,
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
	RENT: "#10b981",
	UTILITIES: "#3b82f6",
	COMMUNICATIONS: "#8b5cf6",
	INSURANCE: "#f59e0b",
	LICENSES: "#06b6d4",
	SUBSCRIPTIONS: "#ec4899",
	MAINTENANCE: "#84cc16",
	BANK_FEES: "#6366f1",
	MARKETING: "#f97316",
	TRANSPORT: "#14b8a6",
	HOSPITALITY: "#a855f7",
	OTHER: "#6b7280",
};

const cashFlowChartConfig: ChartConfig = {
	income: { label: "المقبوضات", color: "#10b981" },
	expense: { label: "المصروفات", color: "#ef4444" },
};

// Glass card style constant
const glassCard =
	"backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5";

export function Dashboard() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const organizationSlug = activeOrganization?.slug ?? "";
	const organizationId = activeOrganization?.id ?? "";

	// Dashboard stats
	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ["dashboard-stats", organizationId],
		queryFn: async () => {
			if (!organizationId) return null;
			return apiClient.dashboard.getStats({ organizationId });
		},
		enabled: !!organizationId,
	});

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

	// Recent activities
	const { data: activities } = useQuery({
		queryKey: ["dashboard-activities", organizationId],
		queryFn: async () => {
			if (!organizationId) return [];
			return apiClient.dashboard.getActivities({ organizationId, limit: 5 });
		},
		enabled: !!organizationId,
	});

	// Upcoming milestones
	const { data: upcomingMilestones } = useQuery({
		queryKey: ["dashboard-upcoming", organizationId],
		queryFn: async () => {
			if (!organizationId) return [];
			return apiClient.dashboard.getUpcoming({ organizationId, limit: 5 });
		},
		enabled: !!organizationId,
	});

	if (statsLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	const bankBalance = orgFinance?.balances?.totalBankBalance ?? 0;
	const cashBalance = orgFinance?.balances?.totalCashBalance ?? 0;
	const totalIncome = orgFinance?.payments?.total ?? 0;
	const totalExpenses = orgFinance?.totalMoneyOut ?? stats?.financials?.totalExpenses ?? 0;
	const netProfit = totalIncome - totalExpenses;
	const projects = projectsData?.projects ?? [];

	// KPI data
	const kpis = [
		{
			label: t("dashboard.kpi.bankBalance"),
			value: bankBalance,
			icon: Landmark,
			iconColor: "text-emerald-600 dark:text-emerald-400",
			bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
			valueColor: "text-emerald-600 dark:text-emerald-400",
		},
		{
			label: t("dashboard.kpi.cashBalance"),
			value: cashBalance,
			icon: Wallet,
			iconColor: "text-blue-600 dark:text-blue-400",
			bgColor: "bg-blue-100 dark:bg-blue-900/30",
			valueColor: "text-blue-600 dark:text-blue-400",
		},
		{
			label: t("dashboard.kpi.netProfit"),
			value: netProfit,
			icon: TrendingUp,
			iconColor: "text-emerald-600 dark:text-emerald-400",
			bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
			valueColor: "text-emerald-600 dark:text-emerald-400",
		},
		{
			label: t("dashboard.kpi.totalIncome"),
			value: totalIncome,
			icon: ArrowDownRight,
			iconColor: "text-emerald-600 dark:text-emerald-400",
			bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
			valueColor: "text-emerald-600 dark:text-emerald-400",
			sub: t("dashboard.kpi.thisMonth"),
		},
		{
			label: t("dashboard.kpi.totalExpenses"),
			value: totalExpenses,
			icon: ArrowUpLeft,
			iconColor: "text-red-600 dark:text-red-400",
			bgColor: "bg-red-100 dark:bg-red-900/30",
			valueColor: "text-red-600 dark:text-red-400",
			sub: t("dashboard.kpi.thisMonth"),
		},
	];

	// Quick Actions - Finance-style two-section cards (section + action)
	const quickActions = [
		{
			icon: TrendingDown,
			sectionLabel: t("dashboard.actions.expenses"),
			actionLabel: t("dashboard.actions.addExpense"),
			browsePath: `/app/${organizationSlug}/finance/expenses`,
			createPath: `/app/${organizationSlug}/finance/expenses/new`,
			iconColor: "text-rose-500 dark:text-rose-400",
			bgColor: "bg-rose-50/80 dark:bg-rose-950/30",
			hoverBg: "hover:bg-rose-100 dark:hover:bg-rose-900/50",
			borderColor: "border-rose-200/50 dark:border-rose-800/50",
		},
		{
			icon: TrendingUp,
			sectionLabel: t("dashboard.actions.payments"),
			actionLabel: t("dashboard.actions.addPayment"),
			browsePath: `/app/${organizationSlug}/finance/payments`,
			createPath: `/app/${organizationSlug}/finance/payments/new`,
			iconColor: "text-teal-500 dark:text-teal-400",
			bgColor: "bg-teal-50/80 dark:bg-teal-950/30",
			hoverBg: "hover:bg-teal-100 dark:hover:bg-teal-900/50",
			borderColor: "border-teal-200/50 dark:border-teal-800/50",
		},
		{
			icon: Receipt,
			sectionLabel: t("dashboard.actions.invoices"),
			actionLabel: t("dashboard.actions.createInvoice"),
			browsePath: `/app/${organizationSlug}/finance/invoices`,
			createPath: `/app/${organizationSlug}/finance/invoices/new`,
			iconColor: "text-emerald-500 dark:text-emerald-400",
			bgColor: "bg-emerald-50/80 dark:bg-emerald-950/30",
			hoverBg: "hover:bg-emerald-100 dark:hover:bg-emerald-900/50",
			borderColor: "border-emerald-200/50 dark:border-emerald-800/50",
		},
		{
			icon: FilePlus2,
			sectionLabel: t("dashboard.actions.pricing"),
			actionLabel: t("dashboard.actions.newQuotation"),
			browsePath: `/app/${organizationSlug}/pricing/quotations`,
			createPath: `/app/${organizationSlug}/pricing/quotations/new`,
			iconColor: "text-violet-500 dark:text-violet-400",
			bgColor: "bg-violet-50/80 dark:bg-violet-950/30",
			hoverBg: "hover:bg-violet-100 dark:hover:bg-violet-900/50",
			borderColor: "border-violet-200/50 dark:border-violet-800/50",
		},
		{
			icon: Calculator,
			sectionLabel: t("dashboard.actions.quantityStudies"),
			actionLabel: t("dashboard.actions.calculateQuantities"),
			browsePath: `/app/${organizationSlug}/quantities`,
			createPath: `/app/${organizationSlug}/quantities`,
			iconColor: "text-amber-500 dark:text-amber-400",
			bgColor: "bg-amber-50/80 dark:bg-amber-950/30",
			hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-900/50",
			borderColor: "border-amber-200/50 dark:border-amber-800/50",
		},
		{
			icon: ClipboardList,
			sectionLabel: t("dashboard.actions.dailyReport"),
			actionLabel: t("dashboard.actions.dailyReport"),
			browsePath: `/app/${organizationSlug}/projects`,
			createPath: `/app/${organizationSlug}/projects`,
			iconColor: "text-cyan-500 dark:text-cyan-400",
			bgColor: "bg-cyan-50/80 dark:bg-cyan-950/30",
			hoverBg: "hover:bg-cyan-100 dark:hover:bg-cyan-900/50",
			borderColor: "border-cyan-200/50 dark:border-cyan-800/50",
			singleSection: true,
		},
		{
			icon: HardHat,
			sectionLabel: t("dashboard.actions.manageCompany"),
			actionLabel: t("dashboard.actions.manageCompany"),
			browsePath: `/app/${organizationSlug}/company`,
			createPath: `/app/${organizationSlug}/company`,
			iconColor: "text-indigo-500 dark:text-indigo-400",
			bgColor: "bg-indigo-50/80 dark:bg-indigo-950/30",
			hoverBg: "hover:bg-indigo-100 dark:hover:bg-indigo-900/50",
			borderColor: "border-indigo-200/50 dark:border-indigo-800/50",
			singleSection: true,
		},
	];

	const totalIncomeChart = cashFlowData.reduce((s, d) => s + d.income, 0);
	const totalExpenseChart = cashFlowData.reduce((s, d) => s + d.expense, 0);
	const netChart = totalIncomeChart - totalExpenseChart;

	return (
		<div className="space-y-4" dir="rtl">
			{/* ═══ KPI CARDS ═══ */}
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
				{kpis.map((kpi, i) => {
					const Icon = kpi.icon;
					return (
						<div
							key={i}
							className={`${glassCard} p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500`}
							style={{ animationDelay: `${i * 60}ms` }}
						>
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{kpi.label}
								</span>
								<div className={`p-1.5 rounded-lg ${kpi.bgColor}`}>
									<Icon className={`h-3.5 w-3.5 ${kpi.iconColor}`} />
								</div>
							</div>
							<p className={`text-lg font-bold ${kpi.valueColor}`}>
								<Currency amount={kpi.value} />
							</p>
							<p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
								{kpi.sub ?? t("dashboard.kpi.vsLastMonth")}
							</p>
						</div>
					);
				})}
			</div>

			{/* ═══ PROJECTS - Compact horizontal cards (image + info) ═══ */}
			<div className="rounded-xl bg-white p-6 shadow-sm dark:bg-slate-900/50 dark:shadow-none">
				<h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
					{t("dashboard.activeProjects")}
				</h2>
				{(() => {
					const COLS = 4;
					const useScroll = projects.length > 4;
					const firstRowProjects = projects.slice(0, COLS);
					const secondRowProjects = projects.slice(COLS, COLS * 2);
					const firstRowEmptyCount = Math.max(0, COLS - firstRowProjects.length);
					const secondRowEmptyCount = Math.max(0, COLS - secondRowProjects.length);

					const projectCardBase =
						"rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/20 flex flex-row overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500 group";
					const cardSizeClass = useScroll
						? "h-[88px] w-[340px] min-w-[340px] shrink-0"
						: "h-[88px] min-w-0";

					const renderProjectCard = (project: (typeof projects)[0], i: number) => {
					const progress = Math.round(project.progress ?? 0);
					const contractValue = project.contractValue ?? 0;
					const days = daysRemaining(project.endDate);
					const coverImageUrl = (project as { photos?: { url: string }[] }).photos?.[0]?.url;
					return (
						<Link
							key={project.id}
							href={`/app/${organizationSlug}/projects/${project.id}`}
							className={`${projectCardBase} ${cardSizeClass}`}
							style={{ animationDelay: `${160 + i * 70}ms` }}
						>
							{/* Square image */}
							<div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
								{coverImageUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img
										src={coverImageUrl}
										alt={project.name || t("projects.unnamed")}
										className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
										loading="lazy"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center bg-slate-200/50 dark:bg-slate-700/50">
										<span className="text-2xl font-bold text-slate-300 dark:text-slate-600">
											{(project.name || "?")[0]}
										</span>
									</div>
								)}
								<div
									className="absolute top-0 right-0 left-0 h-[2px]"
									style={{ background: i % 2 === 0 ? "#10b981" : "#3b82f6" }}
								/>
								<div className="absolute start-1 top-1">
									<Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[8px] px-1 py-0">
										{t(`projects.status.${project.status}`)}
									</Badge>
								</div>
								<div className="absolute end-1 top-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:bg-slate-900/90 dark:text-slate-200">
									{progress}%
								</div>
							</div>
							{/* Info section */}
							<div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 p-2.5">
								<h3 className="wrap-break-word text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
									{project.name || t("projects.unnamed")}
								</h3>
								<p className="wrap-break-word text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
									{project.clientName || "—"}
								</p>
								<div className="mt-2 flex items-center gap-2 text-[9px] text-slate-500 dark:text-slate-400">
									<span title={t("dashboard.project.contractValue")}>
										<Currency amount={contractValue} className="text-[10px] font-semibold text-slate-700 dark:text-slate-300" />
									</span>
									<span>•</span>
									<span>{days} {t("dashboard.project.daysShort")}</span>
								</div>
							</div>
						</Link>
					);
				};

					const newProjectButton = (
						<Link
							href={`/app/${organizationSlug}/projects/new`}
							className={`flex shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-50/50 dark:border-slate-700 dark:hover:bg-emerald-900/10 ${useScroll ? "h-[88px] w-14" : "h-[88px] w-14"}`}
							title={t("projects.newProject")}
						>
							<Plus className="h-6 w-6 text-slate-400" />
						</Link>
					);

					if (useScroll) {
						return (
							<div className="overflow-x-auto pb-2">
								<div className="flex w-max items-stretch gap-3">
									{projects.map((p, i) => renderProjectCard(p, i))}
									{newProjectButton}
								</div>
							</div>
						);
					}

					return (
						<div className="grid w-full grid-cols-[repeat(4,minmax(0,1fr))_auto] gap-3">
							{firstRowProjects.map((p, i) => renderProjectCard(p, i))}
							{Array.from({ length: firstRowEmptyCount }).map((_, idx) => (
								<div key={`empty1-${idx}`} className="h-[88px] rounded-xl border border-dashed border-slate-200 bg-slate-50/30 dark:border-slate-700 dark:bg-slate-900/20" aria-hidden />
							))}
							{newProjectButton}
							{secondRowProjects.length > 0 && (
								<>
									{secondRowProjects.map((p, i) => renderProjectCard(p, i + firstRowProjects.length))}
									{Array.from({ length: secondRowEmptyCount }).map((_, idx) => (
										<div key={`empty2-${idx}`} className="h-[88px] rounded-xl border border-dashed border-slate-200 bg-slate-50/30 dark:border-slate-700 dark:bg-slate-900/20" aria-hidden />
									))}
								</>
							)}
						</div>
					);
				})()}
			</div>

			{/* ═══ QUICK ACTIONS - Finance-style two-section cards ═══ */}
			<div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
				{quickActions.map((action, i) => {
					const Icon = action.icon;
					const isSingleSection = "singleSection" in action && action.singleSection;
					if (isSingleSection) {
						return (
							<Link
								key={i}
								href={action.browsePath}
								className={`overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:shadow-xl dark:border-slate-700/30 dark:bg-slate-900/70 animate-in fade-in slide-in-from-bottom-3 flex flex-col items-center justify-center gap-2 p-4 ${action.bgColor} ${action.hoverBg}`}
								style={{ animationDelay: `${280 + i * 35}ms` }}
							>
								<div
									className={`rounded-xl bg-white/60 p-3 dark:bg-slate-800/60 ${action.iconColor}`}
								>
									<Icon className="h-6 w-6" />
								</div>
								<span className="text-center text-sm font-medium text-slate-700 dark:text-slate-200">
									{action.sectionLabel}
								</span>
							</Link>
						);
					}
					return (
						<div
							key={i}
							className="overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-300 hover:shadow-xl dark:border-slate-700/30 dark:bg-slate-900/70 animate-in fade-in slide-in-from-bottom-3"
							style={{ animationDelay: `${280 + i * 35}ms` }}
						>
							{/* Section (Top) */}
							<Link
								href={action.browsePath}
								className={`flex flex-col items-center gap-2 border-b p-4 transition-colors ${action.bgColor} ${action.hoverBg} ${action.borderColor}`}
							>
								<div
									className={`rounded-xl bg-white/60 p-3 dark:bg-slate-800/60 ${action.iconColor}`}
								>
									<Icon className="h-6 w-6" />
								</div>
								<span className="text-center text-sm font-medium text-slate-700 dark:text-slate-200">
									{action.sectionLabel}
								</span>
							</Link>
							{/* Action (Bottom) */}
							<Link
								href={action.createPath}
								className="flex items-center justify-center gap-2 bg-white/50 p-3 transition-colors hover:bg-white/80 dark:bg-slate-800/30 dark:hover:bg-slate-800/50"
							>
								<Plus className={`h-4 w-4 ${action.iconColor}`} />
								<span className={`text-xs font-medium ${action.iconColor}`}>
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
							<DollarSign className="h-3.5 w-3.5 text-slate-400" />
							<span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
								{t("dashboard.cashFlow.title")}
							</span>
						</div>
						<Link
							href={`/app/${organizationSlug}/finance`}
							className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
						>
							<span>{t("dashboard.cashFlow.goToFinance")}</span>
							<ChevronLeft className="h-3 w-3" />
						</Link>
					</div>

					{/* Chips */}
					<div className="grid grid-cols-3 gap-2 mb-3">
						<div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
							<span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 block">
								<Currency amount={totalIncomeChart} />
							</span>
							<span className="text-[9px] text-slate-500">{t("dashboard.cashFlow.income")}</span>
						</div>
						<div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
							<span className="text-sm font-bold text-red-600 dark:text-red-400 block">
								<Currency amount={totalExpenseChart} />
							</span>
							<span className="text-[9px] text-slate-500">{t("dashboard.cashFlow.expenses")}</span>
						</div>
						<div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
							<span className="text-sm font-bold text-blue-600 dark:text-blue-400 block">
								<Currency amount={netChart} />
							</span>
							<span className="text-[9px] text-slate-500">{t("dashboard.cashFlow.net")}</span>
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
									<stop offset="0%" stopColor="#10b981" stopOpacity={0.22} />
									<stop offset="100%" stopColor="#10b981" stopOpacity={0} />
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
								stroke="#10b981"
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
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
								<Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
							</div>
							<span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
								{t("dashboard.expenseBreakdown.title")}
							</span>
						</div>
						<Link
							href={`/app/${organizationSlug}/company/expenses`}
							className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
						>
							{t("dashboard.expenseBreakdown.details")}
							<ChevronLeft className="h-3.5 w-3.5" />
						</Link>
					</div>

					{/* Main content - fills remaining space */}
					<div className="flex flex-1 min-h-0 flex-col gap-3 px-4 pb-4">
						{expenseBreakdown.length === 0 && monthlyExpenses.length === 0 ? (
							<div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("dashboard.expenseBreakdown.noData")}
								</p>
								<Link
									href={`/app/${organizationSlug}/company/expenses`}
									className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
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
													<span className="text-lg font-bold text-slate-700 dark:text-slate-200">
														{expenseBreakdown.reduce((s, e) => s + e.value, 0)}%
													</span>
												</div>
											</>
										) : (
											<div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50">
												<span className="text-2xl font-bold text-slate-300 dark:text-slate-600">—</span>
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
												<span className="flex-1 truncate text-xs text-slate-600 dark:text-slate-300">{entry.name}</span>
												<span className="text-xs font-bold tabular-nums text-slate-800 dark:text-slate-100">{entry.value}%</span>
											</div>
										))}
									</div>
								</div>

								{/* Monthly trend - compact horizontal bars */}
								<div className="shrink-0 space-y-2">
									<div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
										<span>{t("dashboard.expenseBreakdown.monthlyTrend")}</span>
										<span className="font-medium text-slate-700 dark:text-slate-200">
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
														<div className="relative h-12 w-full min-w-[20px] overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800/50">
															<div
																className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-all duration-500 ${
																	isCurrent
																		? "bg-gradient-to-t from-emerald-500 to-emerald-400"
																		: "bg-slate-300/60 dark:bg-slate-600/40"
																}`}
																style={{ height: `${Math.max(pct, 8)}%` }}
															/>
														</div>
														<span className={`text-[9px] ${isCurrent ? "font-semibold text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
															{m.month}
														</span>
													</div>
												);
											})
										) : (
											<div className="flex w-full items-center justify-center py-4 text-[10px] text-slate-400">
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
							<Bell className="h-3.5 w-3.5 text-slate-400" />
							<span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
								{t("dashboard.recentActivity.title")}
							</span>
						</div>
						<Link
							href={`/app/${organizationSlug}/projects`}
							className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
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
									claim: { bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-500", icon: Receipt },
									issue: { bg: "bg-red-50 dark:bg-red-900/20", color: "text-red-500", icon: AlertTriangle },
								};
								const config = iconConfig[activity.type] ?? iconConfig.issue;
								const ActivityIcon = config.icon;
								return (
									<div
										key={`${activity.type}-${activity.id}-${idx}`}
										className="flex items-start gap-2 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 animate-in fade-in slide-in-from-right-2 duration-300"
										style={{ animationDelay: `${620 + idx * 50}ms` }}
									>
										<div className={`w-6 h-6 rounded-md ${config.bg} flex items-center justify-center shrink-0`}>
											<ActivityIcon className={`h-3 w-3 ${config.color}`} />
										</div>
										<div className="min-w-0">
											<p className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate">
												{activity.title}
											</p>
											<p className="text-[8px] text-slate-400">
												{formatRelativeTime(activity.createdAt)}
											</p>
										</div>
									</div>
								);
							})
						) : (
							<p className="text-center text-[11px] text-slate-400 py-4">
								{t("dashboard.noRecentActivities")}
							</p>
						)}
					</div>

					{/* Upcoming Payments/Milestones */}
					<div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
						<div className="flex items-center gap-1.5 mb-2">
							<Clock className="h-3 w-3 text-slate-400" />
							<span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
								{t("dashboard.upcomingPayments.title")}
							</span>
						</div>
						{upcomingMilestones && upcomingMilestones.length > 0 ? (
							upcomingMilestones.slice(0, 2).map((m: Milestone) => (
								<Link
									key={m.id}
									href={`/app/${organizationSlug}/projects/${m.project.id}/execution`}
									className="flex items-center justify-between p-2 rounded-md bg-slate-50/80 dark:bg-slate-800/30 mb-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
								>
									<div>
										<p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
											{m.project.name}
										</p>
										<p className="text-[8px] text-slate-400">
											{m.title} — {m.plannedEnd ? formatDate(m.plannedEnd) : ""}
										</p>
									</div>
									<span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
										{m.progress}%
									</span>
								</Link>
							))
						) : (
							<p className="text-center text-[10px] text-slate-400 py-2">
								{t("dashboard.noUpcomingMilestones")}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
