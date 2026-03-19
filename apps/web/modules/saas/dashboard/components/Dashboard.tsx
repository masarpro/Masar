"use client";

import { useSession } from "@saas/auth/hooks/use-session";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Clock, LayoutDashboard } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ActiveProjectsSection } from "./sections/ActiveProjectsSection";
import { FinancePanel } from "./sections/FinancePanel";
import { QuickActionsGrid } from "./sections/QuickActionsGrid";
import { AlertsSection } from "./sections/AlertsSection";
import { OperationalSection } from "./sections/OperationalSection";
import { DidYouKnowCard } from "./sections/DidYouKnowCard";
import { RecentDocumentsCard } from "./sections/RecentDocumentsCard";

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

	const [currentTime, setCurrentTime] = useState<Date | null>(null);

	useEffect(() => {
		setCurrentTime(new Date());
		const timer = setInterval(() => setCurrentTime(new Date()), 60000);
		return () => clearInterval(timer);
	}, []);

	if (!organizationId || statsLoading || finLoading || projLoading) {
		return <HomeDashboardSkeleton />;
	}

	const stats = dashboardData?.stats ?? null;
	const projects = projectsData?.projects ?? [];
	const firstName = user?.name?.split(" ")[0] || "";
	const now = new Date();

	return (
		<div className="flex flex-col gap-5 p-4 pt-2 md:p-6 md:pt-3 lg:p-8 lg:pt-4">
			{/* Header card */}
			<div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
						<LayoutDashboard className="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 className="text-xl font-bold text-foreground">
							{t("dashboard.welcome.greeting", { name: firstName })}
						</h1>
						<p className="text-sm text-muted-foreground">
							{activeOrganization?.name}
						</p>
					</div>
				</div>
				<div className="hidden sm:flex flex-col items-end gap-0.5">
					<span className="text-sm font-medium text-muted-foreground">
						{new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(now)}
					</span>
					{currentTime && (
						<div className="flex items-center gap-1.5">
							<Clock className="h-3.5 w-3.5 text-muted-foreground" />
							<span className="text-sm font-medium text-muted-foreground tabular-nums">
								{new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(currentTime)}
							</span>
						</div>
					)}
				</div>
			</div>

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

			{/* Row 3: Recent Docs + Operational + (Alerts + DidYouKnow stacked) */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<RecentDocumentsCard
					organizationId={organizationId}
					organizationSlug={organizationSlug}
				/>
				<OperationalSection
					activeProjects={stats?.projects?.active ?? 0}
					completedProjects={stats?.projects?.completed ?? 0}
					onHoldProjects={stats?.projects?.onHold ?? 0}
					openIssues={stats?.milestones?.overdue ?? 0}
					leadsPipeline={dashboardData?.leadsPipeline ?? {}}
				/>
				<div className="flex flex-col gap-3">
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
