"use client";

import type { ReactNode } from "react";
import { ProjectHeader, type ProjectHeaderProps } from "./ProjectHeader";
import { ProjectNavigation } from "./ProjectNavigation";
import { ProjectRoleProvider } from "../../hooks/use-project-role";
import type { ProjectRole } from "../../lib/role-visibility";
import { FloatingChatButton } from "../chat/FloatingChatButton";

export interface ProjectShellProps {
	project: ProjectHeaderProps["project"];
	organizationSlug: string;
	organizationId: string;
	userRole?: ProjectRole;
	userName?: string;
	children: ReactNode;
}

export function ProjectShell({
	project,
	organizationSlug,
	organizationId,
	userRole = "VIEWER",
	userName,
	children,
}: ProjectShellProps) {
	return (
		<ProjectRoleProvider actualRole={userRole} projectData={project}>
			<div className="flex min-h-0 flex-1 flex-col" dir="rtl">
				{/* Header Section - Matches Finance section style */}
				<div className="px-4 py-4 sm:px-6">
					<ProjectHeader
						project={project}
						organizationSlug={organizationSlug}
						organizationId={organizationId}
						userName={userName}
					/>
				</div>

				{/* Navigation */}
				<div className="px-4 sm:px-6">
					<ProjectNavigation
						organizationSlug={organizationSlug}
						projectId={project.id}
					/>
				</div>

				{/* Page Content */}
				<div className="flex-1 overflow-y-auto h-full">
					<div className="px-4 py-4 pb-20 md:pb-4 sm:px-6 h-full">
						{children}
					</div>
				</div>

				{/* Floating Chat Button */}
				<FloatingChatButton
					organizationId={organizationId}
					organizationSlug={organizationSlug}
					projectId={project.id}
				/>
			</div>
		</ProjectRoleProvider>
	);
}
