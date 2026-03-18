"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

import { ActiveProjectsSection } from "./sections/ActiveProjectsSection";
import { FinancePanel } from "./sections/FinancePanel";
import { QuickActionsGrid } from "./sections/QuickActionsGrid";
import { AlertsSection } from "./sections/AlertsSection";
import { OperationalSection } from "./sections/OperationalSection";
import { DidYouKnowCard } from "./sections/DidYouKnowCard";

export function Dashboard() {
	const { activeOrganization } = useActiveOrganization();
	const organizationSlug = activeOrganization?.slug ?? "";
	const organizationId = activeOrganization?.id ?? "";

	// Combined dashboard data
	const { data: dashboardData, isLoading: statsLoading } = useQuery({
		...orpc.dashboard.getAll.queryOptions({
			input: { organizationId, activitiesLimit: 5, upcomingLimit: 5 },
		}),
		enabled: !!organizationId,
		staleTime: STALE_TIMES.DASHBOARD_STATS,
	});

	// Org financial data (bank, cash)
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

	if (statsLoading) {
		return <HomeDashboardSkeleton />;
	}

	const stats = dashboardData?.stats ?? null;
	const projects = projectsData?.projects ?? [];

	return (
		<div className="flex flex-col gap-3 p-3 md:p-4 lg:p-5" dir="rtl">
			{/* Row 1: Projects (left) + Finance (right) */}
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
				<ActiveProjectsSection
					projects={projects}
					organizationSlug={organizationSlug}
				/>
				<FinancePanel
					bankBalance={orgFinance?.balances?.totalBankBalance ?? 0}
					cashBalance={orgFinance?.balances?.totalCashBalance ?? 0}
					upcomingPayments={dashboardData?.upcoming ?? []}
					financialTrend={dashboardData?.financialTrend ?? []}
					organizationSlug={organizationSlug}
				/>
			</div>

			{/* Row 2: 6 Quick Action cards */}
			<QuickActionsGrid organizationSlug={organizationSlug} />

			{/* Row 3: Alerts + Operational + Did You Know */}
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
				<AlertsSection
					overdueInvoices={dashboardData?.overdue?.invoices ?? []}
					overdueMilestones={dashboardData?.overdue?.milestones ?? []}
					pendingSubcontractClaims={dashboardData?.pendingSubcontractClaims ?? 0}
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
