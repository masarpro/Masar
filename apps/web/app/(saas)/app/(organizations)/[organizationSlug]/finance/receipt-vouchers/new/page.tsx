import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ReceiptVoucherForm } from "@saas/finance/components/vouchers/ReceiptVoucherForm";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("finance.receiptVouchers.new"),
	};
}

export default async function NewReceiptVoucherPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<ListTableSkeleton rows={6} cols={2} />}>
			<NewReceiptVoucherContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function NewReceiptVoucherContent({
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
			<ReceiptVoucherForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
