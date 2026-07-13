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
import { AttentionCard } from "./sections/AttentionCard";
import { BotlyHero } from "./sections/BotlyHero";
import { FieldActivityCard } from "./sections/FieldActivityCard";
import { FinancePanel } from "./sections/FinancePanel";
import { QuickActionsGrid } from "./sections/QuickActionsGrid";
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
		...orpc.dashboard.activeProjects.queryOptions({
			input: { organizationId, limit: 4 },
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

	// Botly Dashboard/Light (Figma 120:11546), single viewport on xl.
	// Left 2/3: hero → shortcut tiles → projects table (same width as hero).
	// Right 1/3: cash-flow bars → portfolio pulse → attention + latest docs.
	return (
		<div className="flex flex-col gap-6 p-3 sm:p-4 xl:h-[calc(100dvh-11.25rem)] xl:min-h-[620px] xl:flex-row xl:overflow-hidden xl:p-0">
			{/* Fallback when both main panels are hidden */}
			{!showFinance && !showProjects && (
				<div className="flex-1">
					<WelcomeSection organizationSlug={organizationSlug} />
				</div>
			)}

			{(showFinance || showProjects) && (
				<>
					{/* Left column — 2/3 */}
					<div className="flex min-h-0 min-w-0 flex-col gap-6 xl:w-2/3">
						<div className="min-h-0 xl:flex-[4]">
							{finLoading || statsLoading ? (
								sectionSkeleton
							) : (
								<BotlyHero
									organizationSlug={organizationSlug}
									orgName={activeOrganization?.name ?? ""}
									activeProjects={
										showProjects ? (stats?.projects?.active ?? 0) : null
									}
									bankBalance={
										showFinance
											? (orgFinance?.balances?.totalBankBalance ?? 0)
											: null
									}
									cashBalance={
										showFinance
											? (orgFinance?.balances?.totalCashBalance ?? 0)
											: null
									}
									showFinance={showFinance}
									showProjects={showProjects}
								/>
							)}
						</div>

						<div className="min-h-0 xl:flex-[3]">
							<QuickActionsGrid organizationSlug={organizationSlug} />
						</div>

						{showProjects && (
							<div className="min-h-0 xl:flex-[5]">
								{projLoading ? (
									sectionSkeleton
								) : (
									<ActiveProjectsSection
										projects={projects}
										organizationSlug={organizationSlug}
									/>
								)}
							</div>
						)}
					</div>

					{/* Right column — 1/3 */}
					<div className="flex min-h-0 min-w-0 flex-col gap-6 xl:w-1/3">
						{showFinance && (
							<div className="min-h-0 xl:flex-[4]">
								{finLoading || statsLoading ? (
									cardSkeleton
								) : (
									<FinancePanel
										bankBalance={orgFinance?.balances?.totalBankBalance ?? 0}
										cashBalance={orgFinance?.balances?.totalCashBalance ?? 0}
										financialTrend={dashboardData?.financialTrend ?? []}
										organizationSlug={organizationSlug}
									/>
								)}
							</div>
						)}
						{showProjects && (
							<div className="min-h-0 xl:flex-[3]">
								{projLoading || statsLoading ? (
									cardSkeleton
								) : (
									<FieldActivityCard
										fieldActivity={dashboardData?.fieldActivity ?? null}
										organizationSlug={organizationSlug}
									/>
								)}
							</div>
						)}
						<div className="min-h-0 xl:flex-[5]">
							{statsLoading ? (
								cardSkeleton
							) : (
								<AttentionCard
									organizationId={organizationId}
									organizationSlug={organizationSlug}
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
								/>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
}
