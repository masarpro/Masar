import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { PageContextProvider } from "@saas/ai/components/PageContextProvider";
import { ProjectsList } from "@saas/projects/components/ProjectsList";
import { notFound, redirect } from "next/navigation";
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
	const session = await getSession();

	if (!session?.user) {
		redirect("/auth/login");
	}

	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<PageContextProvider
			moduleId="projects"
			pageName="Projects List"
			pageNameAr="قائمة المشاريع"
			pageDescription="عرض جميع المشاريع في المنظمة مع حالتها"
			visibleStats={{}}
		>
			<div className="px-4 py-6 sm:px-6">
				<ProjectsList
					organizationId={activeOrganization.id}
					userName={session.user.name ?? undefined}
				/>
			</div>
		</PageContextProvider>
	);
}
