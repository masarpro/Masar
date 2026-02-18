"use client";

import { formatCurrency, calculateDaysRemaining } from "@shared/lib/formatters";
import {
	PROJECT_STATUSES,
	getProjectStatusClasses,
	type ProjectStatus,
} from "@shared/lib/constants";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import {
	Banknote,
	ChevronLeft,
	Clock,
	FolderKanban,
	MapPin,
	User,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { memo } from "react";
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
}

export const ProjectHeader = memo(function ProjectHeader({
	project,
	organizationSlug,
}: ProjectHeaderProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects`;

	const daysRemaining = calculateDaysRemaining(project.endDate);
	const statusConfig = PROJECT_STATUSES[project.status as ProjectStatus];

	return (
		<div className="space-y-4" dir="rtl">
			{/* Top section with gradient background */}
			<div className="rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50 p-4">
				<div className="flex items-start gap-3">
					<Button
						variant="ghost"
						size="icon"
						asChild
						className="mt-0.5 shrink-0 rounded-xl hover:bg-white/50 dark:hover:bg-slate-800/50"
					>
						<Link href={basePath}>
							<ChevronLeft className="h-5 w-5 text-slate-500" />
						</Link>
					</Button>

					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<div className="p-2 rounded-lg bg-primary/10">
								<FolderKanban className="h-5 w-5 text-primary" />
							</div>
							<h1 className="truncate text-xl font-bold text-foreground sm:text-2xl">
								{project.name || t("projects.unnamed")}
							</h1>
							{statusConfig && (
								<Badge
									className={`shrink-0 border-0 ${getProjectStatusClasses(project.status as ProjectStatus)}`}
								>
									{t(`projects.status.${project.status}`)}
								</Badge>
							)}
						</div>

						{/* Meta info row */}
						<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
							{project.clientName && (
								<div className="flex items-center gap-1.5">
									<User className="h-3.5 w-3.5" />
									<span>{project.clientName}</span>
								</div>
							)}
							{project.location && (
								<div className="flex items-center gap-1.5">
									<MapPin className="h-3.5 w-3.5" />
									<span>{project.location}</span>
								</div>
							)}
							{project.contractValue && (
								<div className="flex items-center gap-1.5">
									<Banknote className="h-3.5 w-3.5" />
									<span>{formatCurrency(project.contractValue)}</span>
								</div>
							)}
							{daysRemaining !== null && (
								<div className="flex items-center gap-1.5">
									<Clock className="h-3.5 w-3.5" />
									<span>
										{daysRemaining > 0
											? t("projects.shell.daysRemaining", {
													count: daysRemaining,
												})
											: daysRemaining === 0
												? t("projects.shell.dueToday")
												: t("projects.shell.daysOverdue", {
														count: Math.abs(daysRemaining),
													})}
									</span>
								</div>
							)}
						</div>
					</div>

					{/* View As Selector */}
					<div className="shrink-0">
						<ViewAsSelector />
					</div>
				</div>
			</div>

			{/* Progress bar - glass morphism */}
			<div className="flex items-center gap-3 rounded-xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 shadow-sm px-4 py-2.5">
				<span className="text-sm text-slate-600 dark:text-slate-400">
					{t("projects.overview.progress")}
				</span>
				<Progress value={project.progress} className="h-2 flex-1" />
				<span className="min-w-[3rem] text-end text-sm font-semibold text-teal-600 dark:text-teal-400">
					{Math.round(project.progress)}%
				</span>
			</div>
		</div>
	);
});
