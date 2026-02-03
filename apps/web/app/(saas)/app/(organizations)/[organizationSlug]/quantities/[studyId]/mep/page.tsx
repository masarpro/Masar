import { getActiveOrganization } from "@saas/auth/lib/server";
import { MEPItemsEditor } from "@saas/quantities/components/MEPItemsEditor";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("quantities.mep.title"),
	};
}

export default async function MEPItemsPage({
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
				title={t("quantities.mep.title")}
				subtitle={t("quantities.mep.subtitle")}
			/>
			<MEPItemsEditor
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>
		</div>
	);
}
