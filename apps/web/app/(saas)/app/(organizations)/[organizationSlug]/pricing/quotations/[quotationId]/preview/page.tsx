import { getActiveOrganization } from "@saas/auth/lib/server";
import { QuotationPreview } from "@saas/pricing/components/quotations/QuotationPreview";
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
		title: t("pricing.quotations.preview"),
	};
}

export default async function QuotationPreviewPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; quotationId: string }>;
}) {
	const { organizationSlug, quotationId } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<PricingShell
			organizationSlug={organizationSlug}
			sectionKey="quotations"
			pageTitle={t("pricing.quotations.preview")}
		>
			<QuotationPreview
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				quotationId={quotationId}
			/>
		</PricingShell>
	);
}
