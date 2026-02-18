"use client";

import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getContextActions } from "./constants";
import { useProjectRole } from "../../hooks/use-project-role";

interface ProjectContextToolbarProps {
	organizationSlug: string;
	projectId: string;
}

// Map context action routes to their parent section for visibility checks
function getActionSection(href: string): string {
	const parts = href.split("/");
	return parts[0] ?? "";
}

export function ProjectContextToolbar({
	organizationSlug,
	projectId,
}: ProjectContextToolbarProps) {
	const pathname = usePathname();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const actions = getContextActions(pathname);
	const { canViewSection } = useProjectRole();

	// Filter actions based on role visibility
	const visibleActions = actions.filter((action) => {
		const section = getActionSection(action.href);
		return canViewSection(section);
	});

	if (visibleActions.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-wrap items-center gap-2 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm px-4 py-2.5">
			{visibleActions.map((action) => (
				<Button
					key={action.id}
					variant={action.variant === "primary" ? "primary" : "outline"}
					size="sm"
					asChild
					className={cn(
						"gap-1.5 rounded-lg text-sm",
						action.variant === "primary" &&
							"bg-teal-600 hover:bg-teal-700 dark:bg-teal-600 dark:hover:bg-teal-700",
					)}
				>
					<Link href={`${basePath}/${action.href}`}>
						<action.icon className="h-4 w-4" />
						<span className="hidden sm:inline">{action.label}</span>
					</Link>
				</Button>
			))}
		</div>
	);
}
