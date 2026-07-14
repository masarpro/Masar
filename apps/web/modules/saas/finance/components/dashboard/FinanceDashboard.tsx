"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useTranslations } from "next-intl";
import { StatsCards } from "./StatsCards";
import { RecentDocumentsTable } from "./RecentDocumentsTable";
import { FinanceShortcutsCard } from "./FinanceShortcutsCard";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { ModuleHeroCard } from "@saas/shared/components/ModuleHeroCard";
import { FinancePanel } from "@saas/dashboard/components/sections/FinancePanel";
import { Currency } from "../shared/Currency";

interface FinanceDashboardProps {
	organizationId: string;
	userName?: string;
}

export function FinanceDashboard({
	organizationId,
	userName,
}: FinanceDashboardProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const orgSlug = activeOrganization?.slug ?? "";

	const { data, isLoading } = useQuery(
		orpc.finance.dashboard.queryOptions({
			input: { organizationId },
		}),
	);

	const { data: orgData } = useQuery(
		orpc.finance.orgDashboard.queryOptions({
			input: { organizationId },
		}),
	);

	// Monthly revenue/expenses trend — feeds the same cash-flow card the home
	// dashboard uses (member-gated getAll; financialTrend = monthly claims/expenses).
	const { data: trendData } = useQuery(
		orpc.dashboard.getAll.queryOptions({
			input: { organizationId, activitiesLimit: 5, upcomingLimit: 5 },
		}),
	);

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	const stats = data?.stats;
	const recentInvoices = data?.recentInvoices ?? [];

	const cashBalance = orgData?.balances.totalCashBalance ?? 0;
	const bankBalance = orgData?.balances.totalBankBalance ?? 0;
	const netProfit = (orgData?.payments.total ?? 0) - (orgData?.totalMoneyOut ?? 0);
	const financialTrend = trendData?.financialTrend ?? [];

	return (
		<div className="space-y-6">
			{/* Row 1 — Botly hero (65%) beside the home-dashboard cash-flow card (35%) */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[65fr_35fr]">
				<div className="lg:h-[300px]">
					<ModuleHeroCard
						fill
						title={t("finance.title")}
						subtitle={`${t("finance.dashboard.hello")}${userName ? ` ${userName}` : ""}`}
						cta={{
							label: t("finance.pages.accountingDashboard"),
							href: `/app/${orgSlug}/finance/accounting-dashboard`,
						}}
						stats={[
							{
								label: t("finance.dashboard.overview.cashBalance"),
								value: <Currency amount={cashBalance} />,
							},
							{
								label: t("finance.dashboard.overview.bankBalance"),
								value: <Currency amount={bankBalance} />,
							},
							{
								label: t("finance.dashboard.overview.netProfit"),
								value: <Currency amount={netProfit} />,
							},
						]}
					/>
				</div>
				<div className="lg:h-[300px]">
					<FinancePanel
						financialTrend={financialTrend}
						organizationSlug={orgSlug}
					/>
				</div>
			</div>

			{/* Row 2 — stat cards in one line (Invoices, Outstanding, Clients) */}
			<StatsCards stats={stats} />

			{/* Row 3 — recent documents (65%) beside finance shortcuts (35%) */}
			<div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[65fr_35fr]">
				<RecentDocumentsTable
					invoices={recentInvoices}
					organizationSlug={orgSlug}
				/>
				<FinanceShortcutsCard organizationSlug={orgSlug} />
			</div>
		</div>
	);
}
