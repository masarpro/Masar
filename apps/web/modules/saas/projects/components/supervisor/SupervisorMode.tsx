"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@ui/components/progress";
import {
	AlertTriangle,
	Camera,
	FileText,
	Home,
	TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ProgressUpdateForm } from "../forms/ProgressUpdateForm";

interface SupervisorModeProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function SupervisorMode({
	organizationId,
	organizationSlug,
	projectId,
}: SupervisorModeProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/projects/${projectId}`;
	const [showProgressForm, setShowProgressForm] = useState(false);

	const { data: project, isLoading } = useQuery(
		orpc.projects.getById.queryOptions({
			input: {
				id: projectId,
				organizationId,
			},
		}),
	);

	if (isLoading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="relative">
					<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
					<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			</div>
		);
	}

	const currentProgress = project?.progress ?? 0;

	// 5 main supervisor buttons
	const supervisorActions = [
		{
			label: t("projects.supervisor.dailyReport"),
			icon: FileText,
			href: `${basePath}/field/new-report`,
			color: "bg-blue-500 hover:bg-blue-600",
			size: "large",
		},
		{
			label: t("projects.supervisor.uploadPhoto"),
			icon: Camera,
			href: `${basePath}/field/upload`,
			color: "bg-green-500 hover:bg-green-600",
			size: "large",
		},
		{
			label: t("projects.supervisor.reportIssue"),
			icon: AlertTriangle,
			href: `${basePath}/field/new-issue`,
			color: "bg-red-500 hover:bg-red-600",
			size: "large",
		},
		{
			label: t("projects.supervisor.updateProgress"),
			icon: TrendingUp,
			href: "#progress",
			color: "bg-amber-500 hover:bg-amber-600",
			size: "large",
			onClick: () => setShowProgressForm(!showProgressForm),
		},
		{
			label: t("projects.supervisor.backToProject"),
			icon: Home,
			href: basePath,
			color: "bg-slate-500 hover:bg-slate-600",
			size: "small",
		},
	];

	return (
		<div className="space-y-4">
			{/* Progress Card */}
			<div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
				<div className="mb-3 flex items-center justify-between">
					<span className="text-sm font-medium text-slate-600 dark:text-slate-400">
						{t("projects.supervisor.currentProgress")}
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
						{t("projects.supervisor.updateProgress")}
					</h2>
					<ProgressUpdateForm
						organizationId={organizationId}
						projectId={projectId}
						currentProgress={currentProgress}
						onSuccess={() => setShowProgressForm(false)}
					/>
				</div>
			)}

			{/* Main Action Buttons - Mobile-first grid */}
			<div className="grid grid-cols-2 gap-4">
					{supervisorActions.slice(0, 4).map((action) =>
						action.onClick ? (
							<button
								key={action.label}
								onClick={action.onClick}
								className={`flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl p-6 text-white shadow-lg transition-transform active:scale-95 ${action.color}`}
							>
								<action.icon className="h-10 w-10" />
								<span className="text-center text-sm font-medium">
									{action.label}
								</span>
							</button>
						) : (
							<Link key={action.label} href={action.href}>
								<div
									className={`flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl p-6 text-white shadow-lg transition-transform active:scale-95 ${action.color}`}
								>
									<action.icon className="h-10 w-10" />
									<span className="text-center text-sm font-medium">
										{action.label}
									</span>
								</div>
							</Link>
						),
					)}
				</div>

			{/* Field Timeline Link */}
			<Link href={`${basePath}/field`} className="col-span-2">
				<div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-900 hover:border-primary/50">
					<span className="text-sm text-slate-600 dark:text-slate-400">
						{t("projects.supervisor.viewTimeline")} →
					</span>
				</div>
			</Link>
		</div>
	);
}
