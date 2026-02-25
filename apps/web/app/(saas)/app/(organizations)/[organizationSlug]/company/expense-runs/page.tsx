import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ExpenseRunList } from "@saas/company/components/expense-runs/ExpenseRunList";

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
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<ExpenseRunList
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
