import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ClientForm } from "@saas/finance/components/clients/ClientForm";
import { FinanceShell } from "@saas/finance/components/shell";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; clientId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.clients.editClient"),
	};
}

export default async function EditClientPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; clientId: string }>;
}) {
	const { organizationSlug, clientId } = await params;

	return (
		<Suspense fallback={<FormPageSkeleton />}>
			<EditClientContent
				organizationSlug={organizationSlug}
				clientId={clientId}
			/>
		</Suspense>
	);
}

async function EditClientContent({
	organizationSlug,
	clientId,
}: { organizationSlug: string; clientId: string }) {
	const t = await getTranslations();
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="clients"
			pageTitle={t("finance.clients.editClient")}
		>
			<ClientForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				clientId={clientId}
				mode="edit"
			/>
		</FinanceShell>
	);
}
