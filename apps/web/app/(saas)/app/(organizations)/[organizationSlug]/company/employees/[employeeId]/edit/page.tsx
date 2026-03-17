import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EmployeeForm } from "@saas/company/components/employees/EmployeeForm";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";

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
	return (
		<Suspense fallback={<FormPageSkeleton />}>
			<EditEmployeePageContent
				organizationSlug={organizationSlug}
				employeeId={employeeId}
			/>
		</Suspense>
	);
}

async function EditEmployeePageContent({
	organizationSlug,
	employeeId,
}: { organizationSlug: string; employeeId: string }) {
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
