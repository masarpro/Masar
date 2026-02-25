import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingEditor } from "@saas/pricing/components/studies/PricingEditor";
import { PricingShell } from "@saas/pricing/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("pricing.studies.pricing.title"),
	};
}

export default async function StudyPricingPage({
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
			pageTitle={(await getTranslations())("quantities.pricing.title")}
		>
			<PricingEditor
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>
		</PricingShell>
	);
}
