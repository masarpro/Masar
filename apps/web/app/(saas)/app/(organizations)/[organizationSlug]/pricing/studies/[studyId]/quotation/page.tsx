import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingShell } from "@saas/pricing/components/shell";
import { StudyPageShell } from "@saas/pricing/components/studies/StudyPageShell";
import { StudyQuotationPageContent } from "@saas/pricing/components/quotation-builder/StudyQuotationPageContent";
import { notFound } from "next/navigation";

export async function generateMetadata() {
	return {
		title: "عرض السعر",
	};
}

export default async function QuotationPage({
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
				<StudyQuotationPageContent
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					studyId={studyId}
				/>
			</StudyPageShell>
		</PricingShell>
	);
}
