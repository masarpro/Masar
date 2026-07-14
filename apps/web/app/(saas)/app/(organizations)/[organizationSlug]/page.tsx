import { getActiveOrganization } from "@saas/auth/lib/server";
import OrganizationStart from "@saas/organizations/components/OrganizationStart";
import { HomeDashboardSkeleton } from "@saas/shared/components/skeletons";
import { cachedGetMyPermissions } from "@shared/lib/cached-queries";
import { orpcServer } from "@shared/lib/orpc-server";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	return {
		title: activeOrganization?.name,
	};
}

export default async function OrganizationPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<HomeDashboardSkeleton />}>
			<OrganizationPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function OrganizationPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	const organizationId = activeOrganization.id;

	// Server-prefetch the dashboard queries with the SAME permission gating and
	// inputs the client Dashboard uses, so it paints with data on first load
	// instead of a full-page skeleton → content swap.
	const myPermissions = await cachedGetMyPermissions(organizationId);
	const { permissions, isOwner } = myPermissions;
	const showFinance = isOwner || (permissions?.finance?.view ?? false);
	const showProjects =
		isOwner ||
		Object.values(permissions?.projects ?? {}).some(Boolean);

	const queryClient = getServerQueryClient();
	const prefetches: Promise<void>[] = [];

	if (showFinance || showProjects) {
		prefetches.push(
			queryClient.prefetchQuery(
				orpcServer.dashboard.getAll.queryOptions({
					input: { organizationId, activitiesLimit: 5, upcomingLimit: 5 },
				}),
			),
			// Hero-carousel saved card: hydrated here so the dashboard paints the
			// member's chosen card on first load instead of flashing the default.
			queryClient.prefetchQuery(
				orpcServer.dashboard.getHeroCardPreference.queryOptions({
					input: { organizationId },
				}),
			),
		);
	}
	if (showFinance) {
		prefetches.push(
			queryClient.prefetchQuery(
				orpcServer.finance.orgDashboard.queryOptions({
					input: { organizationId },
				}),
			),
			// AttentionCard's recent-invoices list (finance-gated, see FE-03).
			// Input MUST match the card's query exactly so it hydrates instead of
			// re-fetching on the client.
			queryClient.prefetchQuery(
				orpcServer.finance.invoices.list.queryOptions({
					input: { organizationId, limit: 3 },
				}),
			),
		);
	}
	if (showProjects) {
		// ActiveProjectsSection reads dashboard.activeProjects (limit 4) — the
		// input MUST match the client Dashboard query so it hydrates at first
		// paint instead of a cold client round-trip.
		prefetches.push(
			queryClient.prefetchQuery(
				orpcServer.dashboard.activeProjects.queryOptions({
					input: { organizationId, limit: 4 },
				}),
			),
		);
	}

	await Promise.all(prefetches);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<OrganizationStart
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				initialPermissions={myPermissions}
			/>
		</HydrationBoundary>
	);
}
