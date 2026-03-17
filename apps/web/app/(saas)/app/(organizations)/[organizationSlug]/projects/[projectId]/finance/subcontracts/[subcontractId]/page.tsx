import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { SubcontractDetailView } from "@saas/projects/components/finance/subcontracts/SubcontractDetailView";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("subcontracts.contractDetails"),
	};
}

export default async function SubcontractDetailPage({
	params,
}: {
	params: Promise<{
		organizationSlug: string;
		projectId: string;
		subcontractId: string;
	}>;
}) {
	const { organizationSlug, projectId, subcontractId } = await params;

	return (
		<Suspense fallback={<DetailPageSkeleton />}>
			<SubcontractDetailPageContent
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
			/>
		</Suspense>
	);
}

async function SubcontractDetailPageContent({
	organizationSlug,
	projectId,
	subcontractId,
}: {
	organizationSlug: string;
	projectId: string;
	subcontractId: string;
}) {
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<SubcontractDetailView
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
			/>
		</div>
	);
}
