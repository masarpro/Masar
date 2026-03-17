import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { TemplatesList } from "@saas/company/components/templates/TemplatesList";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("finance.templates.title"),
	};
}

export default async function SettingsTemplatesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={null}>
			<SettingsTemplatesPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function SettingsTemplatesPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
	const activeOrganization = await getActiveOrganization(organizationSlug);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<TemplatesList
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
