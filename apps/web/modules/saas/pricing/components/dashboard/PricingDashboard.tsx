"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Currency } from "@saas/finance/components/shared/Currency";
import { PricingStatsCards } from "./PricingStatsCards";
import { PricingRecentDocsTable } from "./PricingRecentDocsTable";
import { PricingShortcutsCard } from "./PricingShortcutsCard";
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

	return (
		<div className="space-y-6" dir="rtl">
			{/* Row 1 — Botly hero (65%) beside the pricing pipeline chart (35%) */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[65fr_35fr]">
				<div className="lg:h-[300px]">
					<ModuleHeroCard
						fill
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
				</div>
				<div className="lg:h-[300px]">
					{pipeline ? (
						<PricingPipelineChart pipeline={pipeline} />
					) : (
						<div className="flex h-full min-h-[200px] items-center justify-center rounded-3xl border-2 bg-card text-sm text-muted-foreground">
							—
						</div>
					)}
				</div>
			</div>

			{/* Row 2 — stat cards in one line (Clients, Expiring, Conversion Rate) */}
			<PricingStatsCards
				activeClients={clients?.total ?? 0}
				expiringQuotations={quotations?.expiringCount ?? 0}
				conversionRate={quotations?.conversionRate ?? 0}
			/>

			{/* Row 3 — recent documents (65%) beside pricing shortcuts (35%) */}
			<div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[65fr_35fr]">
				<PricingRecentDocsTable
					documents={recentDocuments}
					organizationSlug={orgSlug}
				/>
				<PricingShortcutsCard
					organizationSlug={orgSlug}
					organizationId={organizationId}
				/>
			</div>
		</div>
	);
}
