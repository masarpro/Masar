import { getActiveOrganization } from "@saas/auth/lib/server";
import { InvoiceEditor } from "@saas/finance/components/invoices/InvoiceEditor";
import { FinanceShell } from "@saas/finance/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; invoiceId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.invoices.edit"),
	};
}

export default async function EditInvoicePage({
	params,
}: {
	params: Promise<{ organizationSlug: string; invoiceId: string }>;
}) {
	const { organizationSlug, invoiceId } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="invoices"
			pageTitle={t("finance.invoices.edit")}
		>
			<InvoiceEditor
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				invoiceId={invoiceId}
			/>
		</FinanceShell>
	);
}
