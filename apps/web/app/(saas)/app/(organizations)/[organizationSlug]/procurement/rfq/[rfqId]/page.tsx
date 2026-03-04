import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { RFQDetail } from "@saas/procurement/components/rfq/RFQDetail";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.rfq") };
}

export default async function RFQDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; rfqId: string }>;
}) {
	const { organizationSlug, rfqId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const t = await getTranslations();

	return (
		<ProcurementShell organizationSlug={organizationSlug} sectionKey="rfq" pageTitle={t("procurement.rfq")}>
			<RFQDetail organizationId={activeOrganization.id} organizationSlug={organizationSlug} rfqId={rfqId} />
		</ProcurementShell>
	);
}
