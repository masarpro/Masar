import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { POList } from "@saas/procurement/components/purchase-orders/POList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.orders") };
}

export default async function PurchaseOrdersPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<ProcurementShell organizationSlug={organizationSlug} sectionKey="orders">
			<POList organizationId={activeOrganization.id} organizationSlug={organizationSlug} />
		</ProcurementShell>
	);
}
