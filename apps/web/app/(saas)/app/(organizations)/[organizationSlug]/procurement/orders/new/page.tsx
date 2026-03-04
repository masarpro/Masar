import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { POForm } from "@saas/procurement/components/purchase-orders/POForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.newOrder") };
}

export default async function NewPurchaseOrderPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const t = await getTranslations();

	return (
		<ProcurementShell organizationSlug={organizationSlug} sectionKey="orders" pageTitle={t("procurement.newOrder")}>
			<POForm organizationId={activeOrganization.id} organizationSlug={organizationSlug} />
		</ProcurementShell>
	);
}
