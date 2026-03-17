import { getActiveOrganization } from "@saas/auth/lib/server";
import { ProjectOverviewSkeleton } from "@saas/shared/components/skeletons";
import { Skeleton } from "@ui/components/skeleton";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

const ProjectOverview = dynamic(
	() =>
		import("@saas/projects/components/ProjectOverview").then((m) => ({
			default: m.ProjectOverview,
		})),
	{
		loading: () => (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-9 w-32 rounded-lg" />
				</div>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="rounded-xl border border-border p-5 space-y-3">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-8 w-28" />
						</div>
					))}
				</div>
				<Skeleton className="h-48 w-full rounded-xl" />
			</div>
		),
	},
);

export async function generateMetadata() {
	const t = await getTranslations();

	return {
		title: t("projects.projectDetails"),
	};
}

export default async function ProjectPage({
	params,
}: {
	params: Promise<{ organizationSlug: string; projectId: string }>;
}) {
	const { organizationSlug, projectId } = await params;

	return (
		<Suspense fallback={<ProjectOverviewSkeleton />}>
			<ProjectPageContent
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</Suspense>
	);
}

async function ProjectPageContent({
	organizationSlug,
	projectId,
}: { organizationSlug: string; projectId: string }) {
	const activeOrganization = await getActiveOrganization(
		organizationSlug as string,
	);

	if (!activeOrganization) {
		return notFound();
	}

	return (
		<div>
			<ProjectOverview
				organizationId={activeOrganization.id}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</div>
	);
}
