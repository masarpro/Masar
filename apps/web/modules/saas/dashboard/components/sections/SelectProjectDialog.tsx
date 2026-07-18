"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { FolderOpen } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface SelectProjectDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	organizationSlug: string;
	/** Path appended to /projects/{id} after picking a project. */
	targetPath: string;
}

/**
 * Picks an active project then navigates to a project-scoped page — used by
 * org-dashboard quick actions that need a project context (e.g. daily report).
 */
export function SelectProjectDialog({
	open,
	onOpenChange,
	organizationId,
	organizationSlug,
	targetPath,
}: SelectProjectDialogProps) {
	const t = useTranslations();

	const { data, isLoading } = useQuery({
		...orpc.projects.list.queryOptions({
			input: { organizationId, status: "ACTIVE", limit: 50 },
		}),
		enabled: open && !!organizationId,
	});

	const projects = data?.projects ?? [];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("dashboard.selectProjectTitle")}</DialogTitle>
				</DialogHeader>

				{isLoading ? (
					<div className="space-y-2">
						{[0, 1, 2].map((i) => (
							<div
								key={i}
								className="h-12 animate-pulse rounded-xl bg-muted"
							/>
						))}
					</div>
				) : projects.length === 0 ? (
					<p className="py-6 text-center text-sm text-muted-foreground">
						{t("dashboard.noActiveProjects")}
					</p>
				) : (
					<div className="max-h-80 space-y-1 overflow-y-auto">
						{projects.map((project: { id: string; name: string }) => (
							<Link
								key={project.id}
								href={`/app/${organizationSlug}/projects/${project.id}/${targetPath}`}
								onClick={() => onOpenChange(false)}
								className="flex items-center gap-3 rounded-xl border-2 border-transparent p-3 transition-colors hover:border-primary/20 hover:bg-accent"
							>
								<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-chart-4/15 text-chart-4">
									<FolderOpen className="size-4" />
								</span>
								<span className="truncate text-sm font-semibold text-foreground">
									{project.name}
								</span>
							</Link>
						))}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
