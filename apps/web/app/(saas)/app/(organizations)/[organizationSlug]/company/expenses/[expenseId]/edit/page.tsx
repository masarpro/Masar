import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ExpenseForm } from "@saas/company/components/expenses/ExpenseForm";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.expenses.editExpense") };
}

export default async function EditExpensePage({
	params,
}: {
	params: Promise<{ organizationSlug: string; expenseId: string }>;
}) {
	const { organizationSlug, expenseId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<ExpenseForm
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			expenseId={expenseId}
		/>
	);
}
