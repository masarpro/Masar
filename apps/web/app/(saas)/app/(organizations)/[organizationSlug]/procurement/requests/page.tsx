import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { PRList } from "@saas/procurement/components/purchase-requests/PRList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.requests") };
}

export default async function PurchaseRequestsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<ProcurementShell organizationSlug={organizationSlug} sectionKey="requests">
			<PRList organizationId={activeOrganization.id} organizationSlug={organizationSlug} />
		</ProcurementShell>
	);
}
