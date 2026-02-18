import { getActiveOrganization } from "@saas/auth/lib/server";
import { ExpenseForm } from "@saas/finance/components/expenses/ExpenseForm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("finance.expenses.new"),
	};
}

export default async function NewProjectExpensePage({
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

	const redirectPath = `/app/${organizationSlug}/projects/${projectId}/finance/expenses`;

	return (
		<div>
			<ExpenseForm
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				defaultProjectId={projectId}
				redirectPath={redirectPath}
			/>
		</div>
	);
}
