import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProjectFinanceHub } from "@saas/projects/components/finance/ProjectFinanceHub";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("finance.projectHub.title"),
	};
}

export default async function ProjectExpensesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<ListTableSkeleton />}>
			<ProjectExpensesPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function ProjectExpensesPageContent({
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
		<div>
			<ProjectFinanceHub
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
