import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { SubcontractForm } from "@saas/projects/components/finance/subcontracts/SubcontractForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("subcontracts.newContract"),
	};
}

export default async function NewSubcontractPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<FormPageSkeleton />}>
			<NewSubcontractPageContent organizationSlug={organizationSlug} projectId={projectId} />
		</Suspense>
	);
}

async function NewSubcontractPageContent({
	organizationSlug,
	projectId,
}: {
	organizationSlug: string;
	projectId: string;
}) {
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<SubcontractForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
