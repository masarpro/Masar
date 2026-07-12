import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingShell } from "@saas/pricing/components/shell";
import { StudyPageShell } from "@saas/pricing/components/studies/StudyPageShell";
import { QuickPricingPageContent } from "@saas/pricing/components/pricing-v2/QuickPricingPageContent";
import { redirectIfUnified } from "@saas/pricing/lib/guards/redirect-if-unified";
import { StudyOverviewSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";

export default async function QuickPricingPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; studyId: string }>;
}) {
	const { organizationSlug, studyId } = await params;

	return (
		<Suspense fallback={<StudyOverviewSkeleton />}>
			<QuickPricingPageContentWrapper organizationSlug={organizationSlug} studyId={studyId} />
		</Suspense>
	);
}

async function QuickPricingPageContentWrapper({ organizationSlug, studyId }: { organizationSlug: string; studyId: string }) {
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
				<QuickPricingPageContent
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					studyId={studyId}
				/>
			</StudyPageShell>
		</PricingShell>
	);
}
