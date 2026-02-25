import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EmployeeDetail } from "@saas/company/components/employees/EmployeeDetail";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.employees.details") };
}

export default async function EmployeeDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; employeeId: string }>;
}) {
	const { organizationSlug, employeeId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<EmployeeDetail
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			employeeId={employeeId}
		/>
	);
}
