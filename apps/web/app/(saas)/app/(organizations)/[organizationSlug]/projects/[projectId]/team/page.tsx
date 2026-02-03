import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProjectTeamManagement } from "@saas/projects/components/team/ProjectTeamManagement";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.team.title"),
	};
}

export default async function TeamPage({
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
			<ProjectTeamManagement
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
