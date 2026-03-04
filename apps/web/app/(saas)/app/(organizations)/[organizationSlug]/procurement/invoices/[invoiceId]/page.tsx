import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { VIDetail } from "@saas/procurement/components/vendor-invoices/VIDetail";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.invoice") };
}

export default async function VendorInvoiceDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; invoiceId: string }>;
}) {
	const { organizationSlug, invoiceId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const t = await getTranslations();

	return (
		<ProcurementShell organizationSlug={organizationSlug} sectionKey="invoices" pageTitle={t("procurement.invoice")}>
			<VIDetail organizationId={activeOrganization.id} organizationSlug={organizationSlug} invoiceId={invoiceId} />
		</ProcurementShell>
	);
}
