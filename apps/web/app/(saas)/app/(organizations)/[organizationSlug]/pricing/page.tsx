import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { PricingDashboard } from "@saas/pricing/components/dashboard/PricingDashboard";
import { PricingShell } from "@saas/pricing/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { orpc } from "@shared/lib/orpc-query-utils";
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
		title: t("pricing.title"),
	};
}

export default async function PricingPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<PricingPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function PricingPageContent({
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

	// Server-prefetch the aggregated pricing dashboard query so it paints with
	// data immediately instead of showing a skeleton after hydration.
	const queryClient = getServerQueryClient();
	await queryClient.prefetchQuery(
		orpc.pricing.dashboard.queryOptions({
			input: { organizationId: activeOrganization.id },
		}),
	);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<PricingShell organizationSlug={organizationSlug}>
				<PricingDashboard
					organizationId={activeOrganization.id}
					userName={userName}
				/>
			</PricingShell>
		</HydrationBoundary>
	);
}
