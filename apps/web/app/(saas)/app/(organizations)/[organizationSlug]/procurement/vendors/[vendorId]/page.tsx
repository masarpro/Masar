import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { VendorDetail } from "@saas/procurement/components/vendors/VendorDetail";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.vendorDetails") };
}

export default async function VendorDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; vendorId: string }>;
}) {
	const { organizationSlug, vendorId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<ProcurementShell
			organizationSlug={organizationSlug}
			sectionKey="vendors"
			pageTitle={await getTranslations().then((t) => t("procurement.vendorDetails"))}
		>
			<VendorDetail
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				vendorId={vendorId}
			/>
		</ProcurementShell>
	);
}
