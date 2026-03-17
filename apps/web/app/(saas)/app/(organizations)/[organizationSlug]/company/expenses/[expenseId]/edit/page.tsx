import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ExpenseForm } from "@saas/company/components/expenses/ExpenseForm";
import { FormPageSkeleton } from "@saas/shared/components/skeletons";

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
	return (
		<Suspense fallback={<FormPageSkeleton />}>
			<EditExpensePageContent
				organizationSlug={organizationSlug}
				expenseId={expenseId}
			/>
		</Suspense>
	);
}

async function EditExpensePageContent({
	organizationSlug,
	expenseId,
}: { organizationSlug: string; expenseId: string }) {
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
