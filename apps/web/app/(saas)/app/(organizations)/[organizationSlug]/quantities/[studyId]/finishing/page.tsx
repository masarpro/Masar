import { getActiveOrganization } from "@saas/auth/lib/server";
import { FinishingItemsEditor } from "@saas/quantities/components/FinishingItemsEditor";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("quantities.finishing.title"),
	};
}

export default async function FinishingItemsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; studyId: string }>;
}) {
	const { organizationSlug, studyId } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<PageHeader
				title={t("quantities.finishing.title")}
				subtitle={t("quantities.finishing.subtitle")}
			/>
			<FinishingItemsEditor
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>
		</div>
	);
}
