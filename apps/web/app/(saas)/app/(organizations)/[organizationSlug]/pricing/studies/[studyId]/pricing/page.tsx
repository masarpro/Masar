import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingPageContentV2 } from "@saas/pricing/components/pricing-v2/PricingPageContentV2";
import { PricingShell } from "@saas/pricing/components/shell";
import { StudyPageShell } from "@saas/pricing/components/studies/StudyPageShell";
import { redirectIfUnified } from "@saas/pricing/lib/guards/redirect-if-unified";
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

	return (
		<Suspense fallback={null}>
			<StudyPricingPageContent organizationSlug={organizationSlug} studyId={studyId} />
		</Suspense>
	);
}

async function StudyPricingPageContent({ organizationSlug, studyId }: { organizationSlug: string; studyId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	await redirectIfUnified(organizationSlug, studyId, activeOrganization.id);

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
				<PricingPageContentV2
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					studyId={studyId}
				/>
			</StudyPageShell>
		</PricingShell>
	);
}
