"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@ui/components/progress";
import {
	AlertTriangle,
	Camera,
	Clock,
	FileText,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DailyReportCard } from "./DailyReportCard";
import { IssueCard } from "./IssueCard";
import { PhotoGrid } from "./PhotoGrid";
import { ProgressUpdateForm } from "../forms/ProgressUpdateForm";

interface FieldTimelineProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

function formatDate(date: Date | string): string {
	return new Intl.DateTimeFormat("ar-SA", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(date));
}

export function FieldTimeline({
	organizationId,
	organizationSlug,
	projectId,
}: FieldTimelineProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const [showProgressForm, setShowProgressForm] = useState(false);

	const { data, isLoading } = useQuery(
		orpc.projectField.getTimeline.queryOptions({
			input: {
				organizationId,
				projectId,
				limit: 50,
			},
		}),
	);

	const { data: project } = useQuery(
		orpc.projects.getById.queryOptions({
			input: {
				id: projectId,
				organizationId,
			},
		}),
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	const timeline = data?.timeline ?? [];
	const currentProgress = project?.progress ?? 0;

	// Quick action buttons
	const quickActions = [
		{
			label: t("projects.field.newReport"),
			icon: FileText,
			href: `${basePath}/execution/new-report`,
			color: "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
		},
		{
			label: t("projects.field.uploadPhoto"),
			icon: Camera,
			href: `${basePath}/execution/upload`,
			color: "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400",
		},
		{
			label: t("projects.field.newIssue"),
			icon: AlertTriangle,
			href: `${basePath}/execution/new-issue`,
			color: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400",
		},
	];

	return (
		<div className="space-y-6">
			{/* Quick Actions */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
				{quickActions.map((action) => (
					<Link key={action.label} href={action.href}>
						<div
							className={`flex items-center gap-3 rounded-xl p-4 transition-colors ${action.color}`}
						>
							<action.icon className="h-5 w-5" />
							<span className="text-sm font-medium">{action.label}</span>
						</div>
					</Link>
				))}
				<button
					type="button"
					onClick={() => setShowProgressForm(!showProgressForm)}
					className="flex items-center gap-3 rounded-xl p-4 transition-colors bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400"
				>
					<TrendingUp className="h-5 w-5" />
					<span className="text-sm font-medium">
						{t("projects.field.updateProgress")}
					</span>
				</button>
			</div>

			{/* Progress Card */}
			<div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
				<div className="mb-3 flex items-center justify-between">
					<span className="text-sm font-medium text-slate-600 dark:text-slate-400">
						{t("projects.field.currentProgress")}
					</span>
					<span className="text-3xl font-bold text-teal-600 dark:text-teal-400">
						{Math.round(currentProgress)}%
					</span>
				</div>
				<Progress value={currentProgress} className="h-4" />
			</div>

			{/* Progress Update Form (Collapsible) */}
			{showProgressForm && (
				<div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
					<h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
						{t("projects.field.updateProgress")}
					</h2>
					<ProgressUpdateForm
						organizationId={organizationId}
						projectId={projectId}
						currentProgress={currentProgress}
						onSuccess={() => setShowProgressForm(false)}
					/>
				</div>
			)}

			{/* Timeline */}
			<div className="space-y-4">
				<h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
					{t("projects.field.timeline")}
				</h2>

				{timeline.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/50">
						<Clock className="mx-auto h-12 w-12 text-slate-400" />
						<p className="mt-4 text-lg font-medium text-slate-600 dark:text-slate-400">
							{t("projects.field.noActivities")}
						</p>
						<p className="mt-2 text-sm text-slate-500">
							{t("projects.field.startAdding")}
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{timeline.map((item, index) => (
							<TimelineItem key={`${item.type}-${item.data.id}`} item={item} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function TimelineItem({
	item,
}: {
	item: {
		type: "report" | "photo" | "issue" | "progress";
		data: Record<string, unknown>;
		createdAt: Date;
	};
}) {
	const t = useTranslations();

	switch (item.type) {
		case "report":
			return <DailyReportCard report={item.data} />;
		case "photo":
			return (
				<div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
					<div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
						<Camera className="h-4 w-4" />
						<span>{t("projects.field.photoUploaded")}</span>
						<span className="text-slate-400">•</span>
						<span>{formatDate(item.createdAt)}</span>
					</div>
					<PhotoGrid photos={[item.data]} />
				</div>
			);
		case "issue":
			return <IssueCard issue={item.data} />;
		case "progress":
			return (
				<div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-teal-100 p-2.5 dark:bg-teal-900/50">
							<TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
						</div>
						<div className="flex-1">
							<p className="font-medium text-slate-900 dark:text-slate-100">
								{t("projects.field.progressUpdated")}
							</p>
							<p className="text-sm text-slate-500">
								{(item.data as { progress: number }).progress}% -{" "}
								{(item.data as { phaseLabel?: string }).phaseLabel ||
									t("projects.field.noPhase")}
							</p>
						</div>
						<div className="text-right text-sm text-slate-500">
							{formatDate(item.createdAt)}
						</div>
					</div>
					{(item.data as { note?: string }).note && (
						<p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
							{(item.data as { note: string }).note}
						</p>
					)}
				</div>
			);
		default:
			return null;
	}
}
