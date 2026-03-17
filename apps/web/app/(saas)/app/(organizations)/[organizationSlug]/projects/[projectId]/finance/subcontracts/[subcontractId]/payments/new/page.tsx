import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { SubcontractPaymentForm } from "@saas/projects/components/finance/subcontracts/SubcontractPaymentForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";

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

	return (
		<Suspense fallback={<FormPageSkeleton />}>
			<NewSubcontractPaymentPageContent
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
			/>
		</Suspense>
	);
}

async function NewSubcontractPaymentPageContent({
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

	const redirectPath = `/app/${organizationSlug}/projects/${projectId}/finance/subcontracts/${subcontractId}`;

	return (
		<div>
			<SubcontractPaymentForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
				subcontractId={subcontractId}
				redirectPath={redirectPath}
			/>
		</div>
	);
}
