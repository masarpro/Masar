import { getActiveOrganization } from "@saas/auth/lib/server";
import { QuotationPreview } from "@saas/finance/components/quotations/QuotationPreview";
import { FinanceShell } from "@saas/finance/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; quotationId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.quotations.preview"),
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
		<FinanceShell
			organizationSlug={organizationSlug}
			title={t("finance.quotations.preview")}
			hideNavigation
		>
			<QuotationPreview
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				quotationId={quotationId}
			/>
		</FinanceShell>
	);
}
