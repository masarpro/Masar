"use client";

import { cn } from "@ui/lib";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	NAVIGATION_GROUPS,
	getCurrentRouteSegment,
	type NavGroup,
} from "./constants";

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

	// Check if current segment matches group
	const isGroupActive = (group: NavGroup): boolean => {
		if (group.directLink) {
			return currentSegment === group.directLink;
		}
		return group.routes.some((route) => currentSegment === route.path);
	};

	// Check if specific route is active
	const isRouteActive = (routePath: string): boolean => {
		return currentSegment === routePath;
	};

	return (
		<nav className="border-b border-slate-200 dark:border-slate-800">
			<div className="flex gap-1 overflow-x-auto px-1 py-2 scrollbar-hide sm:gap-2">
				{/* Overview link - always first */}
				<Link href={basePath}>
					<Button
						variant="ghost"
						size="sm"
						className={cn(
							"shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
							currentSegment === ""
								? "bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 dark:hover:bg-teal-900/50"
								: "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
						)}
					>
						{t("projects.shell.navigation.overview")}
					</Button>
				</Link>

				{/* Navigation groups */}
				{NAVIGATION_GROUPS.map((group) => {
					const isActive = isGroupActive(group);

					// Direct link (no dropdown)
					if (group.directLink) {
						return (
							<Link key={group.id} href={`${basePath}/${group.directLink}`}>
								<Button
									variant="ghost"
									size="sm"
									className={cn(
										"shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
										isActive
											? "bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 dark:hover:bg-teal-900/50"
											: "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
									)}
								>
									<group.icon className="me-1.5 h-4 w-4" />
									{group.label}
								</Button>
							</Link>
						);
					}

					// Dropdown menu for groups with multiple routes
					return (
						<DropdownMenu key={group.id}>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="sm"
									className={cn(
										"shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
										isActive
											? "bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400 dark:hover:bg-teal-900/50"
											: "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
									)}
								>
									<group.icon className="me-1.5 h-4 w-4" />
									{group.label}
									<ChevronDown className="ms-1 h-3.5 w-3.5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="min-w-[180px]">
								{group.routes.map((route) => (
									<DropdownMenuItem key={route.id} asChild>
										<Link
											href={`${basePath}/${route.path}`}
											className={cn(
												"flex w-full cursor-pointer items-center gap-2",
												isRouteActive(route.path) && "font-semibold",
											)}
										>
											<route.icon className="h-4 w-4 opacity-60" />
											{route.label}
										</Link>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					);
				})}
			</div>
		</nav>
	);
}
