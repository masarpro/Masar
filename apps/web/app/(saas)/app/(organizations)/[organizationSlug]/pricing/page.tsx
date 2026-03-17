import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingDashboard } from "@saas/pricing/components/dashboard/PricingDashboard";
import { PricingShell } from "@saas/pricing/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
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
		<Suspense fallback={<ListTableSkeleton />}>
			<PricingPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function PricingPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<PricingShell organizationSlug={organizationSlug}>
			<PricingDashboard
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</PricingShell>
	);
}
