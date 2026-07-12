"use client";

import type { Permissions } from "@repo/database/prisma/permissions";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { usePermission } from "@saas/permissions/hooks/use-permission";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { ActiveProjectsSection } from "./sections/ActiveProjectsSection";
import { QuickActionsGrid } from "./sections/QuickActionsGrid";
import { AlertsSection } from "./sections/AlertsSection";
import { OperationalSection } from "./sections/OperationalSection";
import { DidYouKnowCard } from "./sections/DidYouKnowCard";
import { FinancePanel } from "./sections/FinancePanel";
import { RecentDocumentsCard } from "./sections/RecentDocumentsCard";
import { WelcomeSection } from "./sections/WelcomeSection";

// FinancePanel is imported statically (not next/dynamic with ssr:false). Its
// data is server-prefetched, so the panel frame + real bank/cash balances now
// render on the server at first paint instead of a grey pulse box that popped
// in on the client. The Recharts chart inside it is the only part that needs
// the browser to measure its container — FinancePanel gates JUST that chart
// behind a mount check, drawing it into an already-reserved, same-height slot
// so nothing shifts.

export function Dashboard({
	organizationId: organizationIdProp,
	organizationSlug: organizationSlugProp,
	initialPermissions,
}: {
	organizationId?: string;
	organizationSlug?: string;
	initialPermissions?: {
		permissions: Permissions | null;
		roleType: string | null;
		isOwner: boolean;
	};
} = {}) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	// Server props take precedence: during SSR the providers above the org
	// layout's HydrationBoundary haven't resolved yet, so context values are
	// empty on the server — props keep the first paint correct.
	const organizationSlug = organizationSlugProp ?? activeOrganization?.slug ?? "";
	const organizationId = organizationIdProp ?? activeOrganization?.id ?? "";

	// Widget permissions (RBAC-UI): each dashboard widget requires the same
	// permission as its sidebar entry. Queries for hidden widgets are skipped
	// entirely — no forbidden RPCs, no 403 noise.
	const {
		isOwner: ctxIsOwner,
		permissions: ctxPermissions,
		isLoading: permsLoading,
	} = usePermission();
	const permissions = ctxPermissions ?? initialPermissions?.permissions ?? null;
	const isOwner = ctxIsOwner || (initialPermissions?.isOwner ?? false);
	const showFinance = isOwner || (permissions?.finance?.view ?? false);
	const showProjects =
		isOwner || Object.values(permissions?.projects ?? {}).some(Boolean);

	const { data: dashboardData, isLoading: statsLoading } = useQuery({
		...orpc.dashboard.getAll.queryOptions({
			input: { organizationId, activitiesLimit: 5, upcomingLimit: 5 },
		}),
		enabled: !!organizationId && (showProjects || showFinance),
		staleTime: STALE_TIMES.DASHBOARD_STATS,
	});

	const { data: orgFinance, isLoading: finLoading } = useQuery({
		...orpc.finance.orgDashboard.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId && showFinance,
	});

	const { data: projectsData, isLoading: projLoading } = useQuery({
		...orpc.projects.list.queryOptions({
			input: { organizationId, status: "ACTIVE" as const },
		}),
		enabled: !!organizationId && showProjects,
	});

	// Only the permission layer gates the whole page (the layout can't be known
	// without it). Data queries gate their own section below, so a slow query
	// no longer blanks the entire dashboard behind one skeleton.
	if (!organizationId || (permsLoading && !permissions && !isOwner)) {
		return <HomeDashboardSkeleton />;
	}

	const stats = dashboardData?.stats ?? null;
	const projects = projectsData?.projects ?? [];

	const sectionSkeleton = (
		<div className="h-[300px] animate-pulse rounded-lg bg-muted" />
	);
	const cardSkeleton = (
		<div className="h-[220px] animate-pulse rounded-lg bg-muted" />
	);

	return (
		<div className="flex flex-col gap-3 sm:gap-5 p-3 pt-2 sm:p-4 md:p-6 md:pt-3 lg:p-8 lg:pt-4 overflow-hidden">
			{/* Row 0: welcome fallback when both main panels are hidden */}
			{!showFinance && !showProjects && (
				<WelcomeSection organizationSlug={organizationSlug} />
			)}

			{/* Row 1: Finance (right/start) + Projects (left/end) — swapped for RTL */}
			{(showFinance || showProjects) && (
				<div
					className={`grid grid-cols-1 gap-3 sm:gap-6 ${
						showFinance && showProjects ? "lg:grid-cols-2" : ""
					}`}
				>
					{showFinance &&
						(finLoading || statsLoading ? (
							sectionSkeleton
						) : (
							<FinancePanel
								bankBalance={orgFinance?.balances?.totalBankBalance ?? 0}
								cashBalance={orgFinance?.balances?.totalCashBalance ?? 0}
								financialTrend={dashboardData?.financialTrend ?? []}
								organizationSlug={organizationSlug}
							/>
						))}
					{showProjects &&
						(projLoading ? (
							sectionSkeleton
						) : (
							<ActiveProjectsSection
								projects={projects}
								organizationSlug={organizationSlug}
							/>
						))}
				</div>
			)}

			{/* Row 2: Quick Actions — على الجوال تظهر أسفل المشاريع النشطة كصفوف */}
			<QuickActionsGrid organizationSlug={organizationSlug} />

			<hr className="hidden border-border/50 sm:block" />

			{/* Row 3: Operational + Recent Docs + (Alerts + DidYouKnow stacked) */}
			<div className="grid grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-3">
				{showProjects &&
					(statsLoading ? (
						cardSkeleton
					) : (
						<OperationalSection
							activeProjects={stats?.projects?.active ?? 0}
							completedProjects={stats?.projects?.completed ?? 0}
							onHoldProjects={stats?.projects?.onHold ?? 0}
							openIssues={stats?.milestones?.overdue ?? 0}
							leadsPipeline={dashboardData?.leadsPipeline ?? {}}
						/>
					))}
				{showProjects && (
					<RecentDocumentsCard
						organizationId={organizationId}
						organizationSlug={organizationSlug}
					/>
				)}
				<div className="flex flex-col gap-3 lg:h-full">
					{(showFinance || showProjects) &&
						(statsLoading ? (
							cardSkeleton
						) : (
							<AlertsSection
								overdueInvoices={
									showFinance ? (dashboardData?.overdue?.invoices ?? []) : []
								}
								overdueMilestones={
									showProjects
										? (dashboardData?.overdue?.milestones ?? [])
										: []
								}
								pendingSubcontractClaims={
									showFinance
										? (dashboardData?.pendingSubcontractClaims ?? 0)
										: 0
								}
								upcomingPayments={
									showFinance ? (dashboardData?.upcoming ?? []) : []
								}
								organizationSlug={organizationSlug}
							/>
						))}
					<DidYouKnowCard organizationSlug={organizationSlug} />
				</div>
			</div>
		</div>
	);
}
