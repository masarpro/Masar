import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PaymentVouchersList } from "@saas/finance/components/vouchers/PaymentVouchersList";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("finance.paymentVouchers.title") };
}

export default async function PaymentVouchersPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={8} cols={7} />}>
			<PaymentVouchersPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function PaymentVouchersPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<FinanceShell organizationSlug={organizationSlug} sectionKey="payment-vouchers">
			<PaymentVouchersList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
