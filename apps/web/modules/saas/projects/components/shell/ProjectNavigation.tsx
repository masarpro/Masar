"use client";

import { useMemo } from "react";
import { getVisibleGroups } from "./constants";
import { useProjectRole } from "../../hooks/use-project-role";
import { DesktopNavBar } from "./DesktopNavBar";
import { MobileBottomNav } from "./MobileBottomNav";

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
			<MobileBottomNav
				groups={visibleGroups}
				organizationSlug={organizationSlug}
				projectId={projectId}
			/>
		</>
	);
}
