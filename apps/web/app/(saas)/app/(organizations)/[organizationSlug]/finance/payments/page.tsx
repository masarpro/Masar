import { getActiveOrganization } from "@saas/auth/lib/server";
import { PaymentsList } from "@saas/finance/components/payments/PaymentsList";
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
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			title={t("finance.payments.title")}
			subtitle={t("finance.payments.description")}
		>
			<PaymentsList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
