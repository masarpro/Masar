import { getActiveOrganization } from "@saas/auth/lib/server";
import { CreateCostStudyForm } from "@saas/quantities/components/CreateCostStudyForm";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("quantities.newStudy"),
	};
}

export default async function NewQuantityStudyPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
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
				title={t("quantities.newStudy")}
				subtitle={t("quantities.newStudySubtitle")}
			/>
			<CreateCostStudyForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
