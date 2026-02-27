"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	AlertTriangleIcon,
	CalendarIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	EditIcon,
	MoreVerticalIcon,
	PlayIcon,
	CheckIcon,
	TrashIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ExecutionMilestone } from "../../lib/execution-types";

interface MilestoneCardHeaderProps {
	milestone: ExecutionMilestone;
	isExpanded: boolean;
	onToggleExpand: () => void;
	onStart?: () => void;
	onComplete?: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
	isLoading?: boolean;
}

function StatusBadge({ status }: { status: ExecutionMilestone["status"] }) {
	const t = useTranslations();

	const variants: Record<string, { className: string; label: string }> = {
		PLANNED: {
			className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
			label: t("timeline.status.planned"),
		},
		IN_PROGRESS: {
			className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
			label: t("timeline.status.inProgress"),
		},
		COMPLETED: {
			className: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
			label: t("timeline.status.completed"),
		},
		DELAYED: {
			className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
			label: t("timeline.status.delayed"),
		},
		CANCELLED: {
			className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
			label: t("execution.milestone.cancelled"),
		},
	};

	const v = variants[status] ?? variants.PLANNED;

	return (
		<Badge variant="secondary" className={v.className}>
			{v.label}
		</Badge>
	);
}

function formatDate(date: Date | string | null | undefined): string {
	if (!date) return "-";
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("ar-SA", {
		month: "short",
		day: "numeric",
	});
}

export function MilestoneCardHeader({
	milestone,
	isExpanded,
	onToggleExpand,
	onStart,
	onComplete,
	onEdit,
	onDelete,
	isLoading,
}: MilestoneCardHeaderProps) {
	const t = useTranslations();

	const canStart = milestone.status === "PLANNED";
	const canComplete =
		milestone.status === "IN_PROGRESS" || milestone.status === "DELAYED";

	// Calculate delay
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	let daysInfo: { text: string; isOverdue: boolean } | null = null;
	if (milestone.plannedEnd && milestone.status !== "COMPLETED" && milestone.status !== "CANCELLED") {
		const end = new Date(milestone.plannedEnd);
		end.setHours(0, 0, 0, 0);
		const diffDays = Math.ceil(
			(end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
		);
		if (diffDays < 0) {
			daysInfo = {
				text: t("execution.milestone.daysOverdue", { days: Math.abs(diffDays) }),
				isOverdue: true,
			};
		} else {
			daysInfo = {
				text: t("execution.milestone.daysLeft", { days: diffDays }),
				isOverdue: false,
			};
		}
	}

	return (
		<div className="flex items-start justify-between gap-3">
			<div
				className="flex-1 min-w-0 cursor-pointer"
				onClick={onToggleExpand}
			>
				<div className="flex items-center gap-2 flex-wrap">
					<button type="button" className="p-0.5">
						{isExpanded ? (
							<ChevronUpIcon className="h-4 w-4 text-muted-foreground" />
						) : (
							<ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
						)}
					</button>
					<h3 className="font-semibold text-base truncate">
						{milestone.title}
					</h3>
					{milestone.isCritical && (
						<AlertTriangleIcon className="h-4 w-4 text-orange-500" />
					)}
					<StatusBadge status={milestone.status} />
					{daysInfo && (
						<span
							className={`text-xs font-medium ${daysInfo.isOverdue ? "text-red-600" : "text-muted-foreground"}`}
						>
							{daysInfo.text}
						</span>
					)}
				</div>
				{(milestone.plannedStart || milestone.plannedEnd) && (
					<div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground ms-6">
						<CalendarIcon className="h-3 w-3" />
						<span>
							{formatDate(milestone.plannedStart)} –{" "}
							{formatDate(milestone.plannedEnd)}
						</span>
					</div>
				)}
			</div>

			<div className="flex items-center gap-1.5 shrink-0">
				{canStart && onStart && (
					<Button
						size="sm"
						variant="outline"
						onClick={onStart}
						disabled={isLoading}
						className="h-7 text-xs"
					>
						<PlayIcon className="h-3 w-3 me-1" />
						{t("timeline.actions.start")}
					</Button>
				)}

				{canComplete && onComplete && (
					<Button
						size="sm"
						onClick={onComplete}
						disabled={isLoading}
						className="h-7 text-xs"
					>
						<CheckIcon className="h-3 w-3 me-1" />
						{t("timeline.actions.complete")}
					</Button>
				)}

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-7 w-7">
							<MoreVerticalIcon className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						{onEdit && (
							<DropdownMenuItem onClick={onEdit}>
								<EditIcon className="h-4 w-4 me-2" />
								{t("timeline.actions.edit")}
							</DropdownMenuItem>
						)}
						{onDelete && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={onDelete}
									className="text-destructive"
								>
									<TrashIcon className="h-4 w-4 me-2" />
									{t("timeline.actions.delete")}
								</DropdownMenuItem>
							</>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}
