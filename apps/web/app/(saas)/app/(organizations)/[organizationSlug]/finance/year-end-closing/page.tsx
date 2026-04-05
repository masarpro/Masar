import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { YearEndClosingPage } from "@saas/finance/components/accounting/YearEndClosingPage";
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
		title: t("finance.yearEnd.title"),
	};
}

export default async function YearEndClosingRoutePage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<DashboardSkeleton />}>
			<YearEndClosingPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function YearEndClosingPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="year-end-closing"
		>
			<YearEndClosingPage
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
