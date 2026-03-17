import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { AdvancedGanttView } from "@saas/projects-execution/components/advanced/AdvancedGanttView";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("execution.advanced.title"),
	};
}

export default async function AdvancedGanttPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<AdvancedGanttPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function AdvancedGanttPageContent({
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

	return <AdvancedGanttView projectId={projectId} />;
}
