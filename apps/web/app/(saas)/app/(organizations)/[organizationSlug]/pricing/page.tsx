import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingDashboard } from "@saas/pricing/components/dashboard/PricingDashboard";
import { PricingShell } from "@saas/pricing/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("pricing.title"),
	};
}

export default async function PricingPage({
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
		<PricingShell organizationSlug={organizationSlug}>
			<PricingDashboard
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</PricingShell>
	);
}
