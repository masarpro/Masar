import { getActiveOrganization } from "@saas/auth/lib/server";
import { QuotationForm } from "@saas/finance/components/quotations/QuotationForm";
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
		title: t("finance.quotations.edit"),
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
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="quotations"
			pageTitle={t("finance.quotations.edit")}
		>
			<QuotationForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				mode="edit"
				quotationId={quotationId}
			/>
		</FinanceShell>
	);
}
