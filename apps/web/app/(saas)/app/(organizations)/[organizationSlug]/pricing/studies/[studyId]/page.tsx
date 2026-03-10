import { getActiveOrganization } from "@saas/auth/lib/server";
import { CostStudyOverview } from "@saas/pricing/components/studies/CostStudyOverview";
import { StudyPageShell } from "@saas/pricing/components/studies/StudyPageShell";
import { PricingShell } from "@saas/pricing/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("pricing.studies.studyDetails"),
	};
}

export default async function CostStudyPage({
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
		>
			<StudyPageShell
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
			>
				<CostStudyOverview
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					studyId={studyId}
				/>
			</StudyPageShell>
		</PricingShell>
	);
}
