"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { cn } from "@ui/lib";
import { Badge } from "@ui/components/badge";
import {
	AlertTriangle,
	CheckCircle2,
	ChevronLeft,
	Clock,
	Lightbulb,
	Plus,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CircleProgress } from "./CircleProgress";
import { DashboardTips } from "./DashboardTips";

// ── Helpers ──
function getProgressColor(progress: number): string {
	if (progress > 70) return "#10b981";
	if (progress >= 30) return "#f59e0b";
	return "#94a3b8";
}

function getProgressTextClass(progress: number): string {
	if (progress > 70) return "text-emerald-600 dark:text-emerald-400";
	if (progress >= 30) return "text-amber-600 dark:text-amber-400";
	return "text-gray-500 dark:text-gray-400";
}

// ── Types ──
export interface SuggestedAction {
	id: string;
	icon: typeof AlertTriangle | typeof Clock | typeof CheckCircle2;
	iconColor: string;
	bgColor: string;
	text: string;
	buttonLabel: string;
	href: string;
	priority: "hot" | "warm" | "normal";
}

interface ProjectItem {
	id: string;
	name: string | null;
	progress: number | string | null;
	contractValue: number | null;
	status: string;
}

interface WorkColumnProps {
	projects: ProjectItem[];
	suggestedActions: SuggestedAction[];
	organizationSlug: string;
}

export function WorkColumn({
	projects,
	suggestedActions,
	organizationSlug,
}: WorkColumnProps) {
	const t = useTranslations();

	return (
		<div
			className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card p-5 animate-in fade-in slide-in-from-bottom-3 duration-500"
			style={{ animationDelay: "100ms" }}
		>
			{/* ── Projects ── */}
			<div className="mb-3 flex items-center justify-between">
				<h3 className="text-sm font-bold text-foreground">
					{t("dashboard.activeProjects")}
				</h3>
				<Link
					href={`/app/${organizationSlug}/projects`}
					className="flex items-center gap-0.5 text-[10px] text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
				>
					{t("dashboard.viewAll")}{" "}
					<ChevronLeft className="h-3 w-3" />
				</Link>
			</div>

			{projects.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 py-6">
					<p className="text-sm text-muted-foreground">
						{t("dashboard.emptyProjects.description")}
					</p>
					<Link
						href={`/app/${organizationSlug}/projects/new`}
						className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						<Plus className="h-4 w-4" />{" "}
						{t("dashboard.emptyProjects.cta")}
					</Link>
				</div>
			) : (
				<div className="mb-4 space-y-0">
					{projects.slice(0, 3).map((project, idx) => {
						const progress = Math.round(
							Number(project.progress ?? 0),
						);
						const contractValue = project.contractValue ?? 0;
						const progressColor = getProgressColor(progress);
						return (
							<Link
								key={project.id}
								href={`/app/${organizationSlug}/projects/${project.id}`}
								className={cn(
									"flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
									idx < Math.min(projects.length, 3) - 1 &&
										"border-b border-gray-50 dark:border-gray-800/50",
								)}
							>
								{progress === 0 ? (
									<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[9px] font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
										{t("dashboard.projects.new")}
									</span>
								) : (
									<CircleProgress
										percentage={progress}
										size={32}
										color={progressColor}
									/>
								)}
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-semibold text-foreground">
										{project.name ||
											t("projects.unnamed")}
									</p>
									<p className="text-[11px] text-gray-400">
										<Currency amount={contractValue} />
									</p>
								</div>
								{progress > 0 && (
									<span
										className={cn(
											"shrink-0 text-sm font-black",
											getProgressTextClass(progress),
										)}
									>
										{progress}%
									</span>
								)}
								<Badge className="shrink-0 rounded-full border-0 bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">
									{t(`projects.status.${project.status}`)}
								</Badge>
							</Link>
						);
					})}
				</div>
			)}

			{/* Dashed separator */}
			<div className="my-2 border-t border-dashed border-gray-100 dark:border-gray-800" />

			{/* ── Suggested Actions / Tips ── */}
			<div className="min-h-0 flex-1">
				<div className="mb-3 flex items-center gap-2">
					<div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
						<Lightbulb className="h-3 w-3 text-amber-500" />
					</div>
					<h3 className="text-sm font-bold text-foreground">
						{t("dashboard.suggestedActions.title")}
					</h3>
				</div>

				{suggestedActions.length === 0 ? (
					<DashboardTips organizationSlug={organizationSlug} />
				) : (
					<div className="space-y-2">
						{suggestedActions.map((action) => {
							const ActionIcon = action.icon;
							return (
								<Link
									key={action.id}
									href={action.href}
									className={cn(
										"flex items-center gap-3 rounded-xl border p-2.5 transition-all hover:-translate-x-0.5 hover:shadow-sm",
										action.priority === "hot" &&
											"border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10",
										action.priority === "warm" &&
											"border-orange-200 bg-orange-50/50 dark:border-orange-900/30 dark:bg-orange-950/10",
										action.priority === "normal" &&
											"border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/10",
									)}
								>
									<div
										className={cn(
											"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
											action.bgColor,
										)}
									>
										<ActionIcon
											className={cn(
												"h-3.5 w-3.5",
												action.iconColor,
											)}
										/>
									</div>
									<span className="flex-1 text-xs font-medium text-foreground/80">
										{action.text}
									</span>
									<span className="shrink-0 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
										{action.buttonLabel}
									</span>
								</Link>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
