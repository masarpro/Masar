import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EmployeeForm } from "@saas/company/components/employees/EmployeeForm";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.employees.addEmployee") };
}

export default async function NewEmployeePage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	return (
		<Suspense fallback={<FormPageSkeleton />}>
			<NewEmployeePageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function NewEmployeePageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<EmployeeForm
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
