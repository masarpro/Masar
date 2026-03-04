import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { GRList } from "@saas/procurement/components/goods-receipts/GRList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.receipts") };
}

export default async function GoodsReceiptsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<ProcurementShell organizationSlug={organizationSlug} sectionKey="receipts">
			<GRList organizationId={activeOrganization.id} organizationSlug={organizationSlug} />
		</ProcurementShell>
	);
}
