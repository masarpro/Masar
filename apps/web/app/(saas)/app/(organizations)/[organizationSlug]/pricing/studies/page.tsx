import { getActiveOrganization } from "@saas/auth/lib/server";
import { PageContextProvider } from "@saas/ai/components/PageContextProvider";
import { QuantitiesList } from "@saas/pricing/components/studies/QuantitiesList";
import { PricingShell } from "@saas/pricing/components/shell";
import { orpcServer } from "@shared/lib/orpc-server";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("pricing.studies.title"),
	};
}

export default async function StudiesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	// No inner Suspense: the route loading.tsx skeleton covers the await.
	return <StudiesPageContent organizationSlug={organizationSlug} />;
}

async function StudiesPageContent({ organizationSlug }: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	// Server-prefetch the default list (no filters) with the same key the
	// client uses so the table paints with rows on first load.
	const queryClient = getServerQueryClient();
	await queryClient.prefetchQuery(
		orpcServer.pricing.studies.list.queryOptions({
			input: { organizationId: activeOrganization.id },
		}),
	);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<PageContextProvider
				moduleId="quantities"
				pageName="Cost Studies"
				pageNameAr="دراسات الكميات"
				pageDescription="عرض دراسات الكميات وتحليل التكاليف"
				visibleStats={{}}
			>
				<PricingShell
					organizationSlug={organizationSlug}
					sectionKey="studies"
				>
					<QuantitiesList organizationId={activeOrganization.id} />
				</PricingShell>
			</PageContextProvider>
		</HydrationBoundary>
	);
}
