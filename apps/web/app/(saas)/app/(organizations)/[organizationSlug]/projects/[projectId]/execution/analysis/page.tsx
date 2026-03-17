import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { AnalysisPage } from "@saas/projects-execution/components/analysis/AnalysisPage";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("execution.analysis.title"),
	};
}

export default async function ExecutionAnalysisPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<ExecutionAnalysisPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function ExecutionAnalysisPageContent({
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

	return <AnalysisPage projectId={projectId} />;
}
