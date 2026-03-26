import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PaymentVoucherDetail } from "@saas/finance/components/vouchers/PaymentVoucherDetail";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("finance.paymentVouchers.paymentVoucher") };
}

export default async function PaymentVoucherDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; voucherId: string }>;
}) {
	const { organizationSlug, voucherId } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={6} cols={2} />}>
			<PaymentVoucherDetailContent
				organizationSlug={organizationSlug}
				voucherId={voucherId}
			/>
		</Suspense>
	);
}

async function PaymentVoucherDetailContent({
	organizationSlug,
	voucherId,
}: { organizationSlug: string; voucherId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<FinanceShell organizationSlug={organizationSlug} sectionKey="payment-vouchers">
			<PaymentVoucherDetail
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				voucherId={voucherId}
			/>
		</FinanceShell>
	);
}
