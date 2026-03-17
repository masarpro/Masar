"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@saas/auth/hooks/use-session";
import { useTranslations } from "next-intl";

import { BalanceSection, type BalanceChartPoint } from "./BalanceSection";
import { CompanyCard } from "./CompanyCard";
import { CompanyInfo } from "./CompanyInfo";
import { JourneyFlow, useJourneySteps } from "./JourneyFlow";
import { ProjectsCollection } from "./ProjectsCollection";
import { TopBar } from "./TopBar";
import { TransactionsList } from "./TransactionsList";
import { UpcomingPayments } from "./UpcomingPayments";

export function Dashboard() {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const { user } = useSession();
	const organizationSlug = activeOrganization?.slug ?? "";
	const organizationId = activeOrganization?.id ?? "";
	const orgName = activeOrganization?.name ?? "";
	const { completedCount, totalCount } = useJourneySteps();

	// ── Queries ──
	const { data: dashboardData, isLoading: statsLoading } = useQuery({
		...orpc.dashboard.getAll.queryOptions({
			input: { organizationId, activitiesLimit: 5, upcomingLimit: 5 },
		}),
		enabled: !!organizationId,
		staleTime: STALE_TIMES.DASHBOARD_STATS,
	});

	const upcomingMilestones = dashboardData?.upcoming ?? [];

	const { data: orgFinance } = useQuery(
		orpc.finance.orgDashboard.queryOptions({
			input: { organizationId },
		}),
	);

	const { data: financeDashboard } = useQuery({
		...orpc.finance.dashboard.queryOptions({
			input: { organizationId },
		}),
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

	// Finance settings for company info
	const { data: financeSettings } = useQuery({
		...orpc.finance.settings.get.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
		staleTime: STALE_TIMES.FINANCE_SETTINGS,
	});

	if (statsLoading) return <HomeDashboardSkeleton />;

	// ── Derived values ──
	const totalIncome = orgFinance?.payments?.total ?? 0;
	const totalExpenses =
		orgFinance?.totalMoneyOut ??
		dashboardData?.stats?.financials?.totalExpenses ??
		0;
	const bankBalance = orgFinance?.balances?.totalBankBalance ?? 0;
	const cashBalance = orgFinance?.balances?.totalCashBalance ?? 0;
	const totalBalance = bankBalance + cashBalance;
	const projects = projectsData?.projects ?? [];

	const isNewUser =
		(!onboardingProgress?.wizardCompleted || projects.length <= 1) &&
		(financeDashboard?.stats?.invoices?.total ?? 0) === 0;

	// ── Chart data (group recent payments/expenses by day) ──
	const chartData: BalanceChartPoint[] | null = (() => {
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
			.map(([label, val]) => ({ label, ...val }));
		return entries.length > 1 ? entries : null;
	})();

	// ── Transactions (merge recent payments + expenses) ──
	const transactions = (() => {
		const payments = (orgFinance?.recentPayments ?? []).map((p) => ({
			id: p.id,
			type: "PAYMENT" as const,
			description:
				p.description ||
				p.clientName ||
				p.paymentNo ||
				t("dashboard.balance.income"),
			date: p.date ?? p.createdAt,
			amount: Number(p.amount ?? 0),
		}));
		const expenses = (orgFinance?.recentExpenses ?? []).map((e) => ({
			id: e.id,
			type: "EXPENSE" as const,
			description:
				e.description || e.vendorName || e.expenseNo || t("dashboard.balance.expenses"),
			date: e.date ?? e.createdAt,
			amount: Number(e.amount ?? 0),
		}));
		return [...payments, ...expenses]
			.sort(
				(a, b) =>
					new Date(b.date).getTime() - new Date(a.date).getTime(),
			)
			.slice(0, 5);
	})();

	// ── Collection rate ──
	const invoiceStats = financeDashboard?.stats?.invoices;
	const collectionRate =
		invoiceStats && invoiceStats.totalValue > 0
			? (invoiceStats.paidValue / invoiceStats.totalValue) * 100
			: 0;

	return (
		<div
			className="flex h-[calc(100vh-var(--sidebar-header,0px))] flex-col overflow-hidden bg-gray-50 dark:bg-gray-950"
			dir="rtl"
		>
			{/* Top Bar */}
			<TopBar userName={user?.name} />

			{/* Journey flow for new users */}
			{isNewUser && (
				<div className="border-b border-gray-100 px-5 py-3 dark:border-gray-800">
					<JourneyFlow compact />
				</div>
			)}

			{/* Main content */}
			<div className="flex-1 overflow-y-auto p-4 lg:overflow-hidden lg:p-5">
				<div className="grid h-full grid-cols-12 gap-4">
					{/* ═══ Right column (3/12) ═══ */}
					<div className="col-span-12 flex flex-col gap-4 lg:col-span-3 lg:overflow-y-auto">
						{/* Company Card */}
						<CompanyCard
							totalBalance={totalBalance}
							orgName={orgName}
							commercialReg={financeSettings?.commercialReg}
						/>

						{/* Company Info */}
						<CompanyInfo
							organizationSlug={organizationSlug}
							commercialReg={financeSettings?.commercialReg}
							taxNumber={financeSettings?.taxNumber}
							city={financeSettings?.city}
						/>

						{/* Upcoming Payments */}
						<UpcomingPayments
							items={upcomingMilestones}
							organizationSlug={organizationSlug}
						/>
					</div>

					{/* ═══ Main column (9/12) ═══ */}
					<div className="col-span-12 flex flex-col gap-4 overflow-hidden lg:col-span-9">
						{/* Balance Section (top) */}
						<div className="min-h-[280px]">
							<BalanceSection
								totalBalance={totalBalance}
								totalIncome={totalIncome}
								totalExpenses={totalExpenses}
								chartData={chartData}
								organizationSlug={organizationSlug}
							/>
						</div>

						{/* Bottom row: Transactions + Projects */}
						<div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-5">
							{/* Transactions (3/5) */}
							<div className="lg:col-span-3">
								<TransactionsList
									transactions={transactions}
									organizationSlug={organizationSlug}
								/>
							</div>

							{/* Projects & Collection (2/5) */}
							<div className="lg:col-span-2">
								<ProjectsCollection
									projects={projects}
									collectionRate={collectionRate}
									organizationSlug={organizationSlug}
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
