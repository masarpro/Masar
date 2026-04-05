import { getActiveOrganization } from "@saas/auth/lib/server";
import { OwnerDetailPage } from "@saas/settings/components/owners/OwnerDetailPage";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("settings.owners.ownerDetails") };
}

export default async function OwnerDetailRoute({
	params,
}: {
	params: Promise<{ organizationSlug: string; ownerId: string }>;
}) {
	const { organizationSlug, ownerId } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) return notFound();

	return (
		<OwnerDetailPage
			organizationId={organization.id}
			organizationSlug={organizationSlug}
			ownerId={ownerId}
		/>
	);
}
