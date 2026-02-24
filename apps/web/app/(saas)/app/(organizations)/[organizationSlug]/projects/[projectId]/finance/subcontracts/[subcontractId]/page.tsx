import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { SubcontractDetailView } from "@saas/projects/components/finance/subcontracts/SubcontractDetailView";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

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

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<Suspense>
				<SubcontractDetailView
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					projectId={projectId}
					subcontractId={subcontractId}
				/>
			</Suspense>
		</div>
	);
}
