import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EmployeeList } from "@saas/company/components/employees/EmployeeList";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.employees.title") };
}

export default async function EmployeesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<EmployeeList
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
