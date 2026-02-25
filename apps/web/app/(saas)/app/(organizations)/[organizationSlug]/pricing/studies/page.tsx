import { getActiveOrganization } from "@saas/auth/lib/server";
import { QuantitiesList } from "@saas/pricing/components/studies/QuantitiesList";
import { PricingShell } from "@saas/pricing/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("pricing.studies.title"),
	};
}

export default async function StudiesPage({
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
		>
			<QuantitiesList organizationId={activeOrganization.id} />
		</PricingShell>
	);
}
