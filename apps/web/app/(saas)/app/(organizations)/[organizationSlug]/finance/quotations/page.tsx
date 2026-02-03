import { getActiveOrganization } from "@saas/auth/lib/server";
import { QuotationsList } from "@saas/finance/components/quotations/QuotationsList";
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
		title: t("finance.quotations.title"),
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
		<FinanceShell organizationSlug={organizationSlug}>
			<QuotationsList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
