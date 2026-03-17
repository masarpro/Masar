import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AssetForm } from "@saas/company/components/assets/AssetForm";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.assets.addAsset") };
}

export default async function NewAssetPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	return (
		<Suspense fallback={<FormPageSkeleton />}>
			<NewAssetPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function NewAssetPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<AssetForm
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
