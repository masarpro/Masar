import { getActiveOrganization } from "@saas/auth/lib/server";
import { ExpenseForm } from "@saas/finance/components/expenses/ExpenseForm";
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
		title: t("finance.expenses.create"),
	};
}

export default async function NewExpensePage({
	params,
	searchParams,
}: {
	params: Promise<{ organizationSlug: string }>;
	searchParams: Promise<{ sourceAccountId?: string; projectId?: string }>;
}) {
	const { organizationSlug } = await params;
	const { sourceAccountId, projectId } = await searchParams;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			title={t("finance.expenses.create")}
			subtitle={t("finance.expenses.createSubtitle")}
		>
			<ExpenseForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				defaultSourceAccountId={sourceAccountId}
				defaultProjectId={projectId}
			/>
		</FinanceShell>
	);
}
