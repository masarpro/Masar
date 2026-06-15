import { getActiveOrganization } from "@saas/auth/lib/server";
import { ExpenseCategoriesManager } from "@saas/settings/components/expense-categories/ExpenseCategoriesManager";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();
	return { title: t("settings.expenseCategories.title") };
}

export default async function ExpenseCategoriesSettingsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) return notFound();

	return <ExpenseCategoriesManager organizationId={organization.id} />;
}
