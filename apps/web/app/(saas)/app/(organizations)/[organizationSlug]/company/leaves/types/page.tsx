import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { LeaveTypeList } from "@saas/company/components/leaves/LeaveTypeList";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.leaves.types.title") };
}

export default async function LeaveTypesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<LeaveTypeList
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
