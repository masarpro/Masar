import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { PartnersComparisonReport } from "@saas/finance/components/partners/PartnersComparisonReport";
import { FinanceShell } from "@saas/finance/components/shell";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("finance.partners.reports.title") };
}

export default async function PartnerReportsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton rows={6} cols={5} />}>
			<PartnerReportsContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function PartnerReportsContent({
	organizationSlug,
}: {
	organizationSlug: string;
}) {
	const activeOrganization = await getActiveOrganization(organizationSlug);
	if (!activeOrganization) return notFound();

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="partners"
		>
			<PartnersComparisonReport
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
