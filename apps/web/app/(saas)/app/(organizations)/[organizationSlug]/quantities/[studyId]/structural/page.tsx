import { getActiveOrganization } from "@saas/auth/lib/server";
import { StructuralItemsEditor } from "@saas/quantities/components/StructuralItemsEditor";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("quantities.structural.title"),
	};
}

export default async function StructuralItemsPage({
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
				title={t("quantities.structural.title")}
				subtitle={t("quantities.structural.subtitle")}
			/>
			<StructuralItemsEditor
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>
		</div>
	);
}
