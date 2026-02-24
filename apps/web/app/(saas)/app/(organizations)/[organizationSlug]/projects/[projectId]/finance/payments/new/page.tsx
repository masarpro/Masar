import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProjectPaymentForm } from "@saas/projects/components/finance/ProjectPaymentForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projectPayments.newPayment"),
	};
}

export default async function NewProjectPaymentPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	const redirectPath = `/app/${organizationSlug}/projects/${projectId}/finance/payments`;

	return (
		<div>
			<Suspense>
				<ProjectPaymentForm
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
					projectId={projectId}
					redirectPath={redirectPath}
				/>
			</Suspense>
		</div>
	);
}
