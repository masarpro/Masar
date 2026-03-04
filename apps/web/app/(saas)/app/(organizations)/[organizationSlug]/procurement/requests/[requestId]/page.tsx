import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { PRDetail } from "@saas/procurement/components/purchase-requests/PRDetail";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.request") };
}

export default async function PurchaseRequestDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; requestId: string }>;
}) {
	const { organizationSlug, requestId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	const t = await getTranslations();

	return (
		<ProcurementShell organizationSlug={organizationSlug} sectionKey="requests" pageTitle={t("procurement.request")}>
			<PRDetail
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				requestId={requestId}
			/>
		</ProcurementShell>
	);
}
