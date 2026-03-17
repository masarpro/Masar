import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EmployeeDetail } from "@saas/company/components/employees/EmployeeDetail";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";

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
	return (
		<Suspense fallback={<DetailPageSkeleton />}>
			<EmployeeDetailPageContent
				organizationSlug={organizationSlug}
				employeeId={employeeId}
			/>
		</Suspense>
	);
}

async function EmployeeDetailPageContent({
	organizationSlug,
	employeeId,
}: { organizationSlug: string; employeeId: string }) {
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
