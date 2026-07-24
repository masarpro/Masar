import { getProjectMemberRole } from "@repo/database";
import { getCachedUserPermissions } from "@repo/api/lib/permissions";
import { hasPermission } from "@repo/database/prisma/permissions";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import {
	canRoleViewSection,
	type ProjectRole,
} from "@saas/projects/lib/role-visibility";
import { ProjectOverviewSkeleton } from "@saas/shared/components/skeletons";
import { orpcServer } from "@shared/lib/orpc-server";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
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
		loading: () => <ProjectOverviewSkeleton />,
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
	const [activeOrganization, session] = await Promise.all([
		getActiveOrganization(organizationSlug),
		getSession(),
	]);

	if (!activeOrganization) {
		return notFound();
	}

	const organizationId = activeOrganization.id;

	// Server-prefetch the overview cards' queries (same keys/inputs as each
	// card's useQuery) so they paint with data on first load instead of five
	// separate client round-trips (~400ms each from Saudi to bom1).
	//
	// The finance pair is gated by the member's PROJECT role, mirroring the
	// [projectId] layout's role derivation + ProjectOverview's
	// canViewSection("finance") gate — same inputs, same result, so the client
	// `enabled` flag and the hydrated cache always agree.
	const queryClient = getServerQueryClient();

	const prefetches = [
		queryClient.prefetchQuery(
			orpcServer.projectTimeline.listMilestones.queryOptions({
				input: { organizationId, projectId },
			}),
		),
		queryClient.prefetchQuery(
			orpcServer.projectBoq.getSummary.queryOptions({
				input: { organizationId, projectId },
			}),
		),
		queryClient.prefetchQuery(
			orpcServer.projectField.getTimeline.queryOptions({
				input: { organizationId, projectId, limit: 3 },
			}),
		),
		queryClient.prefetchQuery(
			orpcServer.projectDocuments.list.queryOptions({
				input: { organizationId, projectId, pageSize: 2 },
			}),
		),
	];

	if (session?.user) {
		const [projectMemberRole, permissions] = await Promise.all([
			getProjectMemberRole(projectId, session.user.id),
			getCachedUserPermissions(session.user.id, organizationId),
		]);

		let userRole: ProjectRole = "VIEWER";
		if (projectMemberRole) {
			userRole = projectMemberRole as ProjectRole;
		} else if (hasPermission(permissions, "projects", "manageTeam")) {
			userRole = "MANAGER";
		}

		if (canRoleViewSection(userRole, "finance")) {
			prefetches.push(
				queryClient.prefetchQuery(
					orpcServer.projectFinance.getSummary.queryOptions({
						input: { organizationId, projectId },
					}),
				),
				queryClient.prefetchQuery(
					orpcServer.projectFinance.getExpensesByCategory.queryOptions({
						input: { organizationId, projectId },
					}),
				),
			);
		}
	}

	await Promise.all(prefetches);

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<div>
				<ProjectOverview
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					projectId={projectId}
				/>
			</div>
		</HydrationBoundary>
	);
}
