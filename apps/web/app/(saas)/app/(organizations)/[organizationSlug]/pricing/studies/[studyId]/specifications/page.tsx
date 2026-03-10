import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingShell } from "@saas/pricing/components/shell";
import { SpecificationsPageContent } from "@saas/pricing/components/pipeline/SpecificationsPageContent";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("pricing.pipeline.specifications"),
	};
}

export default async function SpecificationsPage({
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
			<SpecificationsPageContent
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>
		</PricingShell>
	);
}
