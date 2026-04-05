import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { CapitalContributionForm } from "@saas/finance/components/capital-contributions";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("finance.capitalContributions.new") };
}

export default async function NewCapitalContributionPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={6} cols={2} />}>
			<NewCapitalContributionContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function NewCapitalContributionContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<FinanceShell organizationSlug={organizationSlug} sectionKey="capital-contributions">
			<CapitalContributionForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
