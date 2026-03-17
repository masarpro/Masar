import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { notFound } from "next/navigation";
import { Skeleton } from "@ui/components/skeleton";
import dynamic from "next/dynamic";
const TemplateCustomizer = dynamic(
	() =>
		import("@saas/company/components/templates/TemplateCustomizer").then((m) => ({
			default: m.TemplateCustomizer,
		})),
	{ loading: () => <Skeleton className="h-96 w-full" /> },
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

	return (
		<Suspense fallback={null}>
			<SettingsEditTemplatePageContent
				organizationSlug={organizationSlug}
				templateId={templateId}
			/>
		</Suspense>
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
