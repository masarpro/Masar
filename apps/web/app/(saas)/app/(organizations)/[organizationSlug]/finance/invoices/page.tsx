import { getActiveOrganization } from "@saas/auth/lib/server";
import { InvoicesList } from "@saas/finance/components/invoices/InvoicesList";
import { InvoicesHeaderActions } from "@saas/finance/components/invoices/InvoicesHeaderActions";
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
		title: t("finance.invoices.title"),
	};
}

export default async function InvoicesPage({
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
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="invoices"
			headerActions={<InvoicesHeaderActions organizationSlug={organizationSlug} />}
		>
			<InvoicesList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
