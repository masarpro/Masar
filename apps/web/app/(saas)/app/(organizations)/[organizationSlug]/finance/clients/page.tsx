import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ClientsList } from "@saas/finance/components/clients/ClientsList";
import { FinanceShell } from "@saas/finance/components/shell";
import { ClientsHeaderActions } from "@saas/finance/components/clients/ClientsHeaderActions";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.clients.title"),
	};
}

export default async function ClientsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<ListTableSkeleton />}>
			<ClientsPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function ClientsPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="clients"
			headerActions={
				<ClientsHeaderActions
					organizationSlug={organizationSlug}
					organizationId={activeOrganization.id}
				/>
			}
		>
			<ClientsList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
