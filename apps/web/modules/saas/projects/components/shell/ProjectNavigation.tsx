"use client";

import { cn } from "@ui/lib";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
	NAVIGATION_GROUPS,
	getCurrentRouteSegment,
	type NavGroup,
} from "./constants";
import { useProjectRole } from "../../hooks/use-project-role";

interface ProjectNavigationProps {
	organizationSlug: string;
	projectId: string;
}

export function ProjectNavigation({
	organizationSlug,
	projectId,
}: ProjectNavigationProps) {
	const pathname = usePathname();
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const currentSegment = getCurrentRouteSegment(pathname);
	const { canViewSection } = useProjectRole();

	// Check if current segment matches group
	const isGroupActive = (group: NavGroup): boolean => {
		if (group.directLink) {
			return (
				currentSegment === group.directLink ||
				currentSegment.startsWith(`${group.directLink}/`)
			);
		}
		return group.routes.some(
			(route) =>
				currentSegment === route.path ||
				currentSegment.startsWith(`${route.path}/`),
		);
	};

	// Check if specific route is active
	const isRouteActive = (routePath: string): boolean => {
		return (
			currentSegment === routePath ||
			currentSegment.startsWith(`${routePath}/`)
		);
	};

	// Filter groups based on role visibility
	const visibleGroups = useMemo(() => {
		return NAVIGATION_GROUPS.map((group) => {
			if (group.directLink) {
				if (!canViewSection(group.directLink)) return null;
				return group;
			}
			const visibleRoutes = group.routes.filter((route) =>
				canViewSection(route.path),
			);
			if (visibleRoutes.length === 0) return null;
			return { ...group, routes: visibleRoutes };
		}).filter(Boolean) as NavGroup[];
	}, [canViewSection]);

	// Determine active group for level-2 display
	const activeGroup = useMemo(() => {
		for (const group of visibleGroups) {
			if (isGroupActive(group) && group.routes.length > 1) {
				return group;
			}
		}
		return null;
	}, [visibleGroups, currentSegment]);

	// Get default path for a group (first route)
	const getGroupDefaultPath = (group: NavGroup): string => {
		if (group.directLink) return `${basePath}/${group.directLink}`;
		return `${basePath}/${group.routes[0].path}`;
	};

	return (
		<nav className="border-b border-slate-200/60 dark:border-slate-800/60">
			{/* Level 1: Primary tabs with underline indicator */}
			<div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
				{/* Overview tab */}
				<Link
					href={basePath}
					className={cn(
						"relative shrink-0 px-4 py-3 text-sm font-medium transition-colors duration-200",
						currentSegment === ""
							? "text-teal-700 dark:text-teal-400"
							: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
					)}
				>
					{t("projects.shell.navigation.overview")}
					{currentSegment === "" && (
						<span className="absolute inset-x-0 bottom-0 h-0.5 bg-teal-500 rounded-full" />
					)}
				</Link>

				{/* Navigation group tabs */}
				{visibleGroups.map((group) => {
					const active = isGroupActive(group);
					return (
						<Link
							key={group.id}
							href={getGroupDefaultPath(group)}
							className={cn(
								"relative shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors duration-200",
								active
									? "text-teal-700 dark:text-teal-400"
									: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
							)}
						>
							<group.icon className="h-4 w-4" />
							{group.label}
							{active && (
								<span className="absolute inset-x-0 bottom-0 h-0.5 bg-teal-500 rounded-full" />
							)}
						</Link>
					);
				})}
			</div>

			{/* Level 2: Sub-route pills (shown when a multi-route group is active) */}
			{activeGroup && (
				<div className="bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200/40 dark:border-slate-800/40">
					<div className="flex items-center gap-1 overflow-x-auto px-3 py-2 scrollbar-hide">
						{activeGroup.routes.map((route) => {
							const active = isRouteActive(route.path);
							return (
								<Link
									key={route.id}
									href={`${basePath}/${route.path}`}
									className={cn(
										"shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200",
										active
											? "bg-white shadow-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100 dark:shadow-slate-900/20"
											: "text-slate-500 hover:text-slate-700 hover:bg-white/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/40",
									)}
								>
									<route.icon className="h-3.5 w-3.5" />
									{route.label}
								</Link>
							);
						})}
					</div>
				</div>
			)}
		</nav>
	);
}
