import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PartnersTabsClient } from "@saas/finance/components/partners/PartnersTabsClient";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("finance.partners.title") };
}

export default async function PartnersPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={6} cols={6} />}>
			<PartnersPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function PartnersPageContent({
	organizationSlug,
}: {
	organizationSlug: string;
}) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<FinanceShell organizationSlug={organizationSlug} sectionKey="partners">
			<Suspense fallback={<ListTableSkeleton rows={6} cols={6} />}>
				<PartnersTabsClient
					organizationId={activeOrganization.id}
					organizationSlug={organizationSlug}
				/>
			</Suspense>
		</FinanceShell>
	);
}
