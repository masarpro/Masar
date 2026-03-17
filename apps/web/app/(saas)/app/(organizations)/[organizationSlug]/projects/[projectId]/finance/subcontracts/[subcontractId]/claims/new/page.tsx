import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { SubcontractClaimForm } from "@saas/projects/components/finance/subcontracts/SubcontractClaimForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("claims.newClaim"),
	};
}

export default async function NewSubcontractClaimPage({
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
		<Suspense fallback={<FormPageSkeleton />}>
			<NewSubcontractClaimPageContent
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
			/>
		</Suspense>
	);
}

async function NewSubcontractClaimPageContent({
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
			<SubcontractClaimForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
			/>
		</div>
	);
}
