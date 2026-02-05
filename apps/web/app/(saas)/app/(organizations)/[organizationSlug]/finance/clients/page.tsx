import { getActiveOrganization } from "@saas/auth/lib/server";
import { ClientsList } from "@saas/finance/components/clients/ClientsList";
import { FinanceShell } from "@saas/finance/components/shell";
import { ClientsHeaderActions } from "@saas/finance/components/clients/ClientsHeaderActions";
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
