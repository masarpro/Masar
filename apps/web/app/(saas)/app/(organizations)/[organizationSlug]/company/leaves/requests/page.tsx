import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { LeaveRequestList } from "@saas/company/components/leaves/LeaveRequestList";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.leaves.requests.title") };
}

export default async function LeaveRequestsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<LeaveRequestList
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
