import { Suspense } from "react";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProjectTemplates } from "@saas/projects/components/ProjectTemplates";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CardGridSkeleton } from "@saas/shared/components/skeletons";

export async function generateMetadata() {
	const t = await getTranslations();
	return {
		title: t("projects.templates.title"),
	};
}

export default async function ProjectTemplatesPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;

	return (
		<Suspense fallback={<CardGridSkeleton />}>
			<ProjectTemplatesPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function ProjectTemplatesPageContent({
	organizationSlug,
}: {
	organizationSlug: string;
}) {
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<ProjectTemplates
			organizationId={activeOrganization.id}
			organizationSlug={organizationSlug}
		/>
	);
}
