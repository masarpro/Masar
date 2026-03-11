import { getActiveOrganization } from "@saas/auth/lib/server";
import { PricingShell } from "@saas/pricing/components/shell";
import { QuickPricingStandalone } from "@saas/pricing/components/pricing-v2/QuickPricingStandalone";
import { notFound } from "next/navigation";

export const metadata = {
	title: "التسعير السريع",
};

export default async function QuickPricingPage({
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
		<PricingShell
			organizationSlug={organizationSlug}
			sectionKey="studies"
		>
			<QuickPricingStandalone
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</PricingShell>
	);
}
