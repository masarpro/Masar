import { getActiveOrganization } from "@saas/auth/lib/server";
import { QuotationForm } from "@saas/pricing/components/quotations/QuotationForm";
import { PricingShell } from "@saas/pricing/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; quotationId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("pricing.quotations.edit"),
	};
}

export default async function EditQuotationPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; quotationId: string }>;
}) {
	const { organizationSlug, quotationId } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	const t = await getTranslations();

	return (
		<PricingShell
			organizationSlug={organizationSlug}
			sectionKey="quotations"
			pageTitle={t("pricing.quotations.edit")}
		>
			<QuotationForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				mode="edit"
				quotationId={quotationId}
			/>
		</PricingShell>
	);
}
