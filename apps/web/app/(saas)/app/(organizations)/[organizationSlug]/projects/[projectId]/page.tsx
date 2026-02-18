import { getActiveOrganization } from "@saas/auth/lib/server";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

const ProjectOverview = dynamic(
	() =>
		import("@saas/projects/components/ProjectOverview").then((m) => ({
			default: m.ProjectOverview,
		})),
	{
		loading: () => (
			<div className="flex min-h-[40vh] items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		),
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
