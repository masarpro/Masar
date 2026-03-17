import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProjectUpdates } from "@saas/projects/components/ProjectUpdates";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("projects.updates.title"),
	};
}

export default async function ProjectUpdatesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<ListTableSkeleton />}>
			<ProjectUpdatesPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function ProjectUpdatesPageContent({
	organizationSlug,
	projectId,
}: {
	organizationSlug: string;
	projectId: string;
}) {
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<ProjectUpdates
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
		/>
	);
}
