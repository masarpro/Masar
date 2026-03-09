import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { LeaveBalanceList } from "@saas/company/components/leaves/LeaveBalanceList";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.leaves.balances.title") };
}

export default async function LeaveBalancesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<LeaveBalanceList
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
