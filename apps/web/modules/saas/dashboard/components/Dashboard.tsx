"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { Currency } from "@saas/finance/components/shared/Currency";
import { CircleProgress } from "./CircleProgress";
import { JourneyFlow, useJourneySteps } from "./JourneyFlow";
import { FinanceCard } from "./FinanceCard";
import { DashboardTips } from "./DashboardTips";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@saas/auth/hooks/use-session";
import { Badge } from "@ui/components/badge";
import {
	AlertTriangle,
	BarChart3,
	Calculator,
	CheckCircle2,
	ChevronLeft,
	Clock,
	FilePlus2,
	Landmark,
	Lightbulb,
	Plus,
	Receipt,
	TrendingDown,
	TrendingUp,
	UserSearch,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

// Helper: progress color
function getProgressColor(progress: number): string {
	if (progress > 70) return "#10b981";
	if (progress >= 30) return "#f59e0b";
	return "#94a3b8";
}

function getProgressTextClass(progress: number): string {
	if (progress > 70) return "text-emerald-600 dark:text-emerald-400";
	if (progress >= 30) return "text-amber-600 dark:text-amber-400";
	return "text-gray-500 dark:text-gray-400";
}

interface SuggestedAction {
	id: string;
	icon: typeof AlertTriangle;
	iconColor: string;
	bgColor: string;
	text: string;
	buttonLabel: string;
	href: string;
	priority: "hot" | "warm" | "normal";
}

export function Dashboard() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const { user } = useSession();
	const organizationSlug = activeOrganization?.slug ?? "";
	const organizationId = activeOrganization?.id ?? "";
	const orgName = activeOrganization?.name ?? "";
	const { completedCount, totalCount, incompleteSteps } = useJourneySteps();

	const { data: dashboardData, isLoading: statsLoading } = useQuery({
		...orpc.dashboard.getAll.queryOptions({
			input: { organizationId, activitiesLimit: 5, upcomingLimit: 5 },
		}),
		enabled: !!organizationId,
		staleTime: STALE_TIMES.DASHBOARD_STATS,
	});

	const stats = dashboardData?.stats ?? null;
	const upcomingMilestones = dashboardData?.upcoming ?? [];

	const { data: orgFinance } = useQuery(
		orpc.finance.orgDashboard.queryOptions({ input: { organizationId } }),
	);

	const { data: financeDashboard } = useQuery({
		...orpc.finance.dashboard.queryOptions({ input: { organizationId } }),
		enabled: !!organizationId,
	});

	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({ input: { organizationId, status: "ACTIVE" as const } }),
	);

	const { data: onboardingProgress } = useQuery({
		...orpc.onboarding.getProgress.queryOptions({ input: { organizationId } }),
		enabled: !!organizationId,
	});

	if (statsLoading) return <HomeDashboardSkeleton />;

	const totalIncome = orgFinance?.payments?.total ?? 0;
	const totalExpenses = orgFinance?.totalMoneyOut ?? stats?.financials?.totalExpenses ?? 0;
	const netProfit = totalIncome - totalExpenses;
	const totalContractValue = stats?.financials?.totalContractValue ?? 0;
	const totalInvoiced = financeDashboard?.stats?.invoices?.totalValue ?? 0;
	const totalPaid = financeDashboard?.stats?.invoices?.paidValue ?? 0;
	const collectionRate = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;
	const projects = projectsData?.projects ?? [];

	const isNewUser =
		(!onboardingProgress?.wizardCompleted || projects.length <= 1) &&
		(financeDashboard?.stats?.invoices?.total ?? 0) === 0;

	// ═══ SUGGESTED ACTIONS (real data) ═══
	const suggestedActions: SuggestedAction[] = [];

	const overdueInvoices = financeDashboard?.overdueInvoices ?? [];
	if (overdueInvoices.length > 0) {
		const amt = overdueInvoices.reduce((s, inv) => s + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0);
		suggestedActions.push({
			id: "overdue-invoices", icon: AlertTriangle, iconColor: "text-red-500",
			bgColor: "bg-red-50 dark:bg-red-950/20",
			text: t("dashboard.suggestedActions.overdueInvoices", { count: overdueInvoices.length, amount: Math.round(amt).toLocaleString("ar-SA") }),
			buttonLabel: t("dashboard.suggestedActions.collect"),
			href: `/app/${organizationSlug}/finance/invoices?status=OVERDUE`, priority: "hot",
		});
	}

	const overdueMilestoneCount = stats?.milestones?.overdue ?? 0;
	if (overdueMilestoneCount > 0) {
		suggestedActions.push({
			id: "overdue-milestones", icon: Clock, iconColor: "text-red-500",
			bgColor: "bg-red-50 dark:bg-red-950/20",
			text: t("dashboard.actions.overdueMilestones", { count: overdueMilestoneCount }),
			buttonLabel: t("dashboard.actions.review"),
			href: `/app/${organizationSlug}/projects`, priority: "hot",
		});
	}

	const expiringQuotations = (financeDashboard?.recentQuotations ?? []).filter((q) => {
		if (q.status !== "SENT") return false;
		const d = Math.ceil((new Date(q.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
		return d >= 0 && d <= 7;
	});
	if (expiringQuotations.length > 0) {
		const q = expiringQuotations[0]!;
		const d = Math.max(0, Math.ceil((new Date(q.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
		suggestedActions.push({
			id: `eq-${q.id}`, icon: Clock, iconColor: "text-orange-500",
			bgColor: "bg-orange-50 dark:bg-orange-950/20",
			text: t("dashboard.actions.expiringQuotation", { number: q.quotationNo, days: d }),
			buttonLabel: t("dashboard.actions.followUp"),
			href: `/app/${organizationSlug}/pricing/quotations`, priority: "warm",
		});
	}

	if (upcomingMilestones.length > 0) {
		const m = upcomingMilestones[0]!;
		suggestedActions.push({
			id: `um-${m.id}`, icon: CheckCircle2, iconColor: "text-emerald-500",
			bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
			text: t("dashboard.actions.upcomingPayment", { project: m.project.name }),
			buttonLabel: t("dashboard.actions.record"),
			href: `/app/${organizationSlug}/projects/${m.project.id}/execution`, priority: "normal",
		});
	}

	const visibleSuggestedActions = suggestedActions.slice(0, 3);

	// Quick Actions
	const quickActions = [
		{ id: "expenses", icon: TrendingDown, label: t("dashboard.actions.expenses"), sub: t("dashboard.actions.addExpense"),
			href: `/app/${organizationSlug}/finance/expenses`, createHref: `/app/${organizationSlug}/finance/expenses/new`,
			iconColor: "text-rose-500", iconBg: "bg-rose-50 dark:bg-rose-950/30", subColor: "text-rose-500" },
		{ id: "payments", icon: TrendingUp, label: t("dashboard.actions.payments"), sub: t("dashboard.actions.addPayment"),
			href: `/app/${organizationSlug}/finance/payments`, createHref: `/app/${organizationSlug}/finance/payments/new`,
			iconColor: "text-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", subColor: "text-emerald-500" },
		{ id: "invoices", icon: Receipt, label: t("dashboard.actions.invoices"), sub: t("dashboard.actions.createInvoice"),
			href: `/app/${organizationSlug}/finance/invoices`, createHref: `/app/${organizationSlug}/finance/invoices/new`,
			iconColor: "text-indigo-500", iconBg: "bg-indigo-50 dark:bg-indigo-950/30", subColor: "text-indigo-500" },
		{ id: "pricing", icon: FilePlus2, label: t("dashboard.actions.pricing"), sub: t("dashboard.actions.newQuotation"),
			href: `/app/${organizationSlug}/pricing/quotations`, createHref: `/app/${organizationSlug}/pricing/quotations/new`,
			iconColor: "text-violet-500", iconBg: "bg-violet-50 dark:bg-violet-950/30", subColor: "text-violet-500" },
		{ id: "quantities", icon: Calculator, label: t("dashboard.actions.quantityStudies"), sub: t("dashboard.actions.calculateQuantities"),
			href: `/app/${organizationSlug}/quantities`, createHref: `/app/${organizationSlug}/quantities`,
			iconColor: "text-cyan-600", iconBg: "bg-cyan-50 dark:bg-cyan-950/30", subColor: "text-cyan-600" },
		{ id: "leads", icon: UserSearch, label: t("dashboard.actions.leads"), sub: t("dashboard.actions.newLead"),
			href: `/app/${organizationSlug}/pricing/leads`, createHref: `/app/${organizationSlug}/pricing/leads/new`,
			iconColor: "text-amber-500", iconBg: "bg-amber-50 dark:bg-amber-950/30", subColor: "text-amber-500" },
	];

	// Welcome message
	const welcomeMessage = (() => {
		if (completedCount === 0) return t("dashboard.header.welcome.start");
		if (completedCount < 3) return t("dashboard.header.welcome.progress", { completed: completedCount, total: totalCount });
		if (completedCount < totalCount) return t("dashboard.header.welcome.almost", { remaining: totalCount - completedCount });
		return "";
	})();

	const headerQuickLinks = [
		...incompleteSteps.map((s) => ({ text: t(s.labelKey), href: s.href })),
		{ text: t("dashboard.learn.pricing"), href: `/app/${organizationSlug}/pricing/studies` },
		{ text: t("dashboard.learn.support"), href: "mailto:support@app-masar.com" },
	].slice(0, 4);

	const formattedDate = new Date().toLocaleDateString("ar-SA", {
		weekday: "long", day: "numeric", month: "long",
	});

	// KPI header helpers
	const hasFinancialData = totalIncome > 0 || totalExpenses > 0 || totalContractValue > 0;

	return (
		<div className="flex flex-col gap-3 overflow-y-auto lg:overflow-hidden" dir="rtl">

			{/* ═══ SECTION 1: SMART HEADER ═══ */}
			{isNewUser ? (
				<div className="rounded-2xl border border-gray-200 bg-white py-4 px-5 dark:border-gray-800 dark:bg-gray-900 animate-in fade-in slide-in-from-top-3 duration-500">
					<h1 className="text-base font-bold text-foreground">{orgName}</h1>
					<p className="text-sm text-muted-foreground mt-0.5">{welcomeMessage}</p>
					<div className="flex items-center justify-between gap-4 mt-3">
						<JourneyFlow compact />
						<div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
							{headerQuickLinks.map((link, i) => (
								<Link key={i} href={link.href}
									className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
									{link.text} <ChevronLeft className="h-3 w-3 opacity-40" />
								</Link>
							))}
						</div>
					</div>
				</div>
			) : (
				<div className="rounded-2xl border border-gray-200 bg-white py-4 px-5 dark:border-gray-800 dark:bg-gray-900 animate-in fade-in slide-in-from-top-3 duration-500">
					<div className="flex items-center justify-between">
						<h1 className="text-base font-bold text-foreground">{orgName}</h1>
						<span className="text-xs text-muted-foreground">{formattedDate}</span>
					</div>
					{/* 3 KPIs */}
					<div className="flex items-stretch gap-4 mt-4">
						{/* Net Profit */}
						<div className="flex-1 min-w-0">
							<p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
								<BarChart3 className="h-3.5 w-3.5" />
								{t("dashboard.kpi.netProfit")}
							</p>
							<p className={`text-xl font-black tracking-tight mt-1 ${
								!hasFinancialData ? "text-gray-300 dark:text-gray-600" : netProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
							}`}>
								{hasFinancialData ? <Currency amount={netProfit} /> : "—"}
							</p>
						</div>
						{/* Contract Value */}
						<div className="flex-1 min-w-0 border-x border-gray-100 dark:border-gray-800 px-4">
							<p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
								<Landmark className="h-3.5 w-3.5" />
								{t("dashboard.kpi.contracts")}
							</p>
							<p className={`text-xl font-black tracking-tight mt-1 ${totalContractValue > 0 ? "text-foreground" : "text-gray-300 dark:text-gray-600"}`}>
								{totalContractValue > 0 ? <Currency amount={totalContractValue} /> : "—"}
							</p>
						</div>
						{/* Collection Rate */}
						<div className="flex-1 min-w-0">
							<p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
								<Receipt className="h-3.5 w-3.5" />
								{t("dashboard.kpi.collection")}
							</p>
							{totalInvoiced > 0 ? (
								<>
									<p className={`text-xl font-black tracking-tight mt-1 ${
										collectionRate > 70 ? "text-emerald-600 dark:text-emerald-400" : collectionRate >= 40 ? "text-amber-600 dark:text-amber-400" : "text-rose-500 dark:text-rose-400"
									}`}>
										{collectionRate}%
									</p>
									<div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 mt-1.5">
										<div className={`h-full rounded-full transition-all duration-1000 ease-out ${
											collectionRate > 70 ? "bg-emerald-500" : collectionRate >= 40 ? "bg-amber-400" : "bg-rose-400"
										}`} style={{ width: `${Math.min(collectionRate, 100)}%` }} />
									</div>
								</>
							) : (
								<p className="text-xl font-black tracking-tight mt-1 text-gray-300 dark:text-gray-600">—</p>
							)}
						</div>
					</div>
				</div>
			)}

			{/* ═══ SECTION 2+3: WORK (right) + FINANCE (left) ═══ */}
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-3 flex-1 min-h-0">

				{/* Right column: Projects + Actions + Tips */}
				<div className="lg:col-span-3 rounded-2xl border border-border/50 bg-card p-5 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: "100ms" }}>
					{/* Projects */}
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-sm font-bold text-foreground">{t("dashboard.activeProjects")}</h3>
						<Link href={`/app/${organizationSlug}/projects`} className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
							{t("dashboard.viewAll")} <ChevronLeft className="h-3 w-3" />
						</Link>
					</div>

					{projects.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-3 py-6">
							<p className="text-sm text-muted-foreground">{t("dashboard.emptyProjects.description")}</p>
							<Link href={`/app/${organizationSlug}/projects/new`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
								<Plus className="h-4 w-4" /> {t("dashboard.emptyProjects.cta")}
							</Link>
						</div>
					) : (
						<div className="space-y-0 mb-4">
							{projects.slice(0, 3).map((project, idx) => {
								const progress = Math.round(Number(project.progress ?? 0));
								const contractValue = project.contractValue ?? 0;
								const progressColor = getProgressColor(progress);
								return (
									<Link key={project.id} href={`/app/${organizationSlug}/projects/${project.id}`}
										className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${
											idx < Math.min(projects.length, 3) - 1 ? "border-b border-gray-50 dark:border-gray-800/50" : ""
										}`}>
										{progress === 0 ? (
											<span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
												{t("dashboard.projects.new")}
											</span>
										) : (
											<CircleProgress percentage={progress} size={32} color={progressColor} />
										)}
										<div className="flex-1 min-w-0">
											<p className="text-sm font-semibold text-foreground truncate">{project.name || t("projects.unnamed")}</p>
											<p className="text-[11px] text-gray-400"><Currency amount={contractValue} /></p>
										</div>
										{progress > 0 && (
											<span className={`text-sm font-black shrink-0 ${getProgressTextClass(progress)}`}>{progress}%</span>
										)}
										<Badge className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0 shrink-0">
											{t(`projects.status.${project.status}`)}
										</Badge>
									</Link>
								);
							})}
						</div>
					)}

					{/* Dashed separator */}
					<div className="border-t border-dashed border-gray-100 dark:border-gray-800 my-2" />

					{/* Suggested Actions */}
					<div className="mb-2">
						<div className="flex items-center gap-2 mb-3">
							<div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
								<Lightbulb className="h-3 w-3 text-amber-500" />
							</div>
							<h3 className="text-sm font-bold text-foreground">{t("dashboard.suggestedActions.title")}</h3>
						</div>

						{visibleSuggestedActions.length === 0 ? (
							<DashboardTips organizationSlug={organizationSlug} />
						) : (
							<div className="space-y-2">
								{visibleSuggestedActions.map((action) => {
									const ActionIcon = action.icon;
									return (
										<Link key={action.id} href={action.href}
											className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all hover:-translate-x-0.5 hover:shadow-sm ${
												action.priority === "hot" ? "border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10"
												: action.priority === "warm" ? "border-orange-200 bg-orange-50/50 dark:border-orange-900/30 dark:bg-orange-950/10"
												: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/10"
											}`}>
											<div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${action.bgColor}`}>
												<ActionIcon className={`h-3.5 w-3.5 ${action.iconColor}`} />
											</div>
											<span className="flex-1 text-xs font-medium text-foreground/80">{action.text}</span>
											<span className="shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
												{action.buttonLabel}
											</span>
										</Link>
									);
								})}
							</div>
						)}
					</div>
				</div>

				{/* Left column: Finance */}
				<div className="lg:col-span-2">
					<FinanceCard />
				</div>
			</div>

			{/* ═══ SECTION 4: QUICK ACTIONS (compact) ═══ */}
			<div className="grid grid-cols-3 gap-2 sm:grid-cols-6 animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: "280ms" }}>
				{quickActions.map((action) => {
					const Icon = action.icon;
					return (
						<Link key={action.id} href={action.createHref}
							className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-100 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer group text-center dark:bg-gray-900 dark:border-gray-800">
							<div className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${action.iconBg}`}>
								<Icon className={`w-4 h-4 ${action.iconColor}`} />
							</div>
							<span className="text-[11px] font-medium text-gray-600 dark:text-gray-400 leading-tight">{action.label}</span>
							<span className={`text-[10px] font-semibold ${action.subColor}`}>{action.sub}</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
