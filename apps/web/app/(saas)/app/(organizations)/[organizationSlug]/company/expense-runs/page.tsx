import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ExpenseRunList } from "@saas/company/components/expense-runs/ExpenseRunList";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.expenseRuns.title") };
}

export default async function ExpenseRunsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton />}>
			<ExpenseRunsPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function ExpenseRunsPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<ExpenseRunList
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
