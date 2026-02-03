"use client";

import { Card } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	PlayIcon,
	CheckIcon,
	MoreVerticalIcon,
	EditIcon,
	TrashIcon,
	CalendarIcon,
	AlertTriangleIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
	TimelineHealthBadge,
	MilestoneStatusBadge,
} from "./TimelineHealthBadge";

interface Milestone {
	id: string;
	title: string;
	description?: string | null;
	orderIndex: number;
	plannedStart?: Date | string | null;
	plannedEnd?: Date | string | null;
	actualStart?: Date | string | null;
	actualEnd?: Date | string | null;
	status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "DELAYED";
	progress: number;
	isCritical: boolean;
	healthStatus: "ON_TRACK" | "AT_RISK" | "DELAYED";
}

interface MilestoneCardProps {
	milestone: Milestone;
	onStart?: () => void;
	onComplete?: () => void;
	onUpdateProgress?: (progress: number) => void;
	onEdit?: () => void;
	onDelete?: () => void;
	isLoading?: boolean;
}

export function MilestoneCard({
	milestone,
	onStart,
	onComplete,
	onUpdateProgress,
	onEdit,
	onDelete,
	isLoading,
}: MilestoneCardProps) {
	const t = useTranslations();

	const formatDate = (date: Date | string | null | undefined) => {
		if (!date) return "-";
		const d = typeof date === "string" ? new Date(date) : date;
		return d.toLocaleDateString("ar-SA", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const canStart = milestone.status === "PLANNED";
	const canComplete =
		milestone.status === "IN_PROGRESS" || milestone.status === "DELAYED";
	const isCompleted = milestone.status === "COMPLETED";

	return (
		<Card
			className={`p-4 ${milestone.isCritical ? "border-orange-300 bg-orange-50/50" : ""}`}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<h3 className="font-semibold text-lg truncate">{milestone.title}</h3>
						{milestone.isCritical && (
							<AlertTriangleIcon className="h-4 w-4 text-orange-500" />
						)}
						<MilestoneStatusBadge status={milestone.status} size="sm" />
						{milestone.status !== "COMPLETED" && (
							<TimelineHealthBadge
								status={milestone.healthStatus}
								size="sm"
								showIcon={false}
							/>
						)}
					</div>

					{milestone.description && (
						<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
							{milestone.description}
						</p>
					)}

					{/* Dates */}
					<div className="mt-3 grid grid-cols-2 gap-4 text-sm">
						<div>
							<span className="text-muted-foreground">
								{t("timeline.plannedDates")}:
							</span>
							<div className="flex items-center gap-1 mt-0.5">
								<CalendarIcon className="h-3 w-3 text-muted-foreground" />
								<span>
									{formatDate(milestone.plannedStart)} -{" "}
									{formatDate(milestone.plannedEnd)}
								</span>
							</div>
						</div>
						{(milestone.actualStart || milestone.actualEnd) && (
							<div>
								<span className="text-muted-foreground">
									{t("timeline.actualDates")}:
								</span>
								<div className="flex items-center gap-1 mt-0.5">
									<CalendarIcon className="h-3 w-3 text-green-500" />
									<span>
										{formatDate(milestone.actualStart)} -{" "}
										{formatDate(milestone.actualEnd)}
									</span>
								</div>
							</div>
						)}
					</div>

					{/* Progress */}
					<div className="mt-3">
						<div className="flex items-center justify-between text-sm mb-1">
							<span className="text-muted-foreground">
								{t("timeline.progress")}
							</span>
							<span className="font-medium">{Math.round(milestone.progress)}%</span>
						</div>
						<Progress value={milestone.progress} className="h-2" />
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					{canStart && onStart && (
						<Button
							size="sm"
							variant="outline"
							onClick={onStart}
							disabled={isLoading}
						>
							<PlayIcon className="h-4 w-4 mr-1" />
							{t("timeline.actions.start")}
						</Button>
					)}

					{canComplete && onComplete && (
						<Button
							size="sm"
							variant="primary"
							onClick={onComplete}
							disabled={isLoading}
						>
							<CheckIcon className="h-4 w-4 mr-1" />
							{t("timeline.actions.complete")}
						</Button>
					)}

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-8 w-8">
								<MoreVerticalIcon className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							{onEdit && (
								<DropdownMenuItem onClick={onEdit}>
									<EditIcon className="h-4 w-4 mr-2" />
									{t("timeline.actions.edit")}
								</DropdownMenuItem>
							)}
							{onUpdateProgress && !isCompleted && (
								<DropdownMenuItem
									onClick={() => {
										const progress = prompt(
											t("timeline.actions.enterProgress"),
											String(milestone.progress),
										);
										if (progress !== null) {
											const value = parseInt(progress, 10);
											if (!isNaN(value) && value >= 0 && value <= 100) {
												onUpdateProgress(value);
											}
										}
									}}
								>
									<CalendarIcon className="h-4 w-4 mr-2" />
									{t("timeline.actions.updateProgress")}
								</DropdownMenuItem>
							)}
							{onDelete && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={onDelete}
										className="text-destructive"
									>
										<TrashIcon className="h-4 w-4 mr-2" />
										{t("timeline.actions.delete")}
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</Card>
	);
}
