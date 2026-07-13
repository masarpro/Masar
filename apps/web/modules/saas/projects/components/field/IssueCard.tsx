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
			return "bg-muted text-muted-foreground";
		case "MEDIUM":
			return "bg-chart-1/15 text-chart-1 dark:bg-chart-1/20 dark:text-chart-1";
		case "HIGH":
			return "bg-chart-2/15 text-chart-2 dark:bg-chart-2/20 dark:text-chart-2";
		case "CRITICAL":
			return "bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive";
		default:
			return "bg-muted text-muted-foreground";
	}
}

function getStatusColor(status: string) {
	switch (status) {
		case "OPEN":
			return "bg-destructive/15 text-destructive dark:bg-destructive/20 dark:text-destructive";
		case "IN_PROGRESS":
			return "bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4";
		case "RESOLVED":
			return "bg-success/15 text-success dark:bg-success/20 dark:text-success";
		case "CLOSED":
			return "bg-muted text-muted-foreground";
		default:
			return "bg-muted text-muted-foreground";
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
		<div className="rounded-2xl border-2 bg-card p-5">
			{/* Header */}
			<div className="mb-3 flex items-start justify-between">
				<div className="flex items-center gap-2">
					<div className="rounded-xl bg-destructive/15 p-2">
						<AlertTriangle className="h-4 w-4 text-destructive" />
					</div>
					<div>
						<h3 className="font-semibold text-card-foreground">
							{title}
						</h3>
						<p className="text-xs text-muted-foreground">
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
			<p className="mb-4 text-sm text-muted-foreground">
				{description}
			</p>

			{/* Footer */}
			<div className="flex items-center justify-between text-sm text-muted-foreground">
				{assignee ? (
					<div className="flex items-center gap-1">
						<User className="h-4 w-4" />
						<span>{assignee.name}</span>
					</div>
				) : (
					<span className="text-muted-foreground">
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
