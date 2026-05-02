import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingShell } from "@saas/pricing/components/shell";
import { StudyPageShell } from "@saas/pricing/components/studies/StudyPageShell";
import { SpecificationsPageContentV2 } from "@saas/pricing/components/specifications/SpecificationsPageContentV2";
import { redirectIfUnified } from "@saas/pricing/lib/guards/redirect-if-unified";
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

	return (
		<Suspense fallback={null}>
			<SpecificationsPageContent organizationSlug={organizationSlug} studyId={studyId} />
		</Suspense>
	);
}

async function SpecificationsPageContent({ organizationSlug, studyId }: { organizationSlug: string; studyId: string }) {
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
				<SpecificationsPageContentV2
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					studyId={studyId}
				/>
			</StudyPageShell>
		</PricingShell>
	);
}
