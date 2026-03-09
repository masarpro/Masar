import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { LeaveDashboard } from "@saas/company/components/leaves/LeaveDashboard";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.leaves.title") };
}

export default async function LeavesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<LeaveDashboard
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
