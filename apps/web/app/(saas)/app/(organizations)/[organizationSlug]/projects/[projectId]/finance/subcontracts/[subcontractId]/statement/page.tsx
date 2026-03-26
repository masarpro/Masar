import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { SubcontractStatementView } from "@saas/finance/components/statements/SubcontractStatementView";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("accountStatement.subcontractStatement") };
}

export default async function SubcontractStatementPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string; subcontractId: string }>;
}) {
	const { organizationSlug, projectId, subcontractId } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={10} cols={6} />}>
			<SubcontractStatementContent
				organizationSlug={organizationSlug}
				projectId={projectId}
				contractId={subcontractId}
			/>
		</Suspense>
	);
}

async function SubcontractStatementContent({
	organizationSlug,
	projectId,
	contractId,
}: { organizationSlug: string; projectId: string; contractId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<SubcontractStatementView
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			projectId={projectId}
			contractId={contractId}
		/>
	);
}
