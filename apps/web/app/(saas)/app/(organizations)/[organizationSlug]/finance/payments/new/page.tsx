import { getActiveOrganization } from "@saas/auth/lib/server";
import { PaymentForm } from "@saas/finance/components/payments/PaymentForm";
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
		title: t("finance.payments.create"),
	};
}

export default async function NewPaymentPage({
	params,
	searchParams,
}: {
	params: Promise<{ organizationSlug: string }>;
	searchParams: Promise<{ clientId?: string; projectId?: string; invoiceId?: string }>;
}) {
	const { organizationSlug } = await params;
	const { clientId, projectId, invoiceId } = await searchParams;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="payments"
			pageTitle={t("finance.payments.create")}
		>
			<PaymentForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				defaultClientId={clientId}
				defaultProjectId={projectId}
				defaultInvoiceId={invoiceId}
			/>
		</FinanceShell>
	);
}
