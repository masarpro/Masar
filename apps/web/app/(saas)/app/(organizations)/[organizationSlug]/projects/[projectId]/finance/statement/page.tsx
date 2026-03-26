import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProjectStatementView } from "@saas/finance/components/statements/ProjectStatementView";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("accountStatement.projectStatement") };
}

export default async function ProjectStatementPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={10} cols={5} />}>
			<ProjectStatementContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function ProjectStatementContent({
	organizationSlug,
	projectId,
}: { organizationSlug: string; projectId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<ProjectStatementView
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
		/>
	);
}
