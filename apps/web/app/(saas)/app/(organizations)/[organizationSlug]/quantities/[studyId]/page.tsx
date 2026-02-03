import { getActiveOrganization } from "@saas/auth/lib/server";
import { CostStudyOverview } from "@saas/quantities/components/CostStudyOverview";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("quantities.studyDetails"),
	};
}

export default async function CostStudyPage({
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
			<CostStudyOverview
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				studyId={studyId}
			/>
		</div>
	);
}
