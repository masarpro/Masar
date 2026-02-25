import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AssetList } from "@saas/company/components/assets/AssetList";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.assets.title") };
}

export default async function AssetsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<AssetList
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
