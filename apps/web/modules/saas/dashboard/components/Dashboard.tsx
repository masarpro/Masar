"use client";

import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
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
			className="flex min-h-[calc(100vh-64px)] flex-col gap-3 p-3 md:p-4"
			dir="rtl"
		>
			{/* Header */}
			<div className="flex items-center justify-between shrink-0">
				<div>
					<h1 className="text-xl font-bold text-foreground">
						{t("dashboard.welcome.greeting", { name: firstName })}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t("dashboard.welcome.subtitle")}
					</p>
				</div>
				<div className="hidden md:flex items-center gap-2">
					<div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
						<Building2 className="h-4 w-4 text-primary" />
					</div>
					<div>
						<p className="text-sm font-semibold text-foreground">
							{activeOrganization?.name}
						</p>
					</div>
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

			{/* Row 1: Projects + Finance — fills available space */}
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-2 flex-1 min-h-0">
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

			{/* Row 2: Quick Actions */}
			<div className="shrink-0">
				<QuickActionsGrid organizationSlug={organizationSlug} />
			</div>

			{/* Row 3: Alerts + Operational + Did You Know */}
			<div className="grid grid-cols-1 gap-3 lg:grid-cols-3 shrink-0">
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
