import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { AgedPayablesReport } from "@saas/finance/components/accounting-reports/AgedPayablesReport";
import { FinanceShell } from "@saas/finance/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.accountingReports.agedPayables"),
	};
}

export default async function AgedPayablesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<AgedPayablesPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function AgedPayablesPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="accounting-reports"
		>
			<AgedPayablesReport
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
