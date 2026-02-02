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
	Calendar,
	ChevronLeft,
	Clock,
	MapPin,
	User,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

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

export function ProjectHeader({
	project,
	organizationSlug,
}: ProjectHeaderProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects`;

	const daysRemaining = calculateDaysRemaining(project.endDate);
	const statusConfig = PROJECT_STATUSES[project.status as ProjectStatus];

	return (
		<div className="space-y-4">
			{/* Top row: Back button, name, status */}
			<div className="flex items-start gap-3">
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="mt-0.5 shrink-0 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
				>
					<Link href={basePath}>
						<ChevronLeft className="h-5 w-5 text-slate-500" />
					</Link>
				</Button>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="truncate text-xl font-semibold text-slate-900 dark:text-slate-100 sm:text-2xl">
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
					<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
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
										? t("projects.shell.daysRemaining", { count: daysRemaining })
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
			</div>

			{/* Progress bar - compact */}
			<div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5 dark:bg-slate-800/50">
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
}
