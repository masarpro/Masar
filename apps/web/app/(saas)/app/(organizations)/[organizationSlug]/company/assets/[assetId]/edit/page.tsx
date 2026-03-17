import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AssetForm } from "@saas/company/components/assets/AssetForm";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";

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
	return (
		<Suspense fallback={<FormPageSkeleton />}>
			<EditAssetPageContent
				organizationSlug={organizationSlug}
				assetId={assetId}
			/>
		</Suspense>
	);
}

async function EditAssetPageContent({
	organizationSlug,
	assetId,
}: { organizationSlug: string; assetId: string }) {
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
