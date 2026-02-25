import { getActiveOrganization } from "@saas/auth/lib/server";
import { CreateCostStudyForm } from "@saas/pricing/components/studies/CreateCostStudyForm";
import { PricingShell } from "@saas/pricing/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("pricing.studies.newStudy"),
	};
}

export default async function NewStudyPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<PricingShell
			organizationSlug={organizationSlug}
			sectionKey="studies"
			pageTitle={(await getTranslations())("quantities.newStudy")}
		>
			<CreateCostStudyForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</PricingShell>
	);
}
