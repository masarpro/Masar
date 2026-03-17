import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { QuotationPreviewSwitch } from "@saas/pricing/components/quotation-builder/QuotationPreviewSwitch";
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

	return (
		<Suspense fallback={null}>
			<QuotationPreviewPageContent organizationSlug={organizationSlug} quotationId={quotationId} />
		</Suspense>
	);
}

async function QuotationPreviewPageContent({ organizationSlug, quotationId }: { organizationSlug: string; quotationId: string }) {
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
			<QuotationPreviewSwitch
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				quotationId={quotationId}
			/>
		</PricingShell>
	);
}
