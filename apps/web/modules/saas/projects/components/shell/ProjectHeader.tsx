"use client";

import { Button } from "@ui/components/button";
import { ArrowRight, FolderKanban, Megaphone } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { ContractBar } from "./ContractBar";
import { ViewAsSelector } from "./ViewAsSelector";

export interface ProjectHeaderProps {
	project: {
		id: string;
		name: string;
		status: string;
		progress: number;
		contractValue?: number | null;
		clientName?: string | null;
		location?: string | null;
		startDate?: Date | string | null;
		endDate?: Date | string | null;
	};
	organizationSlug: string;
	organizationId: string;
}

export const ProjectHeader = memo(function ProjectHeader({
	project,
	organizationSlug,
	organizationId,
}: ProjectHeaderProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects`;

	return (
		<div className="space-y-2">
			<div
				className="flex items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50"
				dir="rtl"
			>
				{/* Back button + Project name */}
				<div className="flex items-center gap-3 min-w-0">
					<Button
						variant="ghost"
						size="icon"
						asChild
						className="h-9 w-9 shrink-0 hover:bg-primary/10"
					>
						<Link href={basePath}>
							<ArrowRight className="h-5 w-5" />
							<span className="sr-only">{t("projects.shell.backToProjects")}</span>
						</Link>
					</Button>

					<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
						<FolderKanban className="h-5 w-5 text-primary" />
					</div>
					<div className="min-w-0">
						<h1 className="text-xl font-bold text-foreground truncate">
							{project.name || t("projects.unnamed")}
						</h1>
					</div>
				</div>

				{/* Right side: Updates + ViewAsSelector */}
				<div className="flex items-center gap-3 shrink-0">
					<Button
						variant="ghost"
						size="sm"
						asChild
						className="gap-1.5 hover:bg-primary/10"
					>
						<Link href={`${basePath}/${project.id}/updates`}>
							<Megaphone className="h-4 w-4" />
							<span className="hidden sm:inline text-sm">{t("projects.shell.sections.updates")}</span>
						</Link>
					</Button>
					<ViewAsSelector />
				</div>
			</div>

			{/* Contract Bar */}
			<ContractBar
				organizationId={organizationId}
				projectId={project.id}
				contractHref={`/app/${organizationSlug}/projects/${project.id}/finance/contract`}
			/>
		</div>
	);
});
