"use client";

import type { ReactNode } from "react";
import { ProjectHeader, type ProjectHeaderProps } from "./ProjectHeader";
import { ProjectNavigation } from "./ProjectNavigation";
import { ProjectContextToolbar } from "./ProjectContextToolbar";
import { RecentUpdatesStrip } from "./RecentUpdatesStrip";
import { ProjectRoleProvider } from "../../hooks/use-project-role";
import type { ProjectRole } from "../../lib/role-visibility";

export interface ProjectShellProps {
	project: ProjectHeaderProps["project"];
	organizationSlug: string;
	organizationId: string;
	userRole?: ProjectRole;
	children: ReactNode;
}

export function ProjectShell({
	project,
	organizationSlug,
	organizationId,
	userRole = "VIEWER",
	children,
}: ProjectShellProps) {
	return (
		<ProjectRoleProvider actualRole={userRole}>
			<div className="flex min-h-0 flex-1 flex-col" dir="rtl">
				{/* Header Section - Glass Morphism */}
				<div className="border-b border-white/20 dark:border-slate-700/30 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm px-4 py-4 sm:px-6">
					<ProjectHeader
						project={project}
						organizationSlug={organizationSlug}
					/>
				</div>

				{/* Recent Updates Strip */}
				<RecentUpdatesStrip
					organizationId={organizationId}
					projectId={project.id}
				/>

				{/* Navigation */}
				<div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
					<div className="px-4 sm:px-6">
						<ProjectNavigation
							organizationSlug={organizationSlug}
							projectId={project.id}
						/>
					</div>
				</div>

				{/* Context Actions Toolbar */}
				<ProjectContextToolbar
					organizationSlug={organizationSlug}
					projectId={project.id}
				/>

				{/* Page Content */}
				<div className="flex-1 overflow-y-auto">
					<div className="px-4 py-6 sm:px-6">{children}</div>
				</div>
			</div>
		</ProjectRoleProvider>
	);
}
