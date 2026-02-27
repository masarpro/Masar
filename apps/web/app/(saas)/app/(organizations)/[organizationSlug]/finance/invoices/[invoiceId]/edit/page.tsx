import { getActiveOrganization } from "@saas/auth/lib/server";
import { CreateInvoiceForm } from "@saas/finance/components/invoices/CreateInvoiceForm";
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

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell organizationSlug={organizationSlug}>
			<CreateInvoiceForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				invoiceId={invoiceId}
			/>
		</FinanceShell>
	);
}
