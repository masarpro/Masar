import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProjectOverviewSkeleton } from "@saas/shared/components/skeletons";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

const ProjectOverview = dynamic(
	() =>
		import("@saas/projects/components/ProjectOverview").then((m) => ({
			default: m.ProjectOverview,
		})),
	{
		loading: () => <ProjectOverviewSkeleton />,
	},
);

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.projectDetails"),
	};
}

export default async function ProjectPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<ProjectOverviewSkeleton />}>
			<ProjectPageContent
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</Suspense>
	);
}

async function ProjectPageContent({
	organizationSlug,
	projectId,
}: { organizationSlug: string; projectId: string }) {
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<ProjectOverview
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
