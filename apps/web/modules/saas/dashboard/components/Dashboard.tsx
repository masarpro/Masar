"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";

import { ActiveProjectsSection } from "./sections/ActiveProjectsSection";
import { QuickActionsGrid } from "./sections/QuickActionsGrid";
import { AlertsSection } from "./sections/AlertsSection";
import { OperationalSection } from "./sections/OperationalSection";
import { DidYouKnowCard } from "./sections/DidYouKnowCard";
import { RecentDocumentsCard } from "./sections/RecentDocumentsCard";

const FinancePanel = dynamic(
	() =>
		import("./sections/FinancePanel").then((m) => ({
			default: m.FinancePanel,
		})),
	{
		loading: () => (
			<div className="h-[300px] animate-pulse rounded-lg bg-muted" />
		),
		ssr: false,
	},
);

export function Dashboard() {
	const t = useTranslations();
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

	return (
		<div className="flex flex-col gap-5 p-4 pt-2 md:p-6 md:pt-3 lg:p-8 lg:pt-4 overflow-hidden">
			{/* Row 1: Finance (right/start) + Projects (left/end) — swapped for RTL */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<FinancePanel
					bankBalance={orgFinance?.balances?.totalBankBalance ?? 0}
					cashBalance={orgFinance?.balances?.totalCashBalance ?? 0}
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

			<hr className="border-border/50" />

			{/* Row 3: Operational + Recent Docs + (Alerts + DidYouKnow stacked) */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<OperationalSection
					activeProjects={stats?.projects?.active ?? 0}
					completedProjects={stats?.projects?.completed ?? 0}
					onHoldProjects={stats?.projects?.onHold ?? 0}
					openIssues={stats?.milestones?.overdue ?? 0}
					leadsPipeline={dashboardData?.leadsPipeline ?? {}}
				/>
				<RecentDocumentsCard
					organizationId={organizationId}
					organizationSlug={organizationSlug}
				/>
				<div className="flex flex-col gap-3 lg:h-full">
					<AlertsSection
						overdueInvoices={dashboardData?.overdue?.invoices ?? []}
						overdueMilestones={dashboardData?.overdue?.milestones ?? []}
						pendingSubcontractClaims={
							dashboardData?.pendingSubcontractClaims ?? 0
						}
						upcomingPayments={dashboardData?.upcoming ?? []}
						organizationSlug={organizationSlug}
					/>
					<DidYouKnowCard organizationSlug={organizationSlug} />
				</div>
			</div>
		</div>
	);
}
