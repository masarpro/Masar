import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { AgedReceivablesReport } from "@saas/finance/components/accounting-reports/AgedReceivablesReport";
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
		title: t("finance.accountingReports.agedReceivables"),
	};
}

export default async function AgedReceivablesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<AgedReceivablesPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function AgedReceivablesPageContent({
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
			<AgedReceivablesReport
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
