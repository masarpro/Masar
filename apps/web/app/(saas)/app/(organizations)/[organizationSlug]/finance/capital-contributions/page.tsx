import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { CapitalContributionsList } from "@saas/finance/components/capital-contributions";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("finance.capitalContributions.title") };
}

export default async function CapitalContributionsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={8} cols={5} />}>
			<CapitalContributionsPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function CapitalContributionsPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<FinanceShell organizationSlug={organizationSlug} sectionKey="capital-contributions">
			<CapitalContributionsList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
