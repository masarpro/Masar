import { getActiveOrganization } from "@saas/auth/lib/server";
import { PaymentForm } from "@saas/finance/components/payments/PaymentForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("finance.payments.new"),
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
			<PaymentForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				defaultProjectId={projectId}
				redirectPath={redirectPath}
			/>
		</div>
	);
}
