import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { RFQList } from "@saas/procurement/components/rfq/RFQList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.rfqs") };
}

export default async function RFQsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<ProcurementShell organizationSlug={organizationSlug} sectionKey="rfq">
			<RFQList organizationId={activeOrganization.id} organizationSlug={organizationSlug} />
		</ProcurementShell>
	);
}
