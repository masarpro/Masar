import { getActiveOrganization } from "@saas/auth/lib/server";
import { ExpensesList } from "@saas/finance/components/expenses/ExpensesList";
import { ExpensesHeaderActions } from "@saas/finance/components/expenses/ExpensesHeaderActions";
import { FinanceShell } from "@saas/finance/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.expenses.title"),
	};
}

export default async function ExpensesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			sectionKey="expenses"
			headerActions={<ExpensesHeaderActions organizationSlug={organizationSlug} />}
		>
			<ExpensesList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
