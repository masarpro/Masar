import { getActiveOrganization } from "@saas/auth/lib/server";
import { DailyReportForm } from "@saas/projects/components/forms/DailyReportForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.field.newReport"),
	};
}

export default async function NewReportPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<DailyReportForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
