import { getActiveOrganization } from "@saas/auth/lib/server";
import { FinanceShell } from "@saas/finance/components/shell";
import { Skeleton } from "@ui/components/skeleton";
import dynamic from "next/dynamic";
const InvoiceView = dynamic(
	() =>
		import("@saas/finance/components/invoices/InvoiceView").then((m) => ({
			default: m.InvoiceView,
		})),
	{ loading: () => <Skeleton className="h-96 w-full" /> },
);
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; invoiceId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.invoices.view"),
	};
}

export default async function ViewInvoicePage({
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
			<InvoiceView
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				invoiceId={invoiceId}
			/>
		</FinanceShell>
	);
}
