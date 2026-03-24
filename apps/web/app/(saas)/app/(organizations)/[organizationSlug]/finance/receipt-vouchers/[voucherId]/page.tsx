import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ReceiptVoucherDetail } from "@saas/finance/components/vouchers/ReceiptVoucherDetail";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("finance.receiptVouchers.receiptVoucher"),
	};
}

export default async function ReceiptVoucherDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; voucherId: string }>;
}) {
	const { organizationSlug, voucherId } = await params;

	return (
		<Suspense fallback={<ListTableSkeleton rows={6} cols={2} />}>
			<ReceiptVoucherDetailContent
				organizationSlug={organizationSlug}
				voucherId={voucherId}
			/>
		</Suspense>
	);
}

async function ReceiptVoucherDetailContent({
	organizationSlug,
	voucherId,
}: { organizationSlug: string; voucherId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="receipt-vouchers"
		>
			<ReceiptVoucherDetail
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				voucherId={voucherId}
			/>
		</FinanceShell>
	);
}
