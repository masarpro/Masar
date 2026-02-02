"use client";

import type { ReactNode } from "react";
import { ProjectHeader, type ProjectHeaderProps } from "./ProjectHeader";
import { ProjectNavigation } from "./ProjectNavigation";
import { ProjectContextToolbar } from "./ProjectContextToolbar";

export interface ProjectShellProps {
	project: ProjectHeaderProps["project"];
	organizationSlug: string;
	children: ReactNode;
}

export function ProjectShell({
	project,
	organizationSlug,
	children,
}: ProjectShellProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* Header Section */}
			<div className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
				<ProjectHeader project={project} organizationSlug={organizationSlug} />
			</div>

			{/* Navigation */}
			<div className="bg-white dark:bg-slate-950">
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
	);
}
