import { getActiveOrganization } from "@saas/auth/lib/server";
import { FinanceShell } from "@saas/finance/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CreditNoteForm } from "./CreditNoteForm";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; invoiceId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.invoices.creditNote.title"),
	};
}

export default async function CreditNotePage({
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
			<CreditNoteForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				invoiceId={invoiceId}
			/>
		</FinanceShell>
	);
}
