import { getProjectById } from "@repo/database";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { ProjectShell } from "@saas/projects/components/shell";
import { notFound, redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function ProjectLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{ organizationSlug: string; projectId: string }>;
}>) {
	const session = await getSession();
	const { organizationSlug, projectId } = await params;

	if (!session?.user) {
		redirect("/auth/login");
	}

	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		redirect("/app");
	}

	const project = await getProjectById(projectId, organization.id);

	if (!project) {
		return notFound();
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

	return (
		<ProjectShell project={projectData} organizationSlug={organizationSlug}>
			{children}
		</ProjectShell>
	);
}
