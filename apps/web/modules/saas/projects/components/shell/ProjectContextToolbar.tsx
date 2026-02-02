"use client";

import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getContextActions, getCurrentRouteSegment } from "./constants";

interface ProjectContextToolbarProps {
	organizationSlug: string;
	projectId: string;
}

export function ProjectContextToolbar({
	organizationSlug,
	projectId,
}: ProjectContextToolbarProps) {
	const pathname = usePathname();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const actions = getContextActions(pathname);

	// Don't render if no actions
	if (actions.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/50">
			{actions.map((action) => (
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
