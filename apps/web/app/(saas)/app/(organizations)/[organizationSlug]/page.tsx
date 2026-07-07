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

	// Server-prefetch the three dashboard queries with the SAME permission
	// gating and inputs the client Dashboard uses, so it paints with data on
	// first load instead of a full-page skeleton → content swap.
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
		);
	}
	if (showFinance) {
		prefetches.push(
			queryClient.prefetchQuery(
				orpcServer.finance.orgDashboard.queryOptions({
					input: { organizationId },
				}),
			),
		);
	}
	if (showProjects) {
		prefetches.push(
			queryClient.prefetchQuery(
				orpcServer.projects.list.queryOptions({
					input: { organizationId, status: "ACTIVE" as const },
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
