import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { IncomeStatementReport } from "@saas/finance/components/accounting-reports/IncomeStatementReport";
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
		title: t("finance.accountingReports.incomeStatement"),
	};
}

export default async function IncomeStatementPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<IncomeStatementPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function IncomeStatementPageContent({
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
			<IncomeStatementReport
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
