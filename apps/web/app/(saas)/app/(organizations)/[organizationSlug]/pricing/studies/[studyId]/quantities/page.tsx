import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingShell } from "@saas/pricing/components/shell";
import { QuantitiesPageContent } from "@saas/pricing/components/pipeline/QuantitiesPageContent";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("pricing.pipeline.quantities"),
	};
}

export default async function QuantitiesPage({
	params,
	searchParams,
}: {
	params: Promise<{ organizationSlug: string; studyId: string }>;
	searchParams: Promise<{ tab?: string }>;
}) {
	const { organizationSlug, studyId } = await params;
	const { tab } = await searchParams;

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<PricingShell
			organizationSlug={organizationSlug}
			sectionKey="studies"
			hideSubPageHeader
		>
			<QuantitiesPageContent
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
				initialTab={tab}
			/>
		</PricingShell>
	);
}
