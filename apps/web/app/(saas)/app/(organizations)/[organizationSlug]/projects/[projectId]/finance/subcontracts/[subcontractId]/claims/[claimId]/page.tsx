import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { SubcontractClaimDetailView } from "@saas/projects/components/finance/subcontracts/SubcontractClaimDetailView";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("claims.subcontractClaims"),
	};
}

export default async function SubcontractClaimDetailPage({
	params,
}: {
	params: Promise<{
		organizationSlug: string;
		projectId: string;
		subcontractId: string;
		claimId: string;
	}>;
}) {
	const { organizationSlug, projectId, subcontractId, claimId } =
		await params;

	return (
		<Suspense fallback={<DetailPageSkeleton />}>
			<SubcontractClaimDetailPageContent
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
				claimId={claimId}
			/>
		</Suspense>
	);
}

async function SubcontractClaimDetailPageContent({
	organizationSlug,
	projectId,
	subcontractId,
	claimId,
}: {
	organizationSlug: string;
	projectId: string;
	subcontractId: string;
	claimId: string;
}) {
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);
	if (!activeOrganization) {
		return notFound();
	}
	return (
		<div>
			<SubcontractClaimDetailView
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
				claimId={claimId}
			/>
		</div>
	);
}
