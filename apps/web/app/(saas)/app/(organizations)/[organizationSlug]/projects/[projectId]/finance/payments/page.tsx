import { getActiveOrganization } from "@saas/auth/lib/server";
import { PaymentsList } from "@saas/finance/components/payments/PaymentsList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("finance.payments.title"),
	};
}

export default async function ProjectPaymentsPage({
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

	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/payments`;

	return (
		<div>
			<PaymentsList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
				basePath={basePath}
			/>
		</div>
	);
}
