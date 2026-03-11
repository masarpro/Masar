import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingShell } from "@saas/pricing/components/shell";
import { StudyPageShell } from "@saas/pricing/components/studies/StudyPageShell";
import { QuantitiesSubTabs } from "@saas/pricing/components/studies/QuantitiesSubTabs";
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
			<StudyPageShell
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
			>
				<QuantitiesSubTabs
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					studyId={studyId}
				/>
			</StudyPageShell>
		</PricingShell>
	);
}
