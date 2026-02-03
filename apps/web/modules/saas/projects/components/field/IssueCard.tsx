"use client";

import { Badge } from "@ui/components/badge";
import { AlertTriangle, Clock, User } from "lucide-react";
import { useTranslations } from "next-intl";

interface IssueCardProps {
	issue: Record<string, unknown>;
}

function formatDate(date: Date | string | undefined | null): string {
	if (!date) return "-";
	return new Intl.DateTimeFormat("ar-SA", {
		day: "numeric",
		month: "short",
	}).format(new Date(date));
}

function getSeverityColor(severity: string) {
	switch (severity) {
		case "LOW":
			return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
		case "MEDIUM":
			return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
		case "HIGH":
			return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
		case "CRITICAL":
			return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
		default:
			return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
	}
}

function getStatusColor(status: string) {
	switch (status) {
		case "OPEN":
			return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
		case "IN_PROGRESS":
			return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
		case "RESOLVED":
			return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
		case "CLOSED":
			return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
		default:
			return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
	}
}

export function IssueCard({ issue }: IssueCardProps) {
	const t = useTranslations();

	const title = issue.title as string;
	const description = issue.description as string;
	const severity = issue.severity as string;
	const status = issue.status as string;
	const dueDate = issue.dueDate as string | undefined;
	const assignee = issue.assignee as { name: string; image?: string } | null;
	const createdBy = issue.createdBy as { name: string };
	const createdAt = issue.createdAt as string;

	return (
		<div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
			{/* Header */}
			<div className="mb-3 flex items-start justify-between">
				<div className="flex items-center gap-2">
					<div className="rounded-xl bg-red-100 p-2 dark:bg-red-900/30">
						<AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
					</div>
					<div>
						<h3 className="font-semibold text-slate-900 dark:text-slate-100">
							{title}
						</h3>
						<p className="text-xs text-slate-500">
							{createdBy?.name} • {formatDate(createdAt)}
						</p>
					</div>
				</div>
				<div className="flex gap-2">
					<Badge variant="secondary" className={getSeverityColor(severity)}>
						{t(`projects.field.severity.${severity}`)}
					</Badge>
					<Badge variant="secondary" className={getStatusColor(status)}>
						{t(`projects.field.issueStatus.${status}`)}
					</Badge>
				</div>
			</div>

			{/* Description */}
			<p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
				{description}
			</p>

			{/* Footer */}
			<div className="flex items-center justify-between text-sm text-slate-500">
				{assignee ? (
					<div className="flex items-center gap-1">
						<User className="h-4 w-4" />
						<span>{assignee.name}</span>
					</div>
				) : (
					<span className="text-slate-400">
						{t("projects.field.notAssigned")}
					</span>
				)}
				{dueDate && (
					<div className="flex items-center gap-1">
						<Clock className="h-4 w-4" />
						<span>{formatDate(dueDate)}</span>
					</div>
				)}
			</div>
		</div>
	);
}
