import { getActiveOrganization } from "@saas/auth/lib/server";
import { TemplatesList } from "@saas/finance/components/templates/TemplatesList";
import { TemplatesHeaderActions } from "@saas/finance/components/templates/TemplatesHeaderActions";
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
		title: t("finance.templates.title"),
	};
}

export default async function TemplatesPage({
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
			sectionKey="templates"
			headerActions={<TemplatesHeaderActions organizationSlug={organizationSlug} />}
		>
			<TemplatesList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</FinanceShell>
	);
}
