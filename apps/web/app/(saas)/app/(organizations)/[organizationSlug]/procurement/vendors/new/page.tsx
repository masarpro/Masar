import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { VendorForm } from "@saas/procurement/components/vendors/VendorForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.addVendor") };
}

export default async function NewVendorPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<ProcurementShell
			organizationSlug={organizationSlug}
			sectionKey="vendors"
			pageTitle={await getTranslations().then((t) => t("procurement.addVendor"))}
		>
			<VendorForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</ProcurementShell>
	);
}
