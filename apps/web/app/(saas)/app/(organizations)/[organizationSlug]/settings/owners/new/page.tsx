import { getActiveOrganization } from "@saas/auth/lib/server";
import { OwnerForm } from "@saas/settings/components/owners/OwnerForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("settings.owners.addOwner") };
}

export default async function NewOwnerPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) return notFound();

	return (
		<OwnerForm
			organizationId={organization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
