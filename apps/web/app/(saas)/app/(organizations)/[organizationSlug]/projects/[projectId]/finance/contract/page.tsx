import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProjectContractView } from "@saas/projects/components/finance/ProjectContractView";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.contract.title"),
	};
}

export default async function ProjectContractPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<DetailPageSkeleton />}>
			<ProjectContractPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function ProjectContractPageContent({
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
			<ProjectContractView
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
