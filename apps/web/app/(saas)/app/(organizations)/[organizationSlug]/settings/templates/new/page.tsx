import { getActiveOrganization } from "@saas/auth/lib/server";
import { TemplateCustomizer } from "@saas/company/components/templates/TemplateCustomizer";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("finance.templates.create"),
	};
}

export default async function SettingsCreateTemplatePage({
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
		<TemplateCustomizer
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
