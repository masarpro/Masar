import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { HRManagementPage } from "@saas/company/components/hr/HRManagementPage";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.hr.title") };
}

export default async function HRPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<HRManagementPage
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
