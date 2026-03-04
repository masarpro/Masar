import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { EditVendorWrapper } from "@saas/procurement/components/vendors/EditVendorWrapper";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.editVendor") };
}

export default async function EditVendorPage({
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
			pageTitle={await getTranslations().then((t) => t("procurement.editVendor"))}
		>
			<EditVendorWrapper
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				vendorId={vendorId}
			/>
		</ProcurementShell>
	);
}
