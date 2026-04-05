import { getActiveOrganization } from "@saas/auth/lib/server";
import { OwnersList } from "@saas/settings/components/owners/OwnersList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("settings.owners.title") };
}

export default async function OwnersSettingsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) return notFound();

	return (
		<OwnersList
			organizationId={organization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
