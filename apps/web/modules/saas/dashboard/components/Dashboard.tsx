"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { Currency } from "@saas/finance/components/shared/Currency";
import { CircleProgress } from "./CircleProgress";
import { JourneyFlow, useJourneySteps } from "./JourneyFlow";
import { CashFlowMini } from "./CashFlowMini";
import { DashboardTips } from "./DashboardTips";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@saas/auth/hooks/use-session";
import { Badge } from "@ui/components/badge";
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
import { Fragment } from "react";

// Type definitions
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

// Glass card style constant
const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

// Helper: progress-based color
function getProgressColor(progress: number): string {
	if (progress > 70) return "#10b981"; // emerald
	if (progress >= 30) return "#f59e0b"; // amber
	return "#94a3b8"; // gray
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
	buttonColor: string;
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
	const userName = user?.name ?? "";
	const { completedCount, totalCount, incompleteSteps } = useJourneySteps();

	// Combined dashboard data
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

	if (statsLoading) {
		return <HomeDashboardSkeleton />;
	}

	const bankBalance = orgFinance?.balances?.totalBankBalance ?? 0;
	const cashBalance = orgFinance?.balances?.totalCashBalance ?? 0;
	const totalIncome = orgFinance?.payments?.total ?? 0;
	const totalExpenses = orgFinance?.totalMoneyOut ?? stats?.financials?.totalExpenses ?? 0;
	const projects = projectsData?.projects ?? [];

	const isNewUser =
		(!onboardingProgress?.wizardCompleted || projects.length <= 1) &&
		(financeDashboard?.stats?.invoices?.total ?? 0) === 0;

	// ═══ REAL SUGGESTED ACTIONS ═══
	const suggestedActions: SuggestedAction[] = [];

	const overdueInvoices = financeDashboard?.overdueInvoices ?? [];
	if (overdueInvoices.length > 0) {
		const totalOverdueAmount = overdueInvoices.reduce(
			(sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0,
		);
		suggestedActions.push({
			id: "overdue-invoices", icon: AlertTriangle, iconColor: "text-red-500",
			bgColor: "bg-red-50 dark:bg-red-950/20",
			text: t("dashboard.suggestedActions.overdueInvoices", {
				count: overdueInvoices.length,
				amount: Math.round(totalOverdueAmount).toLocaleString("ar-SA"),
			}),
			buttonLabel: t("dashboard.suggestedActions.collect"),
			buttonColor: "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
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
			buttonColor: "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
			href: `/app/${organizationSlug}/projects`, priority: "hot",
		});
	}

	const expiringQuotations = (financeDashboard?.recentQuotations ?? []).filter((q) => {
		if (q.status !== "SENT") return false;
		const daysLeft = Math.ceil((new Date(q.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
		return daysLeft >= 0 && daysLeft <= 7;
	});
	if (expiringQuotations.length > 0) {
		const q = expiringQuotations[0]!;
		const daysLeft = Math.max(0, Math.ceil((new Date(q.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
		suggestedActions.push({
			id: `expiring-quote-${q.id}`, icon: Clock, iconColor: "text-orange-500",
			bgColor: "bg-orange-50 dark:bg-orange-950/20",
			text: t("dashboard.actions.expiringQuotation", { number: q.quotationNo, days: daysLeft }),
			buttonLabel: t("dashboard.actions.followUp"),
			buttonColor: "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
			href: `/app/${organizationSlug}/pricing/quotations`, priority: "warm",
		});
	}

	if (upcomingMilestones.length > 0) {
		const m = upcomingMilestones[0]!;
		suggestedActions.push({
			id: `upcoming-milestone-${m.id}`, icon: CheckCircle2, iconColor: "text-emerald-500",
			bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
			text: t("dashboard.actions.upcomingPayment", { project: m.project.name }),
			buttonLabel: t("dashboard.actions.record"),
			buttonColor: "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700",
			href: `/app/${organizationSlug}/projects/${m.project.id}/execution`, priority: "normal",
		});
	}

	const visibleSuggestedActions = suggestedActions.slice(0, 3);

	// Dynamic amount color
	const getAmountColor = (value: number, type: "income" | "expense" | "balance") => {
		if (type === "expense") return "text-red-600 dark:text-red-400";
		if (value > 0) return "text-emerald-600 dark:text-emerald-400";
		if (value < 0) return "text-red-600 dark:text-red-400";
		return "text-muted-foreground";
	};

	// KPI data — colors: bank=sky, cash=gray, income=emerald, expense=red
	const kpis = [
		{
			label: t("dashboard.kpi.bankBalance"), value: bankBalance, icon: Landmark,
			iconColor: "text-sky-600 dark:text-sky-400", bgColor: "bg-sky-100 dark:bg-sky-900/30",
			valueColor: getAmountColor(bankBalance, "balance"),
			zeroCta: t("dashboard.stats.bankBalance.cta"), zeroHref: `/app/${organizationSlug}/finance`,
			zeroCtaColor: "text-gray-500 hover:text-gray-700 dark:text-gray-400",
		},
		{
			label: t("dashboard.kpi.cashBalance"), value: cashBalance, icon: Wallet,
			iconColor: "text-slate-500 dark:text-slate-400", bgColor: "bg-slate-50 dark:bg-slate-800/50",
			valueColor: getAmountColor(cashBalance, "balance"),
			zeroCta: t("dashboard.stats.cashBox.cta"), zeroHref: `/app/${organizationSlug}/finance`,
			zeroCtaColor: "text-gray-500 hover:text-gray-700 dark:text-gray-400",
		},
		{
			label: t("dashboard.kpi.totalIncome"), value: totalIncome, icon: ArrowDownRight,
			iconColor: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
			valueColor: getAmountColor(totalIncome, "income"), sub: t("dashboard.kpi.thisMonth"),
			zeroCta: t("dashboard.stats.receivables.cta"), zeroHref: `/app/${organizationSlug}/finance/invoices/new`,
			zeroCtaColor: "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400",
		},
		{
			label: t("dashboard.kpi.totalExpenses"), value: totalExpenses, icon: ArrowUpLeft,
			iconColor: "text-rose-500 dark:text-rose-400", bgColor: "bg-rose-50 dark:bg-rose-900/30",
			valueColor: getAmountColor(totalExpenses, "expense"), sub: t("dashboard.kpi.thisMonth"),
			zeroCta: t("dashboard.stats.expenses.cta"), zeroHref: `/app/${organizationSlug}/finance/expenses`,
			zeroCtaColor: "text-rose-500 hover:text-rose-600 dark:text-rose-400",
		},
	];

	// Quick Actions — each section gets its own color
	const quickActions = [
		{ id: "expenses", icon: TrendingDown, sectionLabel: t("dashboard.actions.expenses"), actionLabel: t("dashboard.actions.addExpense"),
			browsePath: `/app/${organizationSlug}/finance/expenses`, createPath: `/app/${organizationSlug}/finance/expenses/new`,
			iconColor: "text-rose-500", iconBg: "bg-rose-50 dark:bg-rose-950/30", actionColor: "text-rose-500" },
		{ id: "payments", icon: TrendingUp, sectionLabel: t("dashboard.actions.payments"), actionLabel: t("dashboard.actions.addPayment"),
			browsePath: `/app/${organizationSlug}/finance/payments`, createPath: `/app/${organizationSlug}/finance/payments/new`,
			iconColor: "text-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-950/30", actionColor: "text-emerald-500" },
		{ id: "invoices", icon: Receipt, sectionLabel: t("dashboard.actions.invoices"), actionLabel: t("dashboard.actions.createInvoice"),
			browsePath: `/app/${organizationSlug}/finance/invoices`, createPath: `/app/${organizationSlug}/finance/invoices/new`,
			iconColor: "text-indigo-500", iconBg: "bg-indigo-50 dark:bg-indigo-950/30", actionColor: "text-indigo-500" },
		{ id: "pricing", icon: FilePlus2, sectionLabel: t("dashboard.actions.pricing"), actionLabel: t("dashboard.actions.newQuotation"),
			browsePath: `/app/${organizationSlug}/pricing/quotations`, createPath: `/app/${organizationSlug}/pricing/quotations/new`,
			iconColor: "text-violet-500", iconBg: "bg-violet-50 dark:bg-violet-950/30", actionColor: "text-violet-500" },
		{ id: "quantities", icon: Calculator, sectionLabel: t("dashboard.actions.quantityStudies"), actionLabel: t("dashboard.actions.calculateQuantities"),
			browsePath: `/app/${organizationSlug}/quantities`, createPath: `/app/${organizationSlug}/quantities`,
			iconColor: "text-cyan-600", iconBg: "bg-cyan-50 dark:bg-cyan-950/30", actionColor: "text-cyan-600" },
		{ id: "leads", icon: UserSearch, sectionLabel: t("dashboard.actions.leads"), actionLabel: t("dashboard.actions.newLead"),
			browsePath: `/app/${organizationSlug}/pricing/leads`, createPath: `/app/${organizationSlug}/pricing/leads/new`,
			iconColor: "text-amber-500", iconBg: "bg-amber-50 dark:bg-amber-950/30", actionColor: "text-amber-500" },
		{ id: "dailyReport", icon: ClipboardList, sectionLabel: t("dashboard.actions.dailyReport"), actionLabel: t("dashboard.actions.dailyReport"),
			browsePath: `/app/${organizationSlug}/projects`, createPath: `/app/${organizationSlug}/projects`,
			iconColor: "text-gray-600 dark:text-gray-400", iconBg: "bg-gray-100 dark:bg-gray-800", actionColor: "text-gray-600 dark:text-gray-400" },
		{ id: "manageCompany", icon: HardHat, sectionLabel: t("dashboard.actions.manageCompany"), actionLabel: t("dashboard.actions.manageCompany"),
			browsePath: `/app/${organizationSlug}/company`, createPath: `/app/${organizationSlug}/company`,
			iconColor: "text-gray-600 dark:text-gray-400", iconBg: "bg-gray-100 dark:bg-gray-800", actionColor: "text-gray-600 dark:text-gray-400" },
	];

	const hiddenActions = new Set(["dailyReport", "manageCompany"]);
	const visibleQuickActions = quickActions.filter((a) => !hiddenActions.has(a.id));

	// Dynamic welcome message
	const welcomeMessage = (() => {
		if (completedCount === 0) return t("dashboard.header.welcome.start");
		if (completedCount < 3) return t("dashboard.header.welcome.progress", { completed: completedCount, total: totalCount });
		if (completedCount < totalCount) return t("dashboard.header.welcome.almost", { remaining: totalCount - completedCount });
		return "";
	})();

	// Quick links for header
	const headerQuickLinks = [
		...incompleteSteps.map((s) => ({ text: t(s.labelKey), href: s.href, type: "step" as const })),
		{ text: t("dashboard.learn.pricing"), href: `/app/${organizationSlug}/pricing/studies`, type: "learn" as const },
		{ text: t("dashboard.learn.support"), href: "mailto:support@app-masar.com", type: "learn" as const },
	].slice(0, 4);

	const formattedDate = new Date().toLocaleDateString("ar-SA", {
		weekday: "long", year: "numeric", month: "long", day: "numeric",
	});

	return (
		<div className="space-y-4" dir="rtl">
			{/* ═══ SMART HEADER ═══ */}
			{isNewUser ? (
				<div className="rounded-2xl border border-gray-200 bg-white py-4 px-5 dark:border-gray-800 dark:bg-gray-900 animate-in fade-in slide-in-from-top-3 duration-500">
					<h1 className="text-base font-bold text-foreground">{orgName}</h1>
					<p className="text-sm text-muted-foreground mt-0.5">{welcomeMessage}</p>
					{/* Journey dots + quick-link chips in one row */}
					<div className="flex items-center justify-between gap-4 mt-3">
						<JourneyFlow compact />
						<div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
							{headerQuickLinks.map((link, i) => (
								<Link
									key={i}
									href={link.href}
									className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
								>
									{link.text}
									<ChevronLeft className="h-3 w-3 opacity-40" />
								</Link>
							))}
						</div>
					</div>
				</div>
			) : (
				<div className="flex items-center justify-between px-1 mb-1">
					<div>
						<h1 className="text-base font-bold text-foreground">{orgName}</h1>
						<p className="text-sm text-muted-foreground mt-0.5">
							{t("dashboard.header.greeting", { name: userName })}
						</p>
					</div>
					<span className="text-xs text-muted-foreground">{formattedDate}</span>
				</div>
			)}

			{/* ═══ KPI CARDS ═══ */}
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				{kpis.map((kpi, i) => {
					const Icon = kpi.icon;
					const isZero = kpi.value === 0;
					return (
						<div
							key={i}
							className={`${glassCard} masar-glow p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-500`}
							style={{ animationDelay: `${i * 60}ms` }}
						>
							<div className="flex items-center justify-between mb-2">
								<span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
								<div className={`p-1.5 rounded-lg ${kpi.bgColor}`}>
									<Icon className={`h-3.5 w-3.5 ${kpi.iconColor}`} />
								</div>
							</div>
							{isZero ? (
								<>
									<p className="text-lg font-bold text-gray-300 dark:text-gray-600">
										— <span className="text-sm">ر.س</span>
									</p>
									{kpi.zeroCta && kpi.zeroHref && (
										<Link
											href={kpi.zeroHref}
											className={`mt-1 flex items-center gap-0.5 text-xs font-medium transition-colors ${kpi.zeroCtaColor}`}
										>
											{kpi.zeroCta}
											<ChevronLeft className="h-3 w-3" />
										</Link>
									)}
								</>
							) : (
								<>
									<p className={`text-lg font-bold ${kpi.valueColor}`}>
										<Currency amount={kpi.value} />
									</p>
									<p className="text-[10px] text-muted-foreground/70 mt-1">
										{kpi.sub ?? t("dashboard.kpi.vsLastMonth")}
									</p>
								</>
							)}
						</div>
					);
				})}
			</div>

			{/* ═══ CASH FLOW + ACTIVE PROJECTS ═══ */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<CashFlowMini />

				{/* Active Projects */}
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
							className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
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
								const progressColor = getProgressColor(progress);
								return (
									<Link
										key={project.id}
										href={`/app/${organizationSlug}/projects/${project.id}`}
										className={`block py-2.5 transition-transform duration-150 hover:-translate-x-0.5 ${
											idx < Math.min(projects.length, 3) - 1 ? "border-b border-gray-50 dark:border-gray-800/50" : ""
										}`}
									>
										<div className="flex items-center gap-3">
											<CircleProgress percentage={progress} size={40} color={progressColor} />
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-2">
													<h4 className="text-sm font-bold text-foreground truncate">
														{project.name || t("projects.unnamed")}
													</h4>
													<div className="flex items-center gap-2 shrink-0">
														<span className={`font-extrabold text-sm ${getProgressTextClass(progress)}`}>
															{progress}%
														</span>
														<Badge className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0">
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
													background: progress > 70
														? "linear-gradient(90deg, #10b981, #34d399)"
														: progress >= 30
															? "linear-gradient(90deg, #f59e0b, #fbbf24)"
															: "linear-gradient(90deg, #94a3b8, #cbd5e1)",
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

			{/* ═══ QUICK ACTIONS ═══ */}
			<div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
				{visibleQuickActions.map((action, i) => {
					const Icon = action.icon;
					return (
						<div
							key={action.id}
							className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900 animate-in fade-in slide-in-from-bottom-3"
							style={{ animationDelay: `${280 + i * 35}ms` }}
						>
							<Link
								href={action.browsePath}
								className="flex flex-col items-center gap-2 border-b border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
							>
								<div className={`rounded-xl p-3 ${action.iconBg}`}>
									<Icon className={`h-6 w-6 ${action.iconColor}`} />
								</div>
								<span className="text-center text-sm font-medium text-foreground/80">
									{action.sectionLabel}
								</span>
							</Link>
							<Link
								href={action.createPath}
								className="flex items-center justify-center gap-2 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
							>
								<Plus className={`h-4 w-4 ${action.actionColor}`} />
								<span className={`text-sm font-medium ${action.actionColor}`}>
									{action.actionLabel}
								</span>
							</Link>
						</div>
					);
				})}
			</div>

			{/* ═══ BOTTOM: SUGGESTED ACTIONS + RECENT ACTIVITY ═══ */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				{/* Suggested Actions */}
				<div
					className={`${glassCard} flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500`}
					style={{ animationDelay: "450ms", maxHeight: 280 }}
				>
					<div className="flex items-center gap-2 px-4 pt-3 pb-2">
						<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
							<Lightbulb className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
						</div>
						<h3 className="text-sm font-semibold text-foreground">
							{t("dashboard.suggestedActions.title")}
						</h3>
					</div>
					<div className="flex-1 space-y-2 overflow-y-auto px-4 pb-3">
						{visibleSuggestedActions.length === 0 ? (
							<DashboardTips organizationSlug={organizationSlug} />
						) : (
							visibleSuggestedActions.map((action) => {
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
													: "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/10"
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

				{/* Recent Activity + Upcoming */}
				<div
					className={`${glassCard} flex flex-col overflow-hidden p-4 animate-in fade-in slide-in-from-bottom-3 duration-500`}
					style={{ animationDelay: "520ms", maxHeight: 280 }}
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
							className="flex items-center gap-0.5 text-[10px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
						>
							<span>{t("dashboard.viewAll")}</span>
							<ChevronLeft className="h-3 w-3" />
						</Link>
					</div>

					<div className="flex-1 space-y-1 overflow-hidden">
						{activities && activities.length > 0 ? (
							activities.slice(0, 4).map((activity: Activity, idx: number) => {
								const iconConfig = {
									change_order: { bg: "bg-amber-50 dark:bg-amber-900/20", color: "text-amber-500", icon: TrendingUp },
									claim: { bg: "bg-gray-100 dark:bg-gray-800", color: "text-gray-500", icon: Receipt },
									issue: { bg: "bg-red-50 dark:bg-red-900/20", color: "text-red-500", icon: AlertTriangle },
								};
								const config = iconConfig[activity.type] ?? iconConfig.issue;
								const ActivityIcon = config.icon;
								return (
									<div
										key={`${activity.type}-${activity.id}-${idx}`}
										className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0 animate-in fade-in slide-in-from-right-2 duration-300"
										style={{ animationDelay: `${560 + idx * 50}ms` }}
									>
										<div className={`w-6 h-6 rounded-md ${config.bg} flex items-center justify-center shrink-0`}>
											<ActivityIcon className={`h-3 w-3 ${config.color}`} />
										</div>
										<div className="min-w-0">
											<p className="text-[10px] font-medium text-foreground/80 truncate">{activity.title}</p>
											<p className="text-[8px] text-muted-foreground">{formatRelativeTime(activity.createdAt)}</p>
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
										<p className="text-[10px] font-semibold text-foreground/80">{m.project.name}</p>
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
