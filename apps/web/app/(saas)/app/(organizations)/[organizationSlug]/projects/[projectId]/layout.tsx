import { getProjectById, getProjectMemberRole } from "@repo/database";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { ProjectShell } from "@saas/projects/components/shell";
import { notFound, redirect } from "next/navigation";
import type { PropsWithChildren } from "react";
import type { ProjectRole } from "@saas/projects/lib/role-visibility";

export default async function ProjectLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ organizationSlug: string; projectId: string }>;
}>) {
	// Run session and params resolution in parallel
	const [session, { organizationSlug, projectId }] = await Promise.all([
		getSession(),
		params,
	]);

	if (!session?.user) {
		redirect("/auth/login");
	}

	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		redirect("/app");
	}

	// Run project fetch and role check in parallel
	const [project, projectMemberRole] = await Promise.all([
		getProjectById(projectId, organization.id),
		getProjectMemberRole(projectId, session.user.id),
	]);

	if (!project) {
		return notFound();
	}

	// If user has no project-level role, check org-level role
	// Organization owners/admins get MANAGER access to all projects
	let userRole: ProjectRole = "VIEWER";
	if (projectMemberRole) {
		userRole = projectMemberRole as ProjectRole;
	} else {
		const orgMember = organization.members?.find(
			(m: { userId: string }) => m.userId === session.user.id,
		);
		if (orgMember && (orgMember.role === "owner" || orgMember.role === "admin")) {
			userRole = "MANAGER";
		}
	}

	// Transform project data for the shell
	const projectData = {
		id: project.id,
		name: project.name,
		status: project.status,
		progress: Number(project.progress),
		contractValue: project.contractValue ? Number(project.contractValue) : null,
		clientName: project.clientName,
		location: project.location,
		startDate: project.startDate,
		endDate: project.endDate,
	};

	const userName = session?.user?.name ?? "";

	return (
		<ProjectShell
			project={projectData}
			organizationSlug={organizationSlug}
			organizationId={organization.id}
			userRole={userRole}
			userName={userName}
		>
			{children}
		</ProjectShell>
	);
}
