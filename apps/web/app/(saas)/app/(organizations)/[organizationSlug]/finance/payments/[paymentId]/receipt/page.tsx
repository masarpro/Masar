import { getActiveOrganization } from "@saas/auth/lib/server";
import { ReceiptVoucher } from "@saas/finance/components/payments/ReceiptVoucher";
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
		title: t("finance.receipt.title"),
	};
}

export default async function ReceiptPage({
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
			title={t("finance.receipt.title")}
			hideNavigation
		>
			<ReceiptVoucher
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				paymentId={paymentId}
			/>
		</FinanceShell>
	);
}
