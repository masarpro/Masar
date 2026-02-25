import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { CompanyReports } from "@saas/company/components/reports/CompanyReports";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.reports.title") };
}

export default async function ReportsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return <CompanyReports organizationId={activeOrganization.id} />;
}
