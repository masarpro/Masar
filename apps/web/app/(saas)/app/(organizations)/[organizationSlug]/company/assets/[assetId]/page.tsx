import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AssetDetail } from "@saas/company/components/assets/AssetDetail";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.assets.details") };
}

export default async function AssetDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; assetId: string }>;
}) {
	const { organizationSlug, assetId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<AssetDetail
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			assetId={assetId}
		/>
	);
}
