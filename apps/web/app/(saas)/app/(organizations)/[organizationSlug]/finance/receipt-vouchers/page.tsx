import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ReceiptVouchersList } from "@saas/finance/components/vouchers/ReceiptVouchersList";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("finance.receiptVouchers.title"),
	};
}

export default async function ReceiptVouchersPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<ListTableSkeleton rows={8} cols={6} />}>
			<ReceiptVouchersPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function ReceiptVouchersPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="receipt-vouchers"
		>
			<ReceiptVouchersList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
