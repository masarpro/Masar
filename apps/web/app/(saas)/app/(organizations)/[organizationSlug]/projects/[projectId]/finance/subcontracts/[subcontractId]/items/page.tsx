import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { SubcontractItemsView } from "@saas/projects/components/finance/subcontracts/SubcontractItemsView";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("subcontractItems.title"),
	};
}

export default async function SubcontractItemsPage({
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
				<SubcontractItemsView
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					projectId={projectId}
					subcontractId={subcontractId}
				/>
			</Suspense>
		</div>
	);
}
