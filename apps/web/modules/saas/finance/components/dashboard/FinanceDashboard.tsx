"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { ActionCards } from "./ActionCards";
import { StatsCards } from "./StatsCards";
import { RecentDocumentsTable } from "./RecentDocumentsTable";
import { DeadlinesCard } from "./DeadlinesCard";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { ModuleHeroCard } from "@saas/shared/components/ModuleHeroCard";
import { Skeleton } from "@ui/components/skeleton";
import { Currency } from "../shared/Currency";

const CashFlowCard = dynamic(
	() => import("./CashFlowCard").then((m) => ({ default: m.CashFlowCard })),
	{ loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />, ssr: false },
);

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

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	const stats = data?.stats;
	const recentInvoices = data?.recentInvoices ?? [];

	const cashBalance = orgData?.balances.totalCashBalance ?? 0;
	const bankBalance = orgData?.balances.totalBankBalance ?? 0;
	const netProfit = (orgData?.payments.total ?? 0) - (orgData?.totalMoneyOut ?? 0);

	return (
		<div className="space-y-6">
			{/* 0. Botly module hero — page name + primary action + balance strip */}
			<ModuleHeroCard
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

			{/* 3. Cash Flow Chart */}
			<CashFlowCard organizationId={organizationId} />

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
					organizationId={organizationId}
					organizationSlug={orgSlug}
				/>
			</div>
		</div>
	);
}
