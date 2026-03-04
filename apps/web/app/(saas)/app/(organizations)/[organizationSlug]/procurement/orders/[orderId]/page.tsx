import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { PODetail } from "@saas/procurement/components/purchase-orders/PODetail";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.order") };
}

export default async function PurchaseOrderDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; orderId: string }>;
}) {
	const { organizationSlug, orderId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const t = await getTranslations();

	return (
		<ProcurementShell organizationSlug={organizationSlug} sectionKey="orders" pageTitle={t("procurement.order")}>
			<PODetail organizationId={activeOrganization.id} organizationSlug={organizationSlug} orderId={orderId} />
		</ProcurementShell>
	);
}
