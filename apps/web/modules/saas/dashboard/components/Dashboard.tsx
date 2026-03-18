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

	const { data: orgFinance } = useQuery(
		orpc.finance.orgDashboard.queryOptions({
			input: { organizationId },
		}),
	);

	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId, status: "ACTIVE" as const },
		}),
	);

	if (statsLoading) {
		return <HomeDashboardSkeleton />;
	}

	const stats = dashboardData?.stats ?? null;
	const projects = projectsData?.projects ?? [];
	const firstName = user?.name?.split(" ")[0] || "";
	const now = new Date();

	return (
		<div
			className="flex min-h-[calc(100vh-56px)] flex-col gap-2.5 p-3 md:p-4"
			dir="rtl"
		>
			{/* Header — single compact line */}
			<div className="flex items-center justify-between shrink-0">
				<h1 className="text-lg font-bold text-foreground">
					{t("dashboard.welcome.greeting", { name: firstName })}
				</h1>
				<div className="flex items-center gap-3">
					<span className="text-sm text-muted-foreground hidden sm:inline">
						{activeOrganization?.name}
					</span>
					<span className="text-xs text-muted-foreground hidden md:inline">
						{new Intl.DateTimeFormat(locale, {
							weekday: "long",
							day: "numeric",
							month: "short",
						}).format(now)}
					</span>
				</div>
			</div>

			{/* Row 1: Finance + Projects — fills remaining */}
			<div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2 flex-1 min-h-0">
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
			<div className="shrink-0">
				<QuickActionsGrid organizationSlug={organizationSlug} />
			</div>

			{/* Row 3: Alerts + Operational + Did You Know */}
			<div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3 shrink-0 lg:h-[180px]">
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
