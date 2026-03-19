"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { Button } from "@ui/components/button";
import {
	Banknote,
	BarChart3,
	Calendar,
	ChevronLeft,
	FileText,
	FolderOpen,
	FolderPlus,
	Plus,
	Receipt,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

function daysRemaining(endDate: Date | string | null): number | null {
	if (!endDate) return null;
	const now = new Date();
	const end = new Date(endDate);
	return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface Project {
	id: string;
	name: string | null;
	status: string;
	progress: number | string | null;
	contractValue: number | string | { toString(): string } | null;
	endDate: Date | string | null;
	clientName: string | null;
	photos?: { url: string }[];
}

interface ActiveProjectsSectionProps {
	projects: Project[];
	organizationSlug: string;
}

export function ActiveProjectsSection({
	projects,
	organizationSlug,
}: ActiveProjectsSectionProps) {
	const t = useTranslations();

	// Empty state
	if (projects.length === 0) {
		return (
			<div
				className={`${glassCard} flex flex-col items-center justify-center p-4 text-center`}
			>
				<div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
					<FolderPlus className="h-8 w-8 text-primary" />
				</div>
				<h3 className="text-lg font-bold mb-2">
					{t("dashboard.addFirstProject")}
				</h3>
				<p className="text-sm text-muted-foreground mb-4 max-w-xs">
					{t("dashboard.addFirstProjectDesc")}
				</p>
				<div className="grid grid-cols-2 gap-2 mb-4 w-full max-w-sm">
					{[
						{ icon: BarChart3, label: t("dashboard.feature.tracking"), color: "text-blue-500" },
						{ icon: Receipt, label: t("dashboard.feature.invoicing"), color: "text-green-500" },
						{ icon: Users, label: t("dashboard.feature.team"), color: "text-purple-500" },
						{ icon: FileText, label: t("dashboard.feature.documents"), color: "text-amber-500" },
					].map((feat, i) => {
						const Icon = feat.icon;
						return (
							<div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 text-start">
								<Icon className={`h-4 w-4 ${feat.color} shrink-0`} />
								<span className="text-xs">{feat.label}</span>
							</div>
						);
					})}
				</div>
				<Button asChild size="sm">
					<Link href={`/app/${organizationSlug}/projects/new`}>
						<Plus className="h-4 w-4 me-1" />
						{t("dashboard.createFirstProject")}
					</Link>
				</Button>
			</div>
		);
	}

	const MAX_VISIBLE = 3;
	const visibleProjects = projects.slice(0, MAX_VISIBLE);
	const hasMore = projects.length > MAX_VISIBLE;

	return (
		<div className={`${glassCard} flex flex-col p-4 overflow-hidden`}>
			{/* Header */}
			<div className="flex items-center justify-between mb-3 shrink-0 -mx-4 -mt-4 px-4 py-2.5 rounded-t-2xl bg-gradient-to-l from-blue-50/70 via-blue-50/40 to-sky-50/60 dark:from-blue-950/30 dark:via-blue-950/20 dark:to-sky-950/25 border-b border-blue-200/30 dark:border-blue-500/15">
				<div className="flex items-center gap-2">
					<div className="p-1.5 rounded-lg bg-blue-500/10">
						<FolderOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</div>
					<h2 className="text-base font-bold text-foreground">
						{t("dashboard.activeProjects")}
					</h2>
					<span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
						{projects.length}
					</span>
				</div>
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
				>
					{t("dashboard.viewAll")}
					<ChevronLeft className="h-3 w-3" />
				</Link>
			</div>

			{/* Project list */}
			<div className="flex-1 overflow-y-auto min-h-0 space-y-1.5">
				{visibleProjects.map((project, i) => {
					const progress = Math.round(Number(project.progress ?? 0));
					const contractValue = Number(project.contractValue ?? 0);
					const days = daysRemaining(project.endDate);

					const healthBarColor =
						progress >= 70
							? "bg-emerald-500"
							: progress >= 40
								? "bg-amber-500"
								: "bg-red-500";

					return (
						<Link
							key={project.id}
							href={`/app/${organizationSlug}/projects/${project.id}`}
							className="group relative flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card/50 hover:bg-card hover:border-border/60 hover:shadow-md transition-all duration-300"
							style={{ animationDelay: `${80 + i * 50}ms` }}
						>
							{/* Health side bar */}
							<div
								className={`absolute top-2 bottom-2 start-0 w-1 rounded-full ${healthBarColor}`}
							/>

							{/* Project photo */}
							<div className="relative h-10 w-10 shrink-0 ms-2 rounded-lg overflow-hidden bg-muted/30">
								{project.photos?.[0]?.url ? (
									<Image
										src={project.photos[0].url}
										alt={project.name || ""}
										fill
										className="object-cover"
										sizes="40px"
										unoptimized
									/>
								) : (
									<div className="h-full w-full bg-gradient-to-br from-blue-500/20 to-sky-500/20 flex items-center justify-center">
										<FolderOpen className="h-4 w-4 text-blue-400/60" />
									</div>
								)}
							</div>

							{/* Info */}
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2">
									<p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
										{project.name || t("projects.unnamed")}
									</p>
									<span className={`text-[10px] font-bold shrink-0 ${progress >= 70 ? "text-emerald-600" : progress >= 40 ? "text-amber-600" : "text-red-600"}`}>
										{progress}%
									</span>
								</div>
								{/* Progress bar */}
								<div className="h-1.5 w-full bg-muted/30 rounded-full mt-1 overflow-hidden">
									<div
										className={`h-full rounded-full transition-all ${progress >= 70 ? "bg-emerald-500" : progress >= 40 ? "bg-amber-500" : "bg-red-500"}`}
										style={{ width: `${progress}%` }}
									/>
								</div>

								<div className="flex items-center gap-3 mt-1">
									<span className="text-xs text-muted-foreground truncate">
										{project.clientName || t("dashboard.noClient")}
									</span>
									<div className="flex items-center gap-1">
										<Banknote className="h-3 w-3 text-emerald-500" />
										<span className="text-xs font-bold text-foreground">
											<Currency amount={contractValue} />
										</span>
									</div>
									{days !== null && (
										<div className="flex items-center gap-1">
											<Calendar className="h-3 w-3 text-blue-500" />
											<span className="text-[11px] text-muted-foreground">
												{days > 0
													? `${days} ${t("dashboard.alerts.daysRemaining")}`
													: t("dashboard.projectEnded")}
											</span>
										</div>
									)}
								</div>
							</div>

							{/* Arrow */}
							<ChevronLeft className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
						</Link>
					);
				})}
			</div>

			{hasMore && (
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="text-center text-xs text-primary hover:underline mt-2 pt-2 border-t border-border/50 shrink-0"
				>
					{t("dashboard.viewAll")} ({projects.length})
				</Link>
			)}
		</div>
	);
}
