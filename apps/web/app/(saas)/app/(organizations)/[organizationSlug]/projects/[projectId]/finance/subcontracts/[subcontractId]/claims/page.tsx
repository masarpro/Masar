import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { SubcontractClaimsListView } from "@saas/projects/components/finance/subcontracts/SubcontractClaimsListView";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("claims.subcontractClaims"),
	};
}

export default async function SubcontractClaimsPage({
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
		<Suspense fallback={<ListTableSkeleton />}>
			<SubcontractClaimsPageContent
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
			/>
		</Suspense>
	);
}

async function SubcontractClaimsPageContent({
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
			<SubcontractClaimsListView
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
			/>
		</div>
	);
}
