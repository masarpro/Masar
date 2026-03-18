"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";

import { KpiCardsRow } from "./sections/KpiCardsRow";
import { ActiveProjectsSection } from "./sections/ActiveProjectsSection";
import { QuickActionsGrid } from "./sections/QuickActionsGrid";
import { AlertsSection } from "./sections/AlertsSection";
import { FinancialOverviewSection } from "./sections/FinancialOverviewSection";
import { OperationalSection } from "./sections/OperationalSection";
import { CashFlowSection } from "./sections/CashFlowSection";
import { CompanyExpensesSection } from "./sections/CompanyExpensesSection";
import { RecentActivitySection } from "./sections/RecentActivitySection";

export function Dashboard() {
	const { activeOrganization } = useActiveOrganization();
	const organizationSlug = activeOrganization?.slug ?? "";
	const organizationId = activeOrganization?.id ?? "";

	// Combined dashboard data — single API call for stats + activities + upcoming + overdue + trends
	const { data: dashboardData, isLoading: statsLoading } = useQuery({
		...orpc.dashboard.getAll.queryOptions({
			input: { organizationId, activitiesLimit: 5, upcomingLimit: 5 },
		}),
		enabled: !!organizationId,
		staleTime: STALE_TIMES.DASHBOARD_STATS,
	});

	// Org financial data (bank, cash, profit)
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

	// Company expense dashboard data
	const { data: companyExpenseData } = useQuery({
		...orpc.company.expenses.getDashboardData.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
	});

	if (statsLoading) {
		return <HomeDashboardSkeleton />;
	}

	const stats = dashboardData?.stats ?? null;
	const bankBalance = orgFinance?.balances?.totalBankBalance ?? 0;
	const cashBalance = orgFinance?.balances?.totalCashBalance ?? 0;
	const totalIncome = orgFinance?.payments?.total ?? 0;
	const totalExpenses = orgFinance?.totalMoneyOut ?? stats?.financials?.totalExpenses ?? 0;
	const projects = projectsData?.projects ?? [];

	return (
		<div className="space-y-4" dir="rtl">
			{/* Row 1: KPI Cards */}
			<KpiCardsRow
				bankBalance={bankBalance}
				cashBalance={cashBalance}
				totalIncome={totalIncome}
				totalExpenses={totalExpenses}
				totalOutstanding={dashboardData?.invoiceTotals?.totalOutstanding ?? 0}
				netProfit={dashboardData?.netProfit ?? 0}
				profitMargin={dashboardData?.profitMargin ?? 0}
				organizationSlug={organizationSlug}
			/>

			{/* Row 2: Active Projects */}
			<ActiveProjectsSection
				projects={projects}
				organizationSlug={organizationSlug}
			/>

			{/* Row 3: Quick Actions */}
			<QuickActionsGrid organizationSlug={organizationSlug} />

			{/* Row 4: Alerts (only renders if there are alerts) */}
			<AlertsSection
				overdueInvoices={dashboardData?.overdue?.invoices ?? []}
				overdueMilestones={dashboardData?.overdue?.milestones ?? []}
				pendingSubcontractClaims={dashboardData?.pendingSubcontractClaims ?? 0}
				upcomingPayments={dashboardData?.upcoming ?? []}
				organizationSlug={organizationSlug}
			/>

			{/* Row 5: Financial + Operational */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<FinancialOverviewSection
					totalContractValue={stats?.financials?.totalContractValue ?? 0}
					totalInvoiced={dashboardData?.invoiceTotals?.totalInvoiced ?? 0}
					totalCollected={dashboardData?.invoiceTotals?.totalCollected ?? 0}
					profitMargin={dashboardData?.profitMargin ?? 0}
					financialTrend={dashboardData?.financialTrend ?? []}
				/>
				<OperationalSection
					activeProjects={stats?.projects?.active ?? 0}
					completedProjects={stats?.projects?.completed ?? 0}
					onHoldProjects={stats?.projects?.onHold ?? 0}
					openIssues={stats?.milestones?.overdue ?? 0}
					leadsPipeline={dashboardData?.leadsPipeline ?? {}}
					typeDistribution={dashboardData?.typeDistribution ?? []}
				/>
			</div>

			{/* Row 6: Cash Flow + Company Expenses + Recent Activity */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-11 lg:items-stretch">
				<div className="lg:col-span-5">
					<CashFlowSection organizationSlug={organizationSlug} />
				</div>
				<div className="lg:col-span-3">
					<CompanyExpensesSection
						byCategory={companyExpenseData?.byCategory ?? {}}
						monthlyExpenses={companyExpenseData?.monthlyExpenses ?? []}
						organizationSlug={organizationSlug}
					/>
				</div>
				<div className="lg:col-span-3">
					<RecentActivitySection
						activities={dashboardData?.activities ?? []}
						upcomingMilestones={dashboardData?.upcoming ?? []}
						organizationSlug={organizationSlug}
					/>
				</div>
			</div>
		</div>
	);
}
