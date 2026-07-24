import { getActiveOrganization } from "@saas/auth/lib/server";
import { CompanyDashboard } from "@saas/company/components/dashboard/CompanyDashboard";
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
	return { title: t("company.title") };
}

export default async function CompanyPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<CompanyPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function CompanyPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	const organizationId = activeOrganization.id;

	// Server-prefetch the dashboard payload (same key/input as the client
	// query) so the page hydrates with data instead of a second skeleton.
	const queryClient = getServerQueryClient();
	await queryClient.prefetchQuery(
		orpcServer.company.dashboard.queryOptions({ input: { organizationId } }),
	);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<CompanyDashboard organizationId={organizationId} />
		</HydrationBoundary>
	);
}
