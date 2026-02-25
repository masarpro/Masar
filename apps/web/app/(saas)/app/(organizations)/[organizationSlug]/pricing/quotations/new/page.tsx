import { getActiveOrganization } from "@saas/auth/lib/server";
import { QuotationForm } from "@saas/pricing/components/quotations/QuotationForm";
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
		title: t("pricing.quotations.create"),
	};
}

export default async function CreateQuotationPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	const t = await getTranslations();

	return (
		<PricingShell
			organizationSlug={organizationSlug}
			sectionKey="quotations"
			pageTitle={t("pricing.quotations.create")}
		>
			<QuotationForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				mode="create"
			/>
		</PricingShell>
	);
}
