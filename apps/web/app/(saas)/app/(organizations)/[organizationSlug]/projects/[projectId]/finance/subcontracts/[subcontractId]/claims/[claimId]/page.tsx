import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { SubcontractClaimDetailView } from "@saas/projects/components/finance/subcontracts/SubcontractClaimDetailView";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

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
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);
	if (!activeOrganization) {
		return notFound();
	}
	return (
		<div>
			<Suspense>
				<SubcontractClaimDetailView
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					projectId={projectId}
					subcontractId={subcontractId}
					claimId={claimId}
				/>
			</Suspense>
		</div>
	);
}
