import { getActiveOrganization } from "@saas/auth/lib/server";
import { notFound } from "next/navigation";
import { EditorPageSkeleton } from "@saas/shared/components/skeletons";
import dynamic from "next/dynamic";
const TemplateCustomizer = dynamic(
	() =>
		import("@saas/company/components/templates/TemplateCustomizer").then((m) => ({
			default: m.TemplateCustomizer,
		})),
	{ loading: () => <EditorPageSkeleton /> },
);
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("finance.templates.edit"),
	};
}

export default async function SettingsEditTemplatePage({
	params,
}: {
	params: Promise<{ organizationSlug: string; templateId: string }>;
}) {
	const { organizationSlug, templateId } = await params;

	// No inner Suspense: the route loading.tsx skeleton covers the await.
	return (
		<SettingsEditTemplatePageContent
			organizationSlug={organizationSlug}
			templateId={templateId}
		/>
	);
}

async function SettingsEditTemplatePageContent({
	organizationSlug,
	templateId,
}: { organizationSlug: string; templateId: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<TemplateCustomizer
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
			templateId={templateId}
		/>
	);
}
