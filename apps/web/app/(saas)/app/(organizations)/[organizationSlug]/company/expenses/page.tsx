import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ExpenseList } from "@saas/company/components/expenses/ExpenseList";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.expenses.title") };
}

export default async function ExpensesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	return (
		<Suspense fallback={<ListTableSkeleton />}>
			<ExpensesPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function ExpensesPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<ExpenseList
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
