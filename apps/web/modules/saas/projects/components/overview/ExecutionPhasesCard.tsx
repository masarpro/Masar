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

	// Health summary is only a fallback for projects with zero milestones —
	// when milestones exist every figure is derived from them, so skip the
	// extra round-trip in the common case.
	const { data: healthData } = useQuery(
		orpc.projectTimeline.getHealth.queryOptions({
			input: { organizationId, projectId },
			enabled:
				milestonesData !== undefined &&
				(milestonesData?.milestones ?? []).length === 0,
		}),
	);

	const milestones = milestonesData?.milestones ?? [];
	const health = healthData?.health;

	// Single source of truth: all values derived from milestones for consistency
	const totalMilestones = milestones.length;
	const completedCount = milestones.filter(
		(m: any) => m.status === "COMPLETED",
	).length;
	const inProgressCount = milestones.filter(
		(m: any) => m.status === "IN_PROGRESS" || m.status === "DELAYED",
	).length;
	const notStartedCount = milestones.filter(
		(m: any) => m.status === "PLANNED",
	).length;

	// Status breakdown percentages (must sum to 100)
	const completedPct =
		totalMilestones > 0
			? Math.round((completedCount / totalMilestones) * 100)
			: 0;
	const inProgressPct =
		totalMilestones > 0
			? Math.round((inProgressCount / totalMilestones) * 100)
			: 0;
	const notStartedPct =
		totalMilestones > 0
			? Math.max(0, 100 - completedPct - inProgressPct)
			: 0;

	// Overall progress: derive from milestones when available (avg of progress bars)
	const overallProgress =
		totalMilestones > 0
			? Math.round(
					milestones.reduce((sum: any, m: any) => sum + Number(m.progress ?? 0), 0) /
						totalMilestones,
				)
			: health?.overallProgress ?? projectProgress ?? 0;

	// Donut SVG calculations (completed + inProgress + notStarted = 100%)
	const radius = 42;
	const circumference = 2 * Math.PI * radius;
	const completedDash = (completedPct / 100) * circumference;
	const inProgressDash = (inProgressPct / 100) * circumference;
	const notStartedDash = (notStartedPct / 100) * circumference;

	// Health stats: derive from milestones when available for consistency
	const onTrackCount =
		totalMilestones > 0
			? milestones.filter((m: any) => m.healthStatus === "ON_TRACK").length
			: health?.onTrack ?? 0;
	const atRiskCount =
		totalMilestones > 0
			? milestones.filter((m: any) => m.healthStatus === "AT_RISK").length
			: health?.atRisk ?? 0;
	const delayedCount =
		totalMilestones > 0
			? milestones.filter((m: any) => m.healthStatus === "DELAYED").length
			: health?.delayed ?? 0;

	// Milestone status → dot color
	function getStatusDotColor(status: string): string {
		switch (status) {
			case "COMPLETED":
				return "bg-chart-4";
			case "IN_PROGRESS":
				return "bg-chart-4";
			case "DELAYED":
				return "bg-destructive";
			default:
				return "bg-muted-foreground/40";
		}
	}

	// Milestone status → progress bar color
	function getBarColor(status: string): string {
		switch (status) {
			case "COMPLETED":
				return "bg-chart-4";
			case "IN_PROGRESS":
				return "bg-chart-4";
			case "DELAYED":
				return "bg-destructive";
			default:
				return "bg-muted";
		}
	}

	// Header status badge
	const statusMap: Record<
		string,
		{ label: string; bgClass: string; textClass: string; dotClass: string }
	> = {
		ACTIVE: {
			label: t("projects.commandCenter.active"),
			bgClass: "bg-chart-4/15 dark:bg-chart-4/20",
			textClass: "text-chart-4 dark:text-chart-4",
			dotClass: "bg-chart-4",
		},
		ON_HOLD: {
			label: t("projects.commandCenter.atRisk"),
			bgClass: "bg-chart-1/15",
			textClass: "text-chart-1",
			dotClass: "bg-chart-1",
		},
		COMPLETED: {
			label: t("projects.commandCenter.completedLabel"),
			bgClass: "bg-chart-4/15 dark:bg-chart-4/20",
			textClass: "text-chart-4 dark:text-chart-4",
			dotClass: "bg-chart-4",
		},
	};
	const statusStyle = statusMap[projectStatus] ?? statusMap.ACTIVE;

	// Loading state
	if (milestonesLoading) {
		return (
			<div className="flex flex-col items-center justify-center overflow-hidden rounded-2xl border-2 bg-card py-20">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="flex flex-col overflow-hidden rounded-2xl border-2 bg-card">
			{/* Header */}
			<div className="flex items-center justify-between border-b-2 px-5 py-3.5">
				<div className="flex items-center gap-2">
					<div className="flex h-[30px] w-[30px] items-center justify-center rounded-xl bg-chart-4/15">
						<BarChart3 className="h-4 w-4 text-chart-4" />
					</div>
					<h3 className="text-[15px] font-semibold text-card-foreground">
						{t("projects.commandCenter.executionAndPhases")}
					</h3>
				</div>
				<span
					className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle.bgClass} ${statusStyle.textClass}`}
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
								className="stroke-muted"
								strokeWidth="12"
							/>
							{completedPct > 0 && (
								<circle
									cx="55"
									cy="55"
									r={radius}
									fill="none"
									stroke="var(--chart-5)"
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
									stroke="var(--chart-4)"
									strokeWidth="12"
									strokeDasharray={`${inProgressDash} ${circumference - inProgressDash}`}
									strokeDashoffset={-completedDash}
									strokeLinecap="round"
								/>
							)}
							{notStartedPct > 0 && (
								<circle
									cx="55"
									cy="55"
									r={radius}
									fill="none"
									stroke="var(--border)"
									strokeWidth="12"
									strokeDasharray={`${notStartedDash} ${circumference - notStartedDash}`}
									strokeDashoffset={-(completedDash + inProgressDash)}
									strokeLinecap="round"
								/>
							)}
						</svg>
						<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
							<div className="text-2xl font-bold text-card-foreground">
								{overallProgress}%
							</div>
							<div className="text-[10px] text-muted-foreground">
								{t("projects.commandCenter.achievement")}
							</div>
						</div>
					</div>

					{/* Legend */}
					<div className="flex flex-1 flex-col gap-1.5">
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<span className="h-2 w-2 shrink-0 rounded-sm bg-chart-5" />
							{t("projects.commandCenter.completedLabel")}
							<span
								className="ms-auto text-[13px] font-bold text-card-foreground"
								dir="ltr"
							>
								{completedPct}%
							</span>
						</div>
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<span className="h-2 w-2 shrink-0 rounded-sm bg-chart-4" />
							{t("projects.commandCenter.inProgressLabel")}
							<span
								className="ms-auto text-[13px] font-bold text-card-foreground"
								dir="ltr"
							>
								{inProgressPct}%
							</span>
						</div>
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<span className="h-2 w-2 shrink-0 rounded-sm bg-border" />
							{t("projects.commandCenter.notStartedLabel")}
							<span
								className="ms-auto text-[13px] font-bold text-card-foreground"
								dir="ltr"
							>
								{notStartedPct}%
							</span>
						</div>
						<div className="my-0.5 h-px bg-border" />
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<span className="h-2 w-2 shrink-0 rounded-full bg-chart-4" />
							{t("projects.commandCenter.completedLabel")}:{" "}
							{completedCount}/{totalMilestones}
							<span className="ms-auto text-[13px] text-muted-foreground">
								{t("projects.commandCenter.phasesLabel")}
							</span>
						</div>
					</div>
				</div>

				{/* Milestones List */}
				{totalMilestones > 0 ? (
					<div>
						<div className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
							{t("projects.commandCenter.executionPhases")}
						</div>
						<div className="flex flex-col gap-1.5">
							{milestones.map((milestone: any) => (
								<div
									key={milestone.id}
									className="flex items-center gap-2 rounded-lg border bg-muted/50 px-2.5 py-[7px]"
								>
									<span
										className={`h-1.5 w-1.5 shrink-0 rounded-full ${getStatusDotColor(milestone.status)}`}
									/>
									<span className="flex-1 truncate text-xs font-medium text-card-foreground">
										{milestone.title}
									</span>
									<div className="h-[5px] w-14 shrink-0 overflow-hidden rounded-full bg-muted">
										<div
											className={`h-full rounded-full ${getBarColor(milestone.status)}`}
											style={{
												width: `${Number(milestone.progress)}%`,
											}}
										/>
									</div>
									<span
										className="w-7 shrink-0 text-start text-[11px] font-semibold text-muted-foreground"
										dir="ltr"
									>
										{Math.round(Number(milestone.progress))}%
									</span>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="flex flex-1 flex-col items-center justify-center gap-2 py-4">
						<Clock className="h-8 w-8 text-muted-foreground/50" />
						<p className="text-[13px] text-muted-foreground">
							{t("projects.commandCenter.noMilestones")}
						</p>
					</div>
				)}
			</div>

			{/* Footer - Health Chips */}
			<div className="flex flex-wrap gap-1.5 border-t-2 px-5 py-3">
				{onTrackCount > 0 && (
					<span className="inline-flex items-center gap-1 rounded-full bg-chart-4/15 px-2.5 py-1 text-[11px] font-semibold text-chart-4">
						<CheckCircle2 className="h-3 w-3" />
						{onTrackCount} {t("projects.commandCenter.onTrack")}
					</span>
				)}
				{atRiskCount > 0 && (
					<span className="inline-flex items-center gap-1 rounded-full bg-chart-1/15 px-2.5 py-1 text-[11px] font-semibold text-chart-1">
						<AlertTriangle className="h-3 w-3" />
						{atRiskCount} {t("projects.commandCenter.atRiskCount")}
					</span>
				)}
				{delayedCount > 0 && (
					<span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-semibold text-destructive">
						<AlertTriangle className="h-3 w-3" />
						{delayedCount}{" "}
						{t("projects.commandCenter.delayed")}
					</span>
				)}
				{totalMilestones === 0 && (
					<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
						{t("projects.commandCenter.noMilestones")}
					</span>
				)}
			</div>
		</div>
	);
}
