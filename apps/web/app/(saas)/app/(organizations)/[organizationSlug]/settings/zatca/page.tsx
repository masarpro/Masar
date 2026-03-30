import { getActiveOrganization } from "@saas/auth/lib/server";
import { ZatcaSettingsPage } from "@saas/settings/components/ZatcaSettingsPage";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("zatca.title") };
}

export default async function ZatcaSettingsRoute({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) return notFound();

	return (
		<ZatcaSettingsPage
			organizationId={organization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
