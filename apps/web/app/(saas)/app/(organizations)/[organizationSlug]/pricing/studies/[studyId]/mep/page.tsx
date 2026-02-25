import { getActiveOrganization } from "@saas/auth/lib/server";
import { MEPItemsEditor } from "@saas/pricing/components/studies/MEPItemsEditor";
import { PricingShell } from "@saas/pricing/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("pricing.studies.mep.title"),
	};
}

export default async function MEPItemsPage({
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
			pageTitle={(await getTranslations())("quantities.mep.title")}
		>
			<MEPItemsEditor
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>
		</PricingShell>
	);
}
