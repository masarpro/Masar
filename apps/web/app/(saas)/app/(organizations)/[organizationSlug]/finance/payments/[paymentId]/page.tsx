import { getActiveOrganization } from "@saas/auth/lib/server";
import { PaymentDetail } from "@saas/finance/components/payments/PaymentDetail";
import { FinanceShell } from "@saas/finance/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; paymentId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.payments.details"),
	};
}

export default async function PaymentDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; paymentId: string }>;
}) {
	const { organizationSlug, paymentId } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			title={t("finance.payments.details")}
			subtitle={t("finance.payments.detailsSubtitle")}
		>
			<PaymentDetail
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				paymentId={paymentId}
			/>
		</FinanceShell>
	);
}
