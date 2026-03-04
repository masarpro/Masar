import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProcurementShell } from "@saas/procurement/components/shell";
import { ProcurementDashboard } from "@saas/procurement/components/dashboard/ProcurementDashboard";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("procurement.title") };
}

export default async function ProcurementDashboardPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<ProcurementShell organizationSlug={organizationSlug}>
			<ProcurementDashboard
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</ProcurementShell>
	);
}
