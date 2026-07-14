"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
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

	const quotations = data?.quotations;
	const clients = data?.clients;
	const pipeline = data?.pipeline;
	// Hero + query both cap at 5; slice guards against stale cached payloads.
	const recentDocuments = (data?.recentDocuments ?? []).slice(0, 5);

	return (
		// One grid: mobile stacks in DOM order (hero → shortcuts → chart →
		// recent docs); on lg, explicit placement rebuilds the 65/35 rows
		// (hero|chart · recent-docs|shortcuts).
		<div
			className="grid grid-cols-1 gap-6 lg:grid-cols-[65fr_35fr] lg:grid-rows-[minmax(300px,auto)_auto]"
			dir="rtl"
		>
			{/* Hero — mobile 1st · desktop col 1 / row 1 */}
			<div className="lg:col-start-1 lg:row-start-1">
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
							label: t("pricing.dashboard.stats.activeClients"),
							value: clients?.total ?? 0,
						},
						{
							label: t("pricing.dashboard.stats.expiringQuotations"),
							value: quotations?.expiringCount ?? 0,
						},
						{
							label: t("pricing.dashboard.stats.conversionRate"),
							value: `${quotations?.conversionRate ?? 0}%`,
						},
					]}
				/>
			</div>

			{/* Shortcuts — mobile directly under the hero · desktop col 2 / row 2 */}
			<div className="lg:col-start-2 lg:row-start-2">
				<PricingShortcutsCard
					organizationSlug={orgSlug}
					organizationId={organizationId}
				/>
			</div>

			{/* Pipeline chart — mobile 3rd · desktop col 2 / row 1 */}
			<div className="lg:col-start-2 lg:row-start-1">
				{pipeline ? (
					<PricingPipelineChart pipeline={pipeline} />
				) : (
					<div className="flex h-full min-h-[200px] items-center justify-center rounded-3xl border-2 bg-card text-sm text-muted-foreground">
						—
					</div>
				)}
			</div>

			{/* Recent documents — mobile 4th · desktop col 1 / row 2 */}
			<div className="lg:col-start-1 lg:row-start-2">
				<PricingRecentDocsTable
					documents={recentDocuments}
					organizationSlug={orgSlug}
				/>
			</div>
		</div>
	);
}
