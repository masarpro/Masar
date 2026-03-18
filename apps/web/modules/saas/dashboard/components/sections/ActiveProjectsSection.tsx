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
				className={`${glassCard} flex flex-col items-center justify-center p-6 text-center`}
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

	const MAX_VISIBLE = 4;
	const visibleProjects = projects.slice(0, MAX_VISIBLE);
	const hasMore = projects.length > MAX_VISIBLE;

	return (
		<div className={`${glassCard} flex flex-col p-4 overflow-hidden`}>
			{/* Header */}
			<div className="flex items-center justify-between mb-3 shrink-0">
				<div className="flex items-center gap-2">
					<div className="p-1.5 rounded-lg bg-primary/10">
						<FolderOpen className="h-4 w-4 text-primary" />
					</div>
					<h2 className="text-base font-bold text-foreground">
						{t("dashboard.activeProjects")}
					</h2>
					<span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
						{projects.length}
					</span>
				</div>
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
				>
					{t("dashboard.viewAll")}
					<ChevronLeft className="h-3 w-3" />
				</Link>
			</div>

			{/* Project list */}
			<div className="flex-1 overflow-y-auto min-h-0 space-y-2">
				{visibleProjects.map((project, i) => {
					const progress = Math.round(Number(project.progress ?? 0));
					const contractValue = Number(project.contractValue ?? 0);
					const days = daysRemaining(project.endDate);

					const circumference = 2 * Math.PI * 15.5;
					const strokeDash = (progress / 100) * circumference;
					const healthColor =
						progress >= 70
							? "stroke-emerald-500"
							: progress >= 40
								? "stroke-amber-500"
								: "stroke-red-500";
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
							className="group relative flex items-center gap-4 p-3 rounded-xl border border-border/30 bg-card/50 hover:bg-card hover:border-border/60 hover:shadow-md transition-all duration-300"
							style={{ animationDelay: `${80 + i * 50}ms` }}
						>
							{/* Health side bar */}
							<div
								className={`absolute top-2 bottom-2 start-0 w-1 rounded-full ${healthBarColor}`}
							/>

							{/* Progress ring */}
							<div className="relative h-14 w-14 shrink-0 ms-2">
								<svg
									viewBox="0 0 36 36"
									className="h-14 w-14 -rotate-90"
								>
									<circle
										cx="18"
										cy="18"
										r="15.5"
										fill="none"
										strokeWidth="2.5"
										className="stroke-muted/20"
									/>
									<circle
										cx="18"
										cy="18"
										r="15.5"
										fill="none"
										strokeWidth="2.5"
										className={healthColor}
										strokeDasharray={`${strokeDash} ${circumference}`}
										strokeLinecap="round"
									/>
								</svg>
								<span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
									{progress}%
								</span>
							</div>

							{/* Info */}
							<div className="flex-1 min-w-0">
								<p className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
									{project.name || t("projects.unnamed")}
								</p>
								<p className="text-sm text-muted-foreground truncate">
									{project.clientName || t("dashboard.noClient")}
								</p>

								<div className="flex items-center gap-4 mt-1.5">
									<div className="flex items-center gap-1">
										<Banknote className="h-3.5 w-3.5 text-emerald-500" />
										<span className="text-sm font-bold text-foreground">
											<Currency amount={contractValue} />
										</span>
									</div>
									{days !== null && (
										<div className="flex items-center gap-1">
											<Calendar className="h-3.5 w-3.5 text-blue-500" />
											<span className="text-xs text-muted-foreground">
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
