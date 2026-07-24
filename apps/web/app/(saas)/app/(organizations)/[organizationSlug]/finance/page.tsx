import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { FinanceDashboard } from "@saas/finance/components/dashboard/FinanceDashboard";
import { FinanceShell } from "@saas/finance/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { orpcServer } from "@shared/lib/orpc-server";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.title"),
	};
}

export default async function FinancePage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<FinancePageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function FinancePageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const [activeOrganization, session] = await Promise.all([
		getActiveOrganization(organizationSlug),
		getSession(),
	]);

	if (!activeOrganization) {
		return notFound();
	}

	const userName = session?.user?.name ?? "";
	const organizationId = activeOrganization.id;

	// Server-prefetch the three dashboard queries (same keys/inputs the client
	// component uses) so the page paints with data on first load instead of a
	// skeleton → client round-trip swap. Each client RPC costs a full
	// user↔function network round trip, so hydrating here removes the slowest
	// part of this page.
	const queryClient = getServerQueryClient();
	await Promise.all([
		queryClient.prefetchQuery(
			orpcServer.finance.dashboard.queryOptions({ input: { organizationId } }),
		),
		queryClient.prefetchQuery(
			orpcServer.finance.orgDashboard.queryOptions({ input: { organizationId } }),
		),
		queryClient.prefetchQuery(
			orpcServer.dashboard.getAll.queryOptions({
				input: { organizationId, activitiesLimit: 5, upcomingLimit: 5 },
			}),
		),
	]);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<FinanceShell organizationSlug={organizationSlug}>
				<FinanceDashboard
					organizationId={organizationId}
					userName={userName}
				/>
			</FinanceShell>
		</HydrationBoundary>
	);
}
