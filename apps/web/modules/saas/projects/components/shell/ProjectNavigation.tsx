"use client";

import { useMemo } from "react";
import { getVisibleGroups } from "./constants";
import { useProjectRole } from "../../hooks/use-project-role";
import { DesktopNavBar } from "./DesktopNavBar";
import { ProjectMobileTabs } from "./ProjectMobileTabs";

interface ProjectNavigationProps {
	organizationSlug: string;
	projectId: string;
}

export function ProjectNavigation({
	organizationSlug,
	projectId,
}: ProjectNavigationProps) {
	const { canViewSection } = useProjectRole();

	const visibleGroups = useMemo(
		() => getVisibleGroups(canViewSection),
		[canViewSection],
	);

	return (
		<>
			<DesktopNavBar
				groups={visibleGroups}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
			{/* الجوال: تبويبات أفقية تحت الهيدر — الشريط السفلي العام يبقى ثابتاً */}
			<ProjectMobileTabs
				groups={visibleGroups}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</>
	);
}
