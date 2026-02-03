import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProjectsList } from "@saas/projects/components/ProjectsList";
import { PageHeader } from "@saas/shared/components/PageHeader";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const t = await getTranslations();

	return {
		title: t("projects.title"),
	};
}

export default async function ProjectsPage({
	params,
}: {
	params: Promise<{ organizationSlug: string }>;
}) {
	const { organizationSlug } = await params;
	const t = await getTranslations();

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<PageHeader
				title={t("projects.title")}
				subtitle={t("projects.subtitle")}
			/>
			<ProjectsList organizationId={activeOrganization.id} />
		</div>
	);
}
