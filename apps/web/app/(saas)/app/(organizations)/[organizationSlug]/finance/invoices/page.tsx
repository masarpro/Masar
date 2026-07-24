import { getActiveOrganization } from "@saas/auth/lib/server";
import { InvoicesList } from "@saas/finance/components/invoices/InvoicesList";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { orpcServer } from "@shared/lib/orpc-server";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

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

	return (
		<Suspense fallback={<ListTableSkeleton rows={8} cols={5} />}>
			<InvoicesPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function InvoicesPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	const organizationId = activeOrganization.id;

	// Server-prefetch the default first page + the drafts badge with the SAME
	// inputs InvoicesList uses on mount (all filters off, page 1). JSON key
	// hashing drops undefined fields, so this hydrates the client query and the
	// table paints with rows instead of a second skeleton.
	const queryClient = getServerQueryClient();
	await Promise.all([
		queryClient.prefetchQuery(
			orpcServer.finance.invoices.list.queryOptions({
				input: { organizationId, limit: 20, offset: 0 },
			}),
		),
		queryClient.prefetchQuery(
			orpcServer.finance.invoices.drafts.count.queryOptions({
				input: { organizationId },
			}),
		),
	]);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<FinanceShell organizationSlug={organizationSlug}>
				<InvoicesList
					organizationId={organizationId}
					organizationSlug={organizationSlug}
				/>
			</FinanceShell>
		</HydrationBoundary>
	);
}
