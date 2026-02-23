"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	AlertTriangle,
	BarChart3,
	CheckCircle2,
	Clock,
	Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface ExecutionPhasesCardProps {
	organizationId: string;
	projectId: string;
	projectProgress?: number;
	projectStatus?: string;
}

export function ExecutionPhasesCard({
	organizationId,
	projectId,
	projectProgress = 0,
	projectStatus = "ACTIVE",
}: ExecutionPhasesCardProps) {
	const t = useTranslations();

	// Fetch milestones from execution section
	const { data: milestonesData, isLoading: milestonesLoading } = useQuery(
		orpc.projectTimeline.listMilestones.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Fetch timeline health summary
	const { data: healthData } = useQuery(
		orpc.projectTimeline.getHealth.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const milestones = milestonesData?.milestones ?? [];
	const health = healthData?.health;

	// Calculate percentages from milestone statuses
	const totalMilestones = milestones.length;
	const completedCount = milestones.filter(
		(m) => m.status === "COMPLETED",
	).length;
	const inProgressCount = milestones.filter(
		(m) => m.status === "IN_PROGRESS" || m.status === "DELAYED",
	).length;
	const notStartedCount = milestones.filter(
		(m) => m.status === "PLANNED",
	).length;

	const completedPct =
		totalMilestones > 0
			? Math.round((completedCount / totalMilestones) * 100)
			: 0;
	const inProgressPct =
		totalMilestones > 0
			? Math.round((inProgressCount / totalMilestones) * 100)
			: 0;
	const notStartedPct = Math.max(0, 100 - completedPct - inProgressPct);

	// Overall progress from health API or fallback to project progress
	const overallProgress = health?.overallProgress ?? projectProgress ?? 0;

	// Donut SVG calculations
	const radius = 42;
	const circumference = 2 * Math.PI * radius;
	const completedDash = (completedPct / 100) * circumference;
	const inProgressDash = (inProgressPct / 100) * circumference;

	// Health stats from API
	const onTrackCount = health?.onTrack ?? 0;
	const atRiskCount = health?.atRisk ?? 0;
	const delayedCount = health?.delayed ?? 0;

	// Milestone status → dot color
	function getStatusDotColor(status: string): string {
		switch (status) {
			case "COMPLETED":
				return "bg-emerald-500";
			case "IN_PROGRESS":
				return "bg-blue-500";
			case "DELAYED":
				return "bg-red-500";
			default:
				return "bg-slate-300 dark:bg-slate-600";
		}
	}

	// Milestone status → progress bar color
	function getBarColor(status: string): string {
		switch (status) {
			case "COMPLETED":
				return "bg-emerald-500";
			case "IN_PROGRESS":
				return "bg-blue-500";
			case "DELAYED":
				return "bg-red-500";
			default:
				return "bg-slate-200 dark:bg-slate-700";
		}
	}

	// Header status badge
	const statusMap: Record<
		string,
		{ label: string; bgClass: string; textClass: string; dotClass: string }
	> = {
		ACTIVE: {
			label: t("projects.commandCenter.active"),
			bgClass: "bg-emerald-50 dark:bg-emerald-900/30",
			textClass: "text-emerald-700 dark:text-emerald-400",
			dotClass: "bg-emerald-500",
		},
		ON_HOLD: {
			label: t("projects.commandCenter.atRisk"),
			bgClass: "bg-amber-50 dark:bg-amber-900/30",
			textClass: "text-amber-700 dark:text-amber-400",
			dotClass: "bg-amber-500",
		},
		COMPLETED: {
			label: t("projects.commandCenter.completedLabel"),
			bgClass: "bg-blue-50 dark:bg-blue-900/30",
			textClass: "text-blue-700 dark:text-blue-400",
			dotClass: "bg-blue-500",
		},
	};
	const statusStyle = statusMap[projectStatus] ?? statusMap.ACTIVE;

	// Loading state
	if (milestonesLoading) {
		return (
			<div className="flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-slate-200/60 bg-white py-20 shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
				<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
			</div>
		);
	}

	return (
		<div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
				<div className="flex items-center gap-2">
					<div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/40">
						<BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</div>
					<h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
						{t("projects.commandCenter.executionAndPhases")}
					</h3>
				</div>
				<span
					className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyle.bgClass} ${statusStyle.textClass}`}
				>
					<span
						className={`h-1.5 w-1.5 rounded-full ${statusStyle.dotClass}`}
					/>
					{statusStyle.label}
				</span>
			</div>

			{/* Body */}
			<div className="flex flex-1 flex-col gap-3.5 p-5">
				{/* Donut + Legend Row */}
				<div className="flex items-center gap-4">
					{/* Donut Chart */}
					<div className="relative h-[110px] w-[110px] shrink-0">
						<svg
							width="110"
							height="110"
							viewBox="0 0 110 110"
							className="-rotate-90"
						>
							<circle
								cx="55"
								cy="55"
								r={radius}
								fill="none"
								className="stroke-slate-100 dark:stroke-slate-800"
								strokeWidth="12"
							/>
							{completedPct > 0 && (
								<circle
									cx="55"
									cy="55"
									r={radius}
									fill="none"
									stroke="#22C55E"
									strokeWidth="12"
									strokeDasharray={`${completedDash} ${circumference - completedDash}`}
									strokeDashoffset={0}
									strokeLinecap="round"
								/>
							)}
							{inProgressPct > 0 && (
								<circle
									cx="55"
									cy="55"
									r={radius}
									fill="none"
									stroke="#3B82F6"
									strokeWidth="12"
									strokeDasharray={`${inProgressDash} ${circumference - inProgressDash}`}
									strokeDashoffset={-completedDash}
									strokeLinecap="round"
								/>
							)}
						</svg>
						<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
							<div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
								{overallProgress}%
							</div>
							<div className="text-[9px] text-slate-400">
								{t("projects.commandCenter.achievement")}
							</div>
						</div>
					</div>

					{/* Legend */}
					<div className="flex flex-1 flex-col gap-1.5">
						<div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
							<span className="h-2 w-2 shrink-0 rounded-sm bg-emerald-500" />
							{t("projects.commandCenter.completedLabel")}
							<span
								className="mr-auto text-xs font-bold text-slate-800 dark:text-slate-200"
								dir="ltr"
							>
								{completedPct}%
							</span>
						</div>
						<div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
							<span className="h-2 w-2 shrink-0 rounded-sm bg-blue-500" />
							{t("projects.commandCenter.inProgressLabel")}
							<span
								className="mr-auto text-xs font-bold text-slate-800 dark:text-slate-200"
								dir="ltr"
							>
								{inProgressPct}%
							</span>
						</div>
						<div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
							<span className="h-2 w-2 shrink-0 rounded-sm bg-slate-200 dark:bg-slate-600" />
							{t("projects.commandCenter.notStartedLabel")}
							<span
								className="mr-auto text-xs font-bold text-slate-800 dark:text-slate-200"
								dir="ltr"
							>
								{notStartedPct}%
							</span>
						</div>
						<div className="my-0.5 h-px bg-slate-100 dark:bg-slate-800" />
						<div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
							<span className="h-2 w-2 shrink-0 rounded-full bg-violet-500" />
							{t("projects.commandCenter.completedLabel")}:{" "}
							{completedCount}/{totalMilestones}
							<span className="mr-auto text-xs text-slate-400">
								{t("projects.commandCenter.phasesLabel")}
							</span>
						</div>
					</div>
				</div>

				{/* Milestones List */}
				{totalMilestones > 0 ? (
					<div>
						<div className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-400">
							{t("projects.commandCenter.executionPhases")}
						</div>
						<div className="flex flex-col gap-1.5">
							{milestones.map((milestone) => (
								<div
									key={milestone.id}
									className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-[7px] dark:border-slate-800 dark:bg-slate-800/50"
								>
									<span
										className={`h-1.5 w-1.5 shrink-0 rounded-full ${getStatusDotColor(milestone.status)}`}
									/>
									<span className="flex-1 truncate text-[11px] font-medium text-slate-700 dark:text-slate-300">
										{milestone.title}
									</span>
									<div className="h-[5px] w-14 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
										<div
											className={`h-full rounded-full ${getBarColor(milestone.status)}`}
											style={{
												width: `${milestone.progress}%`,
											}}
										/>
									</div>
									<span
										className="w-7 shrink-0 text-left text-[10px] font-semibold text-slate-500 dark:text-slate-400"
										dir="ltr"
									>
										{Math.round(milestone.progress)}%
									</span>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="flex flex-1 flex-col items-center justify-center gap-2 py-4">
						<Clock className="h-8 w-8 text-slate-300 dark:text-slate-600" />
						<p className="text-xs text-slate-400">
							{t("projects.commandCenter.noMilestones")}
						</p>
					</div>
				)}
			</div>

			{/* Footer - Health Chips */}
			<div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-5 py-3 dark:border-slate-800">
				{onTrackCount > 0 && (
					<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
						<CheckCircle2 className="h-3 w-3" />
						{onTrackCount} {t("projects.commandCenter.onTrack")}
					</span>
				)}
				{atRiskCount > 0 && (
					<span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
						<AlertTriangle className="h-3 w-3" />
						{atRiskCount} {t("projects.commandCenter.atRiskCount")}
					</span>
				)}
				{delayedCount > 0 && (
					<span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
						<AlertTriangle className="h-3 w-3" />
						{delayedCount}{" "}
						{t("projects.commandCenter.delayed")}
					</span>
				)}
				{totalMilestones === 0 && (
					<span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
						{t("projects.commandCenter.noMilestones")}
					</span>
				)}
			</div>
		</div>
	);
}
