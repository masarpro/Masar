import { getActiveOrganization } from "@saas/auth/lib/server";
import { QuotationsList } from "@saas/pricing/components/quotations/QuotationsList";
import { QuotationsHeaderActions } from "@saas/pricing/components/quotations/QuotationsHeaderActions";
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
		title: t("pricing.quotations.title"),
	};
}

export default async function QuotationsPage({
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
			sectionKey="quotations"
			headerActions={<QuotationsHeaderActions organizationSlug={organizationSlug} />}
		>
			<QuotationsList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</PricingShell>
	);
}
