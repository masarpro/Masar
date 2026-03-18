"use client";

import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";

import { ActiveProjectsSection } from "./sections/ActiveProjectsSection";
import { FinancePanel } from "./sections/FinancePanel";
import { QuickActionsGrid } from "./sections/QuickActionsGrid";
import { AlertsSection } from "./sections/AlertsSection";
import { OperationalSection } from "./sections/OperationalSection";
import { DidYouKnowCard } from "./sections/DidYouKnowCard";

export function Dashboard() {
	const t = useTranslations();
	const locale = useLocale();
	const { user } = useSession();
	const { activeOrganization } = useActiveOrganization();
	const organizationSlug = activeOrganization?.slug ?? "";
	const organizationId = activeOrganization?.id ?? "";

	const { data: dashboardData, isLoading: statsLoading } = useQuery({
		...orpc.dashboard.getAll.queryOptions({
			input: { organizationId, activitiesLimit: 5, upcomingLimit: 5 },
		}),
		enabled: !!organizationId,
		staleTime: STALE_TIMES.DASHBOARD_STATS,
	});

	const { data: orgFinance, isLoading: finLoading } = useQuery({
		...orpc.finance.orgDashboard.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	const { data: projectsData, isLoading: projLoading } = useQuery({
		...orpc.projects.list.queryOptions({
			input: { organizationId, status: "ACTIVE" as const },
		}),
		enabled: !!organizationId,
	});

	if (!organizationId || statsLoading || finLoading || projLoading) {
		return <HomeDashboardSkeleton />;
	}

	const stats = dashboardData?.stats ?? null;
	const projects = projectsData?.projects ?? [];
	const firstName = user?.name?.split(" ")[0] || "";
	const now = new Date();

	return (
		<div className="flex flex-col gap-5 p-4 pt-2 md:p-6 md:pt-3 lg:p-8 lg:pt-4" dir="rtl">
			{/* Header card */}
			<div className="relative overflow-hidden rounded-2xl border border-blue-200/40 dark:border-blue-500/20 backdrop-blur-xl bg-gradient-to-l from-blue-50/70 via-blue-50/40 to-sky-50/60 dark:from-blue-950/30 dark:via-blue-950/20 dark:to-sky-950/25 shadow-lg shadow-blue-500/5 px-8 py-5 flex items-center justify-between shrink-0">
				{/* Decorative accent */}
				<div className="absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-blue-500/60 via-blue-400/30 to-transparent rounded-full" />
				<div>
					<h1 className="text-xl font-bold text-foreground">
						{t("dashboard.welcome.greeting", { name: firstName })}
					</h1>
					<p className="text-sm text-muted-foreground mt-0.5">
						{t("dashboard.welcome.subtitle")}
					</p>
				</div>
				<div className="hidden md:block">
					<p className="text-xl font-bold text-foreground">
						{activeOrganization?.name}
					</p>
				</div>
				<div className="text-start hidden sm:block">
					<p className="text-sm font-medium text-foreground">
						{new Intl.DateTimeFormat(locale, { weekday: "long" }).format(now)}
					</p>
					<p className="text-xs text-muted-foreground">
						{new Intl.DateTimeFormat(locale, {
							day: "numeric",
							month: "long",
							year: "numeric",
						}).format(now)}
					</p>
				</div>
			</div>

			{/* Row 1: Finance (right/start) + Projects (left/end) — swapped for RTL */}
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				<FinancePanel
					bankBalance={orgFinance?.balances?.totalBankBalance ?? 0}
					cashBalance={orgFinance?.balances?.totalCashBalance ?? 0}
					upcomingPayments={dashboardData?.upcoming ?? []}
					financialTrend={dashboardData?.financialTrend ?? []}
					organizationSlug={organizationSlug}
				/>
				<ActiveProjectsSection
					projects={projects}
					organizationSlug={organizationSlug}
				/>
			</div>

			{/* Row 2: Quick Actions */}
			<QuickActionsGrid organizationSlug={organizationSlug} />

			{/* Row 3: Alerts + Operational + Did You Know */}
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
				<AlertsSection
					overdueInvoices={dashboardData?.overdue?.invoices ?? []}
					overdueMilestones={dashboardData?.overdue?.milestones ?? []}
					pendingSubcontractClaims={
						dashboardData?.pendingSubcontractClaims ?? 0
					}
					upcomingPayments={dashboardData?.upcoming ?? []}
					organizationSlug={organizationSlug}
				/>
				<OperationalSection
					activeProjects={stats?.projects?.active ?? 0}
					completedProjects={stats?.projects?.completed ?? 0}
					onHoldProjects={stats?.projects?.onHold ?? 0}
					openIssues={stats?.milestones?.overdue ?? 0}
					leadsPipeline={dashboardData?.leadsPipeline ?? {}}
					typeDistribution={dashboardData?.typeDistribution ?? []}
				/>
				<DidYouKnowCard organizationSlug={organizationSlug} />
			</div>
		</div>
	);
}
