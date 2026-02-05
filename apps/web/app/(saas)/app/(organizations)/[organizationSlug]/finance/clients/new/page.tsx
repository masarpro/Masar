import { getActiveOrganization } from "@saas/auth/lib/server";
import { ClientForm } from "@saas/finance/components/clients/ClientForm";
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
		title: t("finance.clients.addClient"),
	};
}

export default async function NewClientPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="clients"
			pageTitle={t("finance.clients.addClient")}
		>
			<ClientForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				mode="create"
			/>
		</FinanceShell>
	);
}
