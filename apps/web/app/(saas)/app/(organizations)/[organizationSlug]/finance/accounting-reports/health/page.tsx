import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { AccountingHealthPage } from "@saas/finance/components/accounting/AccountingHealthPage";
import { FinanceShell } from "@saas/finance/components/shell";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("finance.accounting.health.title"),
	};
}

export default async function HealthCheckPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<HealthCheckPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function HealthCheckPageContent({
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
			<AccountingHealthPage
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
