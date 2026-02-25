import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AssetForm } from "@saas/company/components/assets/AssetForm";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.assets.editAsset") };
}

export default async function EditAssetPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; assetId: string }>;
}) {
	const { organizationSlug, assetId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<AssetForm
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			assetId={assetId}
		/>
	);
}
