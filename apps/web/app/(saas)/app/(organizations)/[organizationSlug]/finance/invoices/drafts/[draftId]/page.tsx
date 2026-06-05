import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { FinanceShell } from "@saas/finance/components/shell";
import { EditorPageSkeleton } from "@saas/shared/components/skeletons";
import { Skeleton } from "@ui/components/skeleton";
import dynamic from "next/dynamic";
const CreateInvoiceForm = dynamic(
	() =>
		import("@saas/finance/components/invoices/CreateInvoiceForm").then((m) => ({
			default: m.CreateInvoiceForm,
		})),
	{ loading: () => <Skeleton className="h-96 w-full" /> },
);
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("finance.invoices.edit") };
}

export default async function InvoiceDraftPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; draftId: string }>;
}) {
	const { organizationSlug, draftId } = await params;

	return (
		<Suspense fallback={<EditorPageSkeleton />}>
			<InvoiceDraftContent organizationSlug={organizationSlug} draftId={draftId} />
		</Suspense>
	);
}

async function InvoiceDraftContent({
	organizationSlug,
	draftId,
}: { organizationSlug: string; draftId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell organizationSlug={organizationSlug}>
			<CreateInvoiceForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				draftId={draftId}
			/>
		</FinanceShell>
	);
}
