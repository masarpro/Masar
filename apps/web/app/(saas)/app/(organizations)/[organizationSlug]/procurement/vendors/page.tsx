import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { VendorList } from "@saas/procurement/components/vendors/VendorList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.vendors") };
}

export default async function VendorsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<ProcurementShell organizationSlug={organizationSlug} sectionKey="vendors">
			<VendorList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</ProcurementShell>
	);
}
