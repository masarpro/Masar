import { getActiveOrganization } from "@saas/auth/lib/server";
import { PaymentsList } from "@saas/finance/components/payments/PaymentsList";
import { PaymentsHeaderActions } from "@saas/finance/components/payments/PaymentsHeaderActions";
import { FinanceShell } from "@saas/finance/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.payments.title"),
	};
}

export default async function PaymentsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="payments"
			headerActions={<PaymentsHeaderActions organizationSlug={organizationSlug} />}
		>
			<PaymentsList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
