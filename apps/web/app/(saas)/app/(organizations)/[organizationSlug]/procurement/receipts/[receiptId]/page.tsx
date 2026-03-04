import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.receipt") };
}

export default async function GoodsReceiptDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; receiptId: string }>;
}) {
	const { organizationSlug, receiptId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const t = await getTranslations();

	return (
		<ProcurementShell organizationSlug={organizationSlug} sectionKey="receipts" pageTitle={t("procurement.receipt")}>
			<div className="text-center py-12 text-muted-foreground">
				{/* GR Detail to be rendered here */}
				<p>Receipt ID: {receiptId}</p>
			</div>
		</ProcurementShell>
	);
}
