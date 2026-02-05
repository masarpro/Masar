import { getActiveOrganization } from "@saas/auth/lib/server";
import { FinanceShell } from "@saas/finance/components/shell";
import { OrganizationFinanceSettings } from "@saas/finance/components/settings/OrganizationFinanceSettings";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.settings.title"),
	};
}

export default async function FinanceSettingsPage({
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
			sectionKey="settings"
		>
			<OrganizationFinanceSettings
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
