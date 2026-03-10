import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingShell } from "@saas/pricing/components/shell";
import { SellingPricePageContent } from "@saas/pricing/components/pipeline/SellingPricePageContent";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("pricing.pipeline.sellingPrice"),
	};
}

export default async function SellingPricePage({
	params,
}: {
	params: Promise<{ organizationSlug: string; studyId: string }>;
}) {
	const { organizationSlug, studyId } = await params;

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
			<SellingPricePageContent
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>
		</PricingShell>
	);
}
