import { getActiveOrganization } from "@saas/auth/lib/server";
import { TemplatesList } from "@saas/company/components/templates/TemplatesList";
import { TemplatesHeaderActions } from "@saas/company/components/templates/TemplatesHeaderActions";
import { CompanyShell } from "@saas/company/components/shell";
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
		<CompanyShell
			organizationSlug={organizationSlug}
			headerActions={<TemplatesHeaderActions organizationSlug={organizationSlug} />}
		>
			<TemplatesList
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
			/>
		</CompanyShell>
	);
}
