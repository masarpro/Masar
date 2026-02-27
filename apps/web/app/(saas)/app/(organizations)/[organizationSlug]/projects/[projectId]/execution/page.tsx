import { getActiveOrganization } from "@saas/auth/lib/server";
import { FieldTimeline } from "@saas/projects/components/field/FieldTimeline";
import { ExecutionDashboard } from "@saas/projects-execution/components";
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
			{/* Execution Dashboard */}
			<section>
				<ExecutionDashboard projectId={projectId} />
			</section>

			{/* Divider */}
			<div className="border-t border-slate-200 dark:border-slate-700" />

			{/* Field Activity Feed */}
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
