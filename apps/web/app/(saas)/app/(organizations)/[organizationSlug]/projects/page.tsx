import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { PageContextProvider } from "@saas/ai/components/PageContextProvider";
import { ProjectsList } from "@saas/projects/components/ProjectsList";
import { CardGridSkeleton } from "@saas/shared/components/skeletons";
import { orpcServer } from "@shared/lib/orpc-server";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

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

	return (
		<Suspense fallback={<CardGridSkeleton />}>
			<ProjectsPageContent organizationSlug={organizationSlug} />
		</Suspense>
	);
}

async function ProjectsPageContent({
	organizationSlug,
}: { organizationSlug: string }) {
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

	// Server-prefetch the initial (unfiltered) projects list so it renders with
	// data at first paint. Inputs MUST match ProjectsList's initial query (status
	// "all" → undefined, empty search → undefined) for the cache key to match.
	const queryClient = getServerQueryClient();
	await queryClient.prefetchQuery(
		orpcServer.projects.list.queryOptions({
			input: {
				organizationId: activeOrganization.id,
				status: undefined,
				query: undefined,
			},
		}),
	);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
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
		</HydrationBoundary>
	);
}
