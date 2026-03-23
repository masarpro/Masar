import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { AccountingReportsLanding } from "@saas/finance/components/accounting-reports/AccountingReportsLanding";
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
		title: t("finance.accountingReports.title"),
	};
}

export default async function AccountingReportsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<AccountingReportsPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function AccountingReportsPageContent({
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
			<AccountingReportsLanding
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
