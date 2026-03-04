import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { PRForm } from "@saas/procurement/components/purchase-requests/PRForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.newRequest") };
}

export default async function NewPurchaseRequestPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const t = await getTranslations();

	return (
		<ProcurementShell organizationSlug={organizationSlug} sectionKey="requests" pageTitle={t("procurement.newRequest")}>
			<PRForm organizationId={activeOrganization.id} organizationSlug={organizationSlug} />
		</ProcurementShell>
	);
}
