"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import dynamic from "next/dynamic";
import { FinanceHeader } from "./FinanceHeader";
import { BalanceCards } from "./BalanceCards";
import { ActionCards } from "./ActionCards";
import { StatsCards } from "./StatsCards";
import { RecentDocumentsTable } from "./RecentDocumentsTable";
import { DeadlinesCard } from "./DeadlinesCard";

const CashFlowCard = dynamic(
	() => import("./CashFlowCard").then((m) => ({ default: m.CashFlowCard })),
	{ ssr: false },
);

interface FinanceDashboardProps {
	organizationId: string;
	userName?: string;
}

export function FinanceDashboard({
	organizationId,
	userName,
}: FinanceDashboardProps) {
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

	if (isLoading) {
		return null;
	}

	const stats = data?.stats;
	const recentInvoices = data?.recentInvoices ?? [];

	const cashBalance = orgData?.balances.totalCashBalance ?? 0;
	const bankBalance = orgData?.balances.totalBankBalance ?? 0;
	const netProfit = (orgData?.payments.total ?? 0) - (orgData?.totalMoneyOut ?? 0);

	return (
		<div className="space-y-6" dir="rtl">
			{/* 1. Header - Modern design with date and greeting */}
			<FinanceHeader userName={userName} />

			{/* 2. Balance Cards (Cash, Bank, Net Profit) */}
			<BalanceCards
				cashBalance={cashBalance}
				bankBalance={bankBalance}
				netProfit={netProfit}
			/>

			{/* 3. Cash Flow Chart */}
			<CashFlowCard />

			{/* 4. Quick Action Cards (Invoices, Expenses, Payments) */}
			<ActionCards organizationSlug={orgSlug} />

			<hr className="border-border" />

			{/* 5. Stats Cards (Invoices, Outstanding, Clients) */}
			<StatsCards stats={stats} />

			{/* 6. Bottom Section (Recent Documents + Deadlines) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<RecentDocumentsTable
						invoices={recentInvoices}
						organizationSlug={orgSlug}
					/>
				</div>
				<DeadlinesCard
					organizationSlug={orgSlug}
				/>
			</div>
		</div>
	);
}
