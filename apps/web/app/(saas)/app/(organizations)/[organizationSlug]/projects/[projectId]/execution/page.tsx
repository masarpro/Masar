import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PageContextProvider } from "@saas/ai/components/PageContextProvider";
import { FieldTimeline } from "@saas/projects/components/field/FieldTimeline";
import { ExecutionDashboard } from "@saas/projects-execution/components";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

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

	return (
		<Suspense fallback={<ListTableSkeleton rows={6} cols={4} />}>
			<ExecutionPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function ExecutionPageContent({
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
		<PageContextProvider
			moduleId="execution"
			pageName="Project Execution"
			pageNameAr="تنفيذ المشروع"
			pageDescription="عرض لوحة التنفيذ والأنشطة الميدانية للمشروع"
			visibleStats={{}}
		>
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
		</PageContextProvider>
	);
}
