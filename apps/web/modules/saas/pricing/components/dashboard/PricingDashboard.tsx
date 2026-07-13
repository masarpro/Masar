"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Currency } from "@saas/finance/components/shared/Currency";
import { PricingActionCards } from "./PricingActionCards";
import { PricingStatsCards } from "./PricingStatsCards";
import { PricingRecentDocsTable } from "./PricingRecentDocsTable";
import { PricingDeadlinesCard } from "./PricingDeadlinesCard";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { ModuleHeroCard } from "@saas/shared/components/ModuleHeroCard";
import { Skeleton } from "@ui/components/skeleton";

const PricingPipelineChart = dynamic(
	() => import("./PricingPipelineChart").then((m) => ({ default: m.PricingPipelineChart })),
	{ loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />, ssr: false },
);

interface PricingDashboardProps {
	organizationId: string;
	userName?: string;
}

export function PricingDashboard({
	organizationId,
	userName,
}: PricingDashboardProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const orgSlug = activeOrganization?.slug ?? "";

	const { data, isLoading } = useQuery(
		orpc.pricing.dashboard.queryOptions({
			input: { organizationId },
		}),
	);

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	const studies = data?.studies;
	const quotations = data?.quotations;
	const leads = data?.leads;
	const clients = data?.clients;
	const pipeline = data?.pipeline;
	const recentDocuments = data?.recentDocuments ?? [];
	const expiringQuotations = data?.expiringQuotations ?? [];

	return (
		<div className="space-y-6" dir="rtl">
			{/* 0. Botly module hero — page name + primary action + KPI strip */}
			<ModuleHeroCard
				title={t("pricing.title")}
				subtitle={`${t("pricing.dashboard.hello")}${userName ? ` ${userName}` : ""}`}
				cta={{
					label: t("pricing.studies.newStudy"),
					href: `/app/${orgSlug}/pricing/studies?new=1`,
				}}
				stats={[
					{
						label: t("pricing.dashboard.overview.studiesValue"),
						value: <Currency amount={studies?.totalValue ?? 0} />,
					},
					{
						label: t("pricing.dashboard.overview.activeQuotations"),
						value: <Currency amount={quotations?.activeValue ?? 0} />,
					},
					{
						label: t("pricing.dashboard.overview.leadsPipeline"),
						value: <Currency amount={leads?.openEstimatedValue ?? 0} />,
					},
				]}
			/>

			{/* 2. Pipeline Chart */}
			{pipeline && <PricingPipelineChart pipeline={pipeline} />}

			{/* 3. Quick Action Cards (Studies, Quotations, Leads) */}
			<PricingActionCards organizationSlug={orgSlug} organizationId={organizationId} />

			<hr className="border-border" />

			{/* 4. Stats Cards (Clients, Expiring, Conversion Rate) */}
			<PricingStatsCards
				activeClients={clients?.total ?? 0}
				expiringQuotations={quotations?.expiringCount ?? 0}
				conversionRate={quotations?.conversionRate ?? 0}
			/>

			{/* 5. Bottom Section (Recent Documents + Deadlines) */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<PricingRecentDocsTable
						documents={recentDocuments}
						organizationSlug={orgSlug}
					/>
				</div>
				<PricingDeadlinesCard
					expiringQuotations={expiringQuotations}
					organizationSlug={orgSlug}
				/>
			</div>
		</div>
	);
}
