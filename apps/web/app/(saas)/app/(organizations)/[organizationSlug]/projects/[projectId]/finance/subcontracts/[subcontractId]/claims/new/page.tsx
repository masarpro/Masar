import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { SubcontractClaimForm } from "@saas/projects/components/finance/subcontracts/SubcontractClaimForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

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
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);
	if (!activeOrganization) {
		return notFound();
	}
	return (
		<div>
			<Suspense>
				<SubcontractClaimForm
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					projectId={projectId}
					subcontractId={subcontractId}
				/>
			</Suspense>
		</div>
	);
}
