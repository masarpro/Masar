"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { Button } from "@ui/components/button";
import {
	BarChart3,
	ChevronLeft,
	FileText,
	FolderPlus,
	Plus,
	Receipt,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const glassCard =
	"backdrop-blur-xl bg-card/80 border border-border/50 rounded-2xl shadow-lg shadow-black/5";

function daysRemaining(endDate: Date | string | null): number {
	if (!endDate) return 0;
	const now = new Date();
	const end = new Date(endDate);
	return Math.max(
		0,
		Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
	);
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
				className={`${glassCard} flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-3 duration-500`}
			>
				<div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
					<FolderPlus className="h-7 w-7 text-primary" />
				</div>
				<h3 className="text-base font-bold mb-1.5">
					{t("dashboard.addFirstProject")}
				</h3>
				<p className="text-xs text-muted-foreground mb-4 max-w-xs">
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
							<div
								key={i}
								className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-start"
							>
								<Icon className={`h-4 w-4 ${feat.color} shrink-0`} />
								<span className="text-[11px]">{feat.label}</span>
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

	const MAX_VISIBLE = 5;
	const visibleProjects = projects.slice(0, MAX_VISIBLE);
	const hasMore = projects.length > MAX_VISIBLE;

	return (
		<div
			className={`${glassCard} flex flex-col p-4 animate-in fade-in slide-in-from-bottom-3 duration-500`}
		>
			<div className="flex items-center justify-between mb-3">
				<h2 className="text-sm font-semibold text-foreground">
					{t("dashboard.activeProjects")}
				</h2>
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="flex items-center gap-1 text-[10px] text-primary hover:underline"
				>
					{t("dashboard.viewAll")}
					<ChevronLeft className="h-3 w-3" />
				</Link>
			</div>

			<div className="flex-1 space-y-0.5 overflow-hidden">
				{visibleProjects.map((project, i) => {
					const progress = Math.round(Number(project.progress ?? 0));
					const contractValue = Number(project.contractValue ?? 0);
					const days = daysRemaining(project.endDate);

					// Progress ring circumference
					const circumference = 2 * Math.PI * 15.5;
					const strokeDash = (progress / 100) * circumference;
					const progressColor =
						progress >= 70
							? "stroke-emerald-500"
							: progress >= 40
								? "stroke-amber-500"
								: "stroke-red-500";

					return (
						<Link
							key={project.id}
							href={`/app/${organizationSlug}/projects/${project.id}`}
							className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
							style={{ animationDelay: `${80 + i * 50}ms` }}
						>
							{/* Progress ring */}
							<div className="relative h-10 w-10 shrink-0">
								<svg viewBox="0 0 36 36" className="h-10 w-10 -rotate-90">
									<circle
										cx="18"
										cy="18"
										r="15.5"
										fill="none"
										strokeWidth="3"
										className="stroke-muted/30"
									/>
									<circle
										cx="18"
										cy="18"
										r="15.5"
										fill="none"
										strokeWidth="3"
										className={progressColor}
										strokeDasharray={`${strokeDash} ${circumference}`}
										strokeLinecap="round"
									/>
								</svg>
								<span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
									{progress}%
								</span>
							</div>

							{/* Info */}
							<div className="flex-1 min-w-0">
								<p className="text-xs font-semibold truncate">
									{project.name || t("projects.unnamed")}
								</p>
								<p className="text-[10px] text-muted-foreground truncate">
									{project.clientName || "\u2014"}
								</p>
							</div>

							{/* Stats */}
							<div className="flex items-center gap-3 shrink-0">
								<div className="text-end">
									<p className="text-[11px] font-bold">
										<Currency amount={contractValue} />
									</p>
									<p className="text-[9px] text-muted-foreground">
										{days} {t("dashboard.alerts.daysRemaining")}
									</p>
								</div>
								<ChevronLeft className="h-4 w-4 text-muted-foreground" />
							</div>
						</Link>
					);
				})}
			</div>

			{hasMore && (
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="text-center text-[11px] text-primary hover:underline mt-2 pt-2 border-t border-border/50"
				>
					{t("dashboard.viewAll")} ({projects.length})
				</Link>
			)}
		</div>
	);
}
