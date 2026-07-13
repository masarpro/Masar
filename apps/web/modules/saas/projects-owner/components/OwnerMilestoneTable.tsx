"use client";

import { formatDate } from "@shared/lib/formatters";
import { Badge } from "@ui/components/badge";
import { Progress } from "@ui/components/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";

export interface OwnerMilestone {
	id: string;
	title: string;
	description?: string | null;
	orderIndex: number;
	plannedStart: Date | string | null;
	plannedEnd: Date | string | null;
	actualStart?: Date | string | null;
	actualEnd?: Date | string | null;
	status: string;
	progress: number;
	isCritical?: boolean;
}

interface OwnerMilestoneTableProps {
	milestones: OwnerMilestone[];
}

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
	year: "numeric",
	month: "short",
	day: "numeric",
};

function getDaysLeft(
	plannedEnd: Date | string | null | undefined,
	status: string,
): string {
	if (!plannedEnd || status === "COMPLETED" || status === "CANCELLED")
		return "-";
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const end = new Date(plannedEnd);
	end.setHours(0, 0, 0, 0);
	const diff = Math.ceil(
		(end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
	);
	return String(diff);
}

export function OwnerMilestoneTable({ milestones }: OwnerMilestoneTableProps) {
	const t = useTranslations();

	const statusBadge: Record<string, { className: string; label: string }> = {
		PLANNED: {
			className: "bg-muted text-muted-foreground",
			label: t("timeline.status.planned"),
		},
		IN_PROGRESS: {
			className: "bg-chart-4/15 text-chart-4",
			label: t("timeline.status.inProgress"),
		},
		COMPLETED: {
			className: "bg-success/15 text-success",
			label: t("timeline.status.completed"),
		},
		DELAYED: {
			className: "bg-destructive/15 text-destructive",
			label: t("timeline.status.delayed"),
		},
		CANCELLED: {
			className: "bg-muted text-muted-foreground",
			label: t("execution.milestone.cancelled"),
		},
	};

	if (milestones.length === 0) {
		return (
			<p className="py-8 text-center text-muted-foreground">
				{t("ownerPortal.schedule.noMilestones")}
			</p>
		);
	}

	const sorted = [...milestones].sort((a, b) => a.orderIndex - b.orderIndex);

	return (
		<>
			{/* Mobile: card list */}
			<div className="space-y-3 sm:hidden">
				{sorted.map((m, i) => {
					const sb = statusBadge[m.status] ?? statusBadge.PLANNED;
					const progress = Math.max(0, Math.min(100, Number(m.progress) || 0));
					const daysLeft = getDaysLeft(m.plannedEnd, m.status);
					return (
						<div
							key={m.id}
							className="rounded-xl border-2 p-4"
						>
							<div className="flex items-start justify-between gap-2">
								<div className="flex min-w-0 items-baseline gap-1.5">
									<span className="shrink-0 text-muted-foreground text-xs">
										{i + 1}.
									</span>
									<span className="font-medium text-card-foreground">
										{m.title}
									</span>
								</div>
								<Badge
									variant="secondary"
									className={cn("shrink-0 border-0", sb.className)}
								>
									{sb.label}
								</Badge>
							</div>

							<div className="mt-3 flex items-center gap-2">
								<Progress value={progress} className="h-2 flex-1" />
								<span className="w-9 text-end text-muted-foreground text-xs">
									{Math.round(progress)}%
								</span>
							</div>

							<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
								<span>
									{formatDate(m.plannedStart, "ar-SA", DATE_OPTIONS)} —{" "}
									{formatDate(m.plannedEnd, "ar-SA", DATE_OPTIONS)}
								</span>
								{daysLeft !== "-" && (
									<span>
										{t("execution.table.daysLeft")}: {daysLeft}
									</span>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{/* Desktop: table */}
			<div className="hidden overflow-x-auto rounded-xl border-2 sm:block">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-10">
							{t("execution.table.number")}
						</TableHead>
						<TableHead>{t("execution.table.name")}</TableHead>
						<TableHead>{t("execution.table.status")}</TableHead>
						<TableHead className="min-w-[120px]">
							{t("execution.table.progress")}
						</TableHead>
						<TableHead>{t("execution.table.plannedStart")}</TableHead>
						<TableHead>{t("execution.table.plannedEnd")}</TableHead>
						<TableHead className="text-center">
							{t("execution.table.daysLeft")}
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sorted.map((m, i) => {
						const sb = statusBadge[m.status] ?? statusBadge.PLANNED;
						const progress = Math.max(0, Math.min(100, Number(m.progress) || 0));
						return (
							<TableRow key={m.id}>
								<TableCell className="text-muted-foreground">{i + 1}</TableCell>
								<TableCell className="font-medium">{m.title}</TableCell>
								<TableCell>
									<Badge
										variant="secondary"
										className={cn("border-0", sb.className)}
									>
										{sb.label}
									</Badge>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<Progress value={progress} className="h-2 flex-1" />
										<span className="w-9 text-end text-muted-foreground text-xs">
											{Math.round(progress)}%
										</span>
									</div>
								</TableCell>
								<TableCell className="text-sm">
									{formatDate(m.plannedStart, "ar-SA", DATE_OPTIONS)}
								</TableCell>
								<TableCell className="text-sm">
									{formatDate(m.plannedEnd, "ar-SA", DATE_OPTIONS)}
								</TableCell>
								<TableCell className="text-center text-sm">
									{getDaysLeft(m.plannedEnd, m.status)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
			</div>
		</>
	);
}
