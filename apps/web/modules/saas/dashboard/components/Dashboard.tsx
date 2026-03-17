"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@saas/auth/hooks/use-session";
import {
	AlertTriangle,
	Calculator,
	CheckCircle2,
	ChevronLeft,
	Clock,
	FilePlus2,
	Receipt,
	TrendingDown,
	TrendingUp,
	UserSearch,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { JourneyFlow, useJourneySteps } from "./JourneyFlow";
import { KPICards } from "./KPICards";
import { HeroChart, type ChartDataPoint } from "./HeroChart";
import { WorkColumn, type SuggestedAction } from "./WorkColumn";

export function Dashboard() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const { user } = useSession();
	const organizationSlug = activeOrganization?.slug ?? "";
	const organizationId = activeOrganization?.id ?? "";
	const orgName = activeOrganization?.name ?? "";
	const { completedCount, totalCount, incompleteSteps } = useJourneySteps();

	// ── Queries ──
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
		orpc.projects.list.queryOptions({
			input: { organizationId, status: "ACTIVE" as const },
		}),
	);

	const { data: onboardingProgress } = useQuery({
		...orpc.onboarding.getProgress.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	if (statsLoading) return <HomeDashboardSkeleton />;

	// ── Derived values ──
	const totalIncome = orgFinance?.payments?.total ?? 0;
	const totalExpenses =
		orgFinance?.totalMoneyOut ?? stats?.financials?.totalExpenses ?? 0;
	const netProfit = totalIncome - totalExpenses;
	const bankBalance = orgFinance?.balances?.totalBankBalance ?? 0;
	const projects = projectsData?.projects ?? [];

	const isNewUser =
		(!onboardingProgress?.wizardCompleted || projects.length <= 1) &&
		(financeDashboard?.stats?.invoices?.total ?? 0) === 0;

	// ── Sparkline data from recent transactions ──
	const recentPaymentAmounts = (orgFinance?.recentPayments ?? []).map((p) =>
		Number(p.amount ?? 0),
	);
	const recentExpenseAmounts = (orgFinance?.recentExpenses ?? []).map((e) =>
		Number(e.amount ?? 0),
	);

	// ── Hero Chart data ──
	const chartData: ChartDataPoint[] | null = (() => {
		const recentPayments = orgFinance?.recentPayments ?? [];
		const recentExpenses = orgFinance?.recentExpenses ?? [];
		const dayMap = new Map<string, { income: number; expense: number }>();

		for (const p of recentPayments) {
			const day = new Date(p.date ?? p.createdAt).toLocaleDateString(
				"ar-SA",
				{ weekday: "short" },
			);
			const entry = dayMap.get(day) ?? { income: 0, expense: 0 };
			entry.income += Number(p.amount ?? 0);
			dayMap.set(day, entry);
		}
		for (const e of recentExpenses) {
			const day = new Date(e.date ?? e.createdAt).toLocaleDateString(
				"ar-SA",
				{ weekday: "short" },
			);
			const entry = dayMap.get(day) ?? { income: 0, expense: 0 };
			entry.expense += Number(e.amount ?? 0);
			dayMap.set(day, entry);
		}

		const entries = Array.from(dayMap.entries())
			.slice(-7)
			.map(([day, val]) => ({ day, ...val }));
		return entries.length > 1 ? entries : null;
	})();

	// ── Suggested Actions ──
	const suggestedActions: SuggestedAction[] = [];

	const overdueInvoices = financeDashboard?.overdueInvoices ?? [];
	if (overdueInvoices.length > 0) {
		const amt = overdueInvoices.reduce(
			(s, inv) =>
				s + (Number(inv.totalAmount) - Number(inv.paidAmount)),
			0,
		);
		suggestedActions.push({
			id: "overdue-invoices",
			icon: AlertTriangle,
			iconColor: "text-red-500",
			bgColor: "bg-red-50 dark:bg-red-950/20",
			text: t("dashboard.suggestedActions.overdueInvoices", {
				count: overdueInvoices.length,
				amount: Math.round(amt).toLocaleString("ar-SA"),
			}),
			buttonLabel: t("dashboard.suggestedActions.collect"),
			href: `/app/${organizationSlug}/finance/invoices?status=OVERDUE`,
			priority: "hot",
		});
	}

	const overdueMilestoneCount = stats?.milestones?.overdue ?? 0;
	if (overdueMilestoneCount > 0) {
		suggestedActions.push({
			id: "overdue-milestones",
			icon: Clock,
			iconColor: "text-red-500",
			bgColor: "bg-red-50 dark:bg-red-950/20",
			text: t("dashboard.actions.overdueMilestones", {
				count: overdueMilestoneCount,
			}),
			buttonLabel: t("dashboard.actions.review"),
			href: `/app/${organizationSlug}/projects`,
			priority: "hot",
		});
	}

	const expiringQuotations = (
		financeDashboard?.recentQuotations ?? []
	).filter((q) => {
		if (q.status !== "SENT") return false;
		const d = Math.ceil(
			(new Date(q.validUntil).getTime() - Date.now()) /
				(1000 * 60 * 60 * 24),
		);
		return d >= 0 && d <= 7;
	});
	if (expiringQuotations.length > 0) {
		const q = expiringQuotations[0]!;
		const d = Math.max(
			0,
			Math.ceil(
				(new Date(q.validUntil).getTime() - Date.now()) /
					(1000 * 60 * 60 * 24),
			),
		);
		suggestedActions.push({
			id: `eq-${q.id}`,
			icon: Clock,
			iconColor: "text-orange-500",
			bgColor: "bg-orange-50 dark:bg-orange-950/20",
			text: t("dashboard.actions.expiringQuotation", {
				number: q.quotationNo,
				days: d,
			}),
			buttonLabel: t("dashboard.actions.followUp"),
			href: `/app/${organizationSlug}/pricing/quotations`,
			priority: "warm",
		});
	}

	if (upcomingMilestones.length > 0) {
		const m = upcomingMilestones[0]!;
		suggestedActions.push({
			id: `um-${m.id}`,
			icon: CheckCircle2,
			iconColor: "text-emerald-500",
			bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
			text: t("dashboard.actions.upcomingPayment", {
				project: m.project.name,
			}),
			buttonLabel: t("dashboard.actions.record"),
			href: `/app/${organizationSlug}/projects/${m.project.id}/execution`,
			priority: "normal",
		});
	}

	const visibleSuggestedActions = suggestedActions.slice(0, 3);

	// ── Quick Actions ──
	const quickActions = [
		{
			id: "expenses",
			icon: TrendingDown,
			label: t("dashboard.actions.expenses"),
			sub: t("dashboard.actions.addExpense"),
			href: `/app/${organizationSlug}/finance/expenses/new`,
			iconColor: "text-rose-500",
			iconBg: "bg-rose-50 dark:bg-rose-950/30",
			subColor: "text-rose-500",
		},
		{
			id: "payments",
			icon: TrendingUp,
			label: t("dashboard.actions.payments"),
			sub: t("dashboard.actions.addPayment"),
			href: `/app/${organizationSlug}/finance/payments/new`,
			iconColor: "text-emerald-500",
			iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
			subColor: "text-emerald-500",
		},
		{
			id: "invoices",
			icon: Receipt,
			label: t("dashboard.actions.invoices"),
			sub: t("dashboard.actions.createInvoice"),
			href: `/app/${organizationSlug}/finance/invoices/new`,
			iconColor: "text-indigo-500",
			iconBg: "bg-indigo-50 dark:bg-indigo-950/30",
			subColor: "text-indigo-500",
		},
		{
			id: "pricing",
			icon: FilePlus2,
			label: t("dashboard.actions.pricing"),
			sub: t("dashboard.actions.newQuotation"),
			href: `/app/${organizationSlug}/pricing/quotations/new`,
			iconColor: "text-violet-500",
			iconBg: "bg-violet-50 dark:bg-violet-950/30",
			subColor: "text-violet-500",
		},
		{
			id: "quantities",
			icon: Calculator,
			label: t("dashboard.actions.quantityStudies"),
			sub: t("dashboard.actions.calculateQuantities"),
			href: `/app/${organizationSlug}/quantities`,
			iconColor: "text-cyan-600",
			iconBg: "bg-cyan-50 dark:bg-cyan-950/30",
			subColor: "text-cyan-600",
		},
		{
			id: "leads",
			icon: UserSearch,
			label: t("dashboard.actions.leads"),
			sub: t("dashboard.actions.newLead"),
			href: `/app/${organizationSlug}/pricing/leads/new`,
			iconColor: "text-amber-500",
			iconBg: "bg-amber-50 dark:bg-amber-950/30",
			subColor: "text-amber-500",
		},
	];

	// Welcome message for new user
	const welcomeMessage = (() => {
		if (completedCount === 0) return t("dashboard.header.welcome.start");
		if (completedCount < 3)
			return t("dashboard.header.welcome.progress", {
				completed: completedCount,
				total: totalCount,
			});
		if (completedCount < totalCount)
			return t("dashboard.header.welcome.almost", {
				remaining: totalCount - completedCount,
			});
		return "";
	})();

	const headerQuickLinks = [
		...incompleteSteps.map((s) => ({ text: t(s.labelKey), href: s.href })),
		{
			text: t("dashboard.learn.pricing"),
			href: `/app/${organizationSlug}/pricing/studies`,
		},
		{
			text: t("dashboard.learn.support"),
			href: "mailto:support@app-masar.com",
		},
	].slice(0, 4);

	const formattedDate = new Date().toLocaleDateString("ar-SA", {
		weekday: "long",
		day: "numeric",
		month: "long",
	});

	return (
		<div
			className="flex flex-col gap-3 overflow-y-auto lg:overflow-hidden"
			dir="rtl"
		>
			{/* ═══ SECTION 1: SMART HEADER ═══ */}
			{isNewUser ? (
				<div className="animate-in fade-in slide-in-from-top-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 duration-500 dark:border-gray-800 dark:bg-gray-900">
					<h1 className="text-base font-bold text-foreground">
						{orgName}
					</h1>
					<p className="mt-0.5 text-sm text-muted-foreground">
						{welcomeMessage}
					</p>
					<div className="mt-3 flex items-center justify-between gap-4">
						<JourneyFlow compact />
						<div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
							{headerQuickLinks.map((link, i) => (
								<Link
									key={i}
									href={link.href}
									className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
								>
									{link.text}{" "}
									<ChevronLeft className="h-3 w-3 opacity-40" />
								</Link>
							))}
						</div>
					</div>
				</div>
			) : (
				<div className="flex items-center justify-between px-1">
					<h1 className="text-base font-bold text-foreground">
						{orgName}
					</h1>
					<span className="text-xs text-muted-foreground">
						{formattedDate}
					</span>
				</div>
			)}

			{/* ═══ SECTION 2: KPI CARDS (4) with sparklines ═══ */}
			<KPICards
				bankBalance={bankBalance}
				totalIncome={totalIncome}
				totalExpenses={totalExpenses}
				netProfit={netProfit}
				organizationSlug={organizationSlug}
				recentPaymentAmounts={recentPaymentAmounts}
				recentExpenseAmounts={recentExpenseAmounts}
			/>

			{/* ═══ SECTION 3: HERO CHART + WORK COLUMN ═══ */}
			<div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-5">
				{/* Left: Hero Chart (60%) */}
				<div className="min-h-[250px] lg:col-span-3">
					<HeroChart
						chartData={chartData}
						organizationSlug={organizationSlug}
					/>
				</div>

				{/* Right: Projects + Suggested Actions (40%) */}
				<div className="lg:col-span-2">
					<WorkColumn
						projects={projects}
						suggestedActions={visibleSuggestedActions}
						organizationSlug={organizationSlug}
					/>
				</div>
			</div>

			{/* ═══ SECTION 4: QUICK ACTIONS (compact row) ═══ */}
			<div
				className="animate-in fade-in slide-in-from-bottom-3 grid grid-cols-3 gap-2 duration-500 sm:grid-cols-6"
				style={{ animationDelay: "280ms" }}
			>
				{quickActions.map((action) => {
					const Icon = action.icon;
					return (
						<Link
							key={action.id}
							href={action.href}
							className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-gray-100 bg-white p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
						>
							<div
								className={`flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${action.iconBg}`}
							>
								<Icon
									className={`h-4 w-4 ${action.iconColor}`}
								/>
							</div>
							<span className="text-[11px] font-medium leading-tight text-gray-600 dark:text-gray-400">
								{action.label}
							</span>
							<span
								className={`text-[10px] font-semibold ${action.subColor}`}
							>
								{action.sub}
							</span>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
