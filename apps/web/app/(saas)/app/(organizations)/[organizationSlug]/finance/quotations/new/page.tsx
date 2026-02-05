import { getActiveOrganization } from "@saas/auth/lib/server";
import { QuotationForm } from "@saas/finance/components/quotations/QuotationForm";
import { FinanceShell } from "@saas/finance/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.quotations.create"),
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
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="quotations"
			pageTitle={t("finance.quotations.create")}
		>
			<QuotationForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				mode="create"
			/>
		</FinanceShell>
	);
}
