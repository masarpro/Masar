"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Progress } from "@ui/components/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { EditIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { ExecutionMilestone } from "../../lib/execution-types";

interface MilestoneTableViewProps {
	milestones: ExecutionMilestone[];
	onEdit: (milestone: ExecutionMilestone) => void;
	onDelete: (milestoneId: string) => void;
}

type SortKey = "orderIndex" | "status" | "progress" | "plannedStart" | "plannedEnd";
type SortDir = "asc" | "desc";

function formatDate(date: Date | string | null | undefined): string {
	if (!date) return "-";
	const d = typeof date === "string" ? new Date(date) : date;
	return d.toLocaleDateString("ar-SA", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

function getDaysLeft(plannedEnd: Date | string | null | undefined, status: string): string {
	if (!plannedEnd || status === "COMPLETED" || status === "CANCELLED") return "-";
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const end = new Date(plannedEnd);
	end.setHours(0, 0, 0, 0);
	const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
	return String(diff);
}

export function MilestoneTableView({
	milestones,
	onEdit,
	onDelete,
}: MilestoneTableViewProps) {
	const t = useTranslations();
	const [sortKey, setSortKey] = useState<SortKey>("orderIndex");
	const [sortDir, setSortDir] = useState<SortDir>("asc");

	const handleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortDir(sortDir === "asc" ? "desc" : "asc");
		} else {
			setSortKey(key);
			setSortDir("asc");
		}
	};

	const sorted = [...milestones].sort((a, b) => {
		const dir = sortDir === "asc" ? 1 : -1;
		switch (sortKey) {
			case "orderIndex":
				return (a.orderIndex - b.orderIndex) * dir;
			case "status":
				return a.status.localeCompare(b.status) * dir;
			case "progress":
				return (a.progress - b.progress) * dir;
			case "plannedStart": {
				const aDate = a.plannedStart ? new Date(a.plannedStart).getTime() : 0;
				const bDate = b.plannedStart ? new Date(b.plannedStart).getTime() : 0;
				return (aDate - bDate) * dir;
			}
			case "plannedEnd": {
				const aDate = a.plannedEnd ? new Date(a.plannedEnd).getTime() : 0;
				const bDate = b.plannedEnd ? new Date(b.plannedEnd).getTime() : 0;
				return (aDate - bDate) * dir;
			}
			default:
				return 0;
		}
	});

	const statusBadge: Record<string, { className: string; label: string }> = {
		PLANNED: { className: "bg-slate-100 text-slate-700", label: t("timeline.status.planned") },
		IN_PROGRESS: { className: "bg-blue-100 text-blue-700", label: t("timeline.status.inProgress") },
		COMPLETED: { className: "bg-green-100 text-green-700", label: t("timeline.status.completed") },
		DELAYED: { className: "bg-red-100 text-red-700", label: t("timeline.status.delayed") },
		CANCELLED: { className: "bg-gray-100 text-gray-500", label: t("execution.milestone.cancelled") },
	};

	const healthBadge: Record<string, { className: string; label: string }> = {
		ON_TRACK: { className: "bg-green-100 text-green-700", label: t("timeline.health.onTrack") },
		AT_RISK: { className: "bg-yellow-100 text-yellow-700", label: t("timeline.health.atRisk") },
		DELAYED: { className: "bg-red-100 text-red-700", label: t("timeline.health.delayed") },
	};

	const SortableHead = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
		<TableHead
			className="cursor-pointer select-none hover:bg-muted/50"
			onClick={() => handleSort(sortKeyName)}
		>
			{label}
			{sortKey === sortKeyName && (sortDir === "asc" ? " ↑" : " ↓")}
		</TableHead>
	);

	return (
		<div className="rounded-md border overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<SortableHead label={t("execution.table.number")} sortKeyName="orderIndex" />
						<TableHead>{t("execution.table.name")}</TableHead>
						<SortableHead label={t("execution.table.status")} sortKeyName="status" />
						<TableHead>{t("execution.table.health")}</TableHead>
						<SortableHead label={t("execution.table.progress")} sortKeyName="progress" />
						<SortableHead label={t("execution.table.plannedStart")} sortKeyName="plannedStart" />
						<SortableHead label={t("execution.table.plannedEnd")} sortKeyName="plannedEnd" />
						<TableHead>{t("execution.table.daysLeft")}</TableHead>
						<TableHead>{t("execution.table.actions")}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{sorted.map((m, i) => {
						const sb = statusBadge[m.status] ?? statusBadge.PLANNED;
						const hb = healthBadge[m.healthStatus] ?? healthBadge.ON_TRACK;

						return (
							<TableRow key={m.id}>
								<TableCell className="text-muted-foreground">
									{i + 1}
								</TableCell>
								<TableCell className="font-medium">
									{m.title}
								</TableCell>
								<TableCell>
									<Badge variant="secondary" className={sb.className}>
										{sb.label}
									</Badge>
								</TableCell>
								<TableCell>
									{m.status !== "COMPLETED" && (
										<Badge variant="secondary" className={hb.className}>
											{hb.label}
										</Badge>
									)}
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2 min-w-[100px]">
										<Progress value={m.progress} className="h-2 flex-1" />
										<span className="text-xs text-muted-foreground w-8 text-end">
											{Math.round(m.progress)}%
										</span>
									</div>
								</TableCell>
								<TableCell className="text-sm">
									{formatDate(m.plannedStart)}
								</TableCell>
								<TableCell className="text-sm">
									{formatDate(m.plannedEnd)}
								</TableCell>
								<TableCell className="text-sm">
									{getDaysLeft(m.plannedEnd, m.status)}
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7"
											onClick={() => onEdit(m)}
										>
											<EditIcon className="h-3.5 w-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="h-7 w-7 text-destructive"
											onClick={() => onDelete(m.id)}
										>
											<TrashIcon className="h-3.5 w-3.5" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
