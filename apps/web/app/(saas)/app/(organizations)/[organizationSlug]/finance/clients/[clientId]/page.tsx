import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ClientDetail } from "@saas/finance/components/clients/ClientDetail";
import { FinanceShell } from "@saas/finance/components/shell";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; clientId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.clients.viewClient"),
	};
}

export default async function ClientDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; clientId: string }>;
}) {
	const { organizationSlug, clientId } = await params;

	return (
		<Suspense fallback={<DetailPageSkeleton />}>
			<ClientDetailContent
				organizationSlug={organizationSlug}
				clientId={clientId}
			/>
		</Suspense>
	);
}

async function ClientDetailContent({
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
			pageTitle={t("finance.clients.viewClient")}
		>
			<ClientDetail
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				clientId={clientId}
			/>
		</FinanceShell>
	);
}
