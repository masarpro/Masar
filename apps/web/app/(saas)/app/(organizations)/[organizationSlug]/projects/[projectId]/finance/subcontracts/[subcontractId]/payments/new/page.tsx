import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { SubcontractPaymentForm } from "@saas/projects/components/finance/subcontracts/SubcontractPaymentForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("subcontracts.newPayment"),
	};
}

export default async function NewSubcontractPaymentPage({
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

	const redirectPath = `/app/${organizationSlug}/projects/${projectId}/finance/subcontracts/${subcontractId}`;

	return (
		<div>
			<Suspense>
				<SubcontractPaymentForm
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					projectId={projectId}
					subcontractId={subcontractId}
					redirectPath={redirectPath}
				/>
			</Suspense>
		</div>
	);
}
