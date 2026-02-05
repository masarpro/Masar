"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { FinanceHeader } from "./FinanceHeader";
import { BalanceCards } from "./BalanceCards";
import { CashFlowCard } from "./CashFlowCard";
import { ActionCards } from "./ActionCards";
import { StatsCards } from "./StatsCards";
import { RecentDocumentsTable } from "./RecentDocumentsTable";
import { DeadlinesCard } from "./DeadlinesCard";

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

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	const stats = data?.stats;
	const recentQuotations = data?.recentQuotations ?? [];
	const recentInvoices = data?.recentInvoices ?? [];

	return (
		<div className="space-y-6" dir="rtl">
			{/* 1. Header - Modern design with date and greeting */}
			<FinanceHeader userName={userName} />

			{/* 2. Balance Cards (Cash, Bank, Net Profit) */}
			<BalanceCards />

			{/* 3. Cash Flow Chart */}
			<CashFlowCard />

			{/* 4. Quick Action Cards (Quotations, Invoices, Expenses, Payments) */}
			<ActionCards organizationSlug={orgSlug} />

			<hr className="border-border" />

			{/* 5. Stats Cards (Quotations, Invoices, Outstanding, Clients) */}
			<StatsCards stats={stats} />

			{/* 6. Bottom Section (Recent Documents + Deadlines) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<RecentDocumentsTable
						quotations={recentQuotations}
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
