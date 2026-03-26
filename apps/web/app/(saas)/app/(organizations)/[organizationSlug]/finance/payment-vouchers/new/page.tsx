import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PaymentVoucherForm } from "@saas/finance/components/vouchers/PaymentVoucherForm";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("finance.paymentVouchers.new") };
}

export default async function NewPaymentVoucherPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={6} cols={2} />}>
			<NewPaymentVoucherContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function NewPaymentVoucherContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<FinanceShell organizationSlug={organizationSlug} sectionKey="payment-vouchers">
			<PaymentVoucherForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
