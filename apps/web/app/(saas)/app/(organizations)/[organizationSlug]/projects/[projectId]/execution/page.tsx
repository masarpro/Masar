import { getActiveOrganization } from "@saas/auth/lib/server";
import { FieldTimeline } from "@saas/projects/components/field/FieldTimeline";
import { ProjectPhotosCard } from "@saas/projects/components/field/ProjectPhotosCard";
import { TimelineBoard } from "@saas/projects-timeline/components/TimelineBoard";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.shell.sections.execution"),
	};
}

export default async function ExecutionPage({
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
		<div className="space-y-8">
			{/* Timeline Section */}
			<section>
				<TimelineBoard projectId={projectId} />
			</section>

			{/* Project Photos */}
			<section>
				<ProjectPhotosCard
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					projectId={projectId}
				/>
			</section>

			{/* Divider */}
			<div className="border-t border-slate-200 dark:border-slate-700" />

			{/* Field Section */}
			<section>
				<FieldTimeline
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					projectId={projectId}
				/>
			</section>
		</div>
	);
}
