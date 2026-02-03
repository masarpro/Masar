import { getActiveOrganization } from "@saas/auth/lib/server";
import { SupervisorMode } from "@saas/projects/components/supervisor/SupervisorMode";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.supervisor.title"),
	};
}

export default async function SupervisorPage({
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
		<SupervisorMode
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
		/>
	);
}
