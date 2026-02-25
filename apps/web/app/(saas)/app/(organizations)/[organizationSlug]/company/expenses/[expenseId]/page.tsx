import { getActiveOrganization } from "@saas/auth/lib/server";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ExpenseDetail } from "@saas/company/components/expenses/ExpenseDetail";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("company.expenses.details") };
}

export default async function ExpenseDetailPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; expenseId: string }>;
}) {
	const { organizationSlug, expenseId } = await params;
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) return notFound();

	return (
		<ExpenseDetail
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			expenseId={expenseId}
		/>
	);
}
