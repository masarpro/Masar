import { getActiveOrganization } from "@saas/auth/lib/server";
import { ExpensesList } from "@saas/finance/components/expenses/ExpensesList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("finance.expenses.title"),
	};
}

export default async function ProjectExpensesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/expenses`;

	return (
		<div>
			<ExpensesList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
				basePath={basePath}
			/>
		</div>
	);
}
