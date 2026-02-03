import { getActiveOrganization } from "@saas/auth/lib/server";
import { TemplatePreview } from "@saas/finance/components/templates/TemplatePreview";
import { FinanceShell } from "@saas/finance/components/shell";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string; templateId: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("finance.templates.editor.preview"),
	};
}

export default async function TemplatePreviewPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; templateId: string }>;
}) {
	const { organizationSlug, templateId } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<FinanceShell
			organizationSlug={organizationSlug}
			title={t("finance.templates.editor.preview")}
			hideNavigation
		>
			<TemplatePreview
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				templateId={templateId}
			/>
		</FinanceShell>
	);
}
