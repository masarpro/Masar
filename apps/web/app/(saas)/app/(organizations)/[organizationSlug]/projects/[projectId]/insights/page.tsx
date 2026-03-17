import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProjectInsights } from "@saas/projects/components/ProjectInsights";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("projects.insights.title"),
	};
}

export default async function ProjectInsightsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<ProjectInsightsPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function ProjectInsightsPageContent({
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
		<ProjectInsights
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
		/>
	);
}
