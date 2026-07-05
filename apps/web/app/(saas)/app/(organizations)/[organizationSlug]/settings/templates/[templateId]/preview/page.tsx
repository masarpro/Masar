import { getActiveOrganization } from "@saas/auth/lib/server";
import { TemplatePreview } from "@saas/company/components/templates/TemplatePreview";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("finance.templates.editor.preview"),
	};
}

export default async function SettingsTemplatePreviewPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; templateId: string }>;
}) {
	const { organizationSlug, templateId } = await params;

	// No inner Suspense: the route loading.tsx skeleton covers the await.
	return (
		<SettingsTemplatePreviewPageContent
			organizationSlug={organizationSlug}
			templateId={templateId}
		/>
	);
}

async function SettingsTemplatePreviewPageContent({
	organizationSlug,
	templateId,
}: { organizationSlug: string; templateId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<TemplatePreview
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			templateId={templateId}
		/>
	);
}
