import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EmployeeForm } from "@saas/company/components/employees/EmployeeForm";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.employees.editEmployee") };
}

export default async function EditEmployeePage({
	params,
}: {
	params: Promise<{ organizationSlug: string; employeeId: string }>;
}) {
	const { organizationSlug, employeeId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<EmployeeForm
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			employeeId={employeeId}
		/>
	);
}
