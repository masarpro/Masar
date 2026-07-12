"use client";

import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

interface PrintMilestone {
	id: string;
	title: string;
	plannedStart: Date | string | null;
	plannedEnd: Date | string | null;
	status: string;
	progress: number;
	isCritical?: boolean;
}

interface GanttPrintCanvasProps {
	milestones: PrintMilestone[];
	projectStart?: Date | string | null;
	projectEnd?: Date | string | null;
}

const STATUS_COLORS: Record<string, { bar: string; fill: string; text: string }> = {
	PLANNED: {
		bar: "bg-slate-200 border-slate-400",
		fill: "bg-slate-500",
		text: "text-slate-700",
	},
	IN_PROGRESS: {
		bar: "bg-chart-4/15 border-chart-4",
		fill: "bg-chart-4",
		text: "text-chart-4",
	},
	COMPLETED: {
		bar: "bg-green-100 border-green-500",
		fill: "bg-green-600",
		text: "text-green-700",
	},
	DELAYED: {
		bar: "bg-red-100 border-red-500",
		fill: "bg-red-600",
		text: "text-red-700",
	},
	CANCELLED: {
		bar: "bg-gray-100 border-gray-400",
		fill: "bg-gray-400",
		text: "text-gray-500",
	},
};

function toDate(d: Date | string | null | undefined): Date | null {
	if (!d) return null;
	const dt = typeof d === "string" ? new Date(d) : d;
	return isNaN(dt.getTime()) ? null : dt;
}

function startOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
	return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

const MONTH_NAMES_AR = [
	"يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
	"يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function GanttPrintCanvas({
	milestones,
	projectStart,
	projectEnd,
}: GanttPrintCanvasProps) {
	const t = useTranslations();

	const { min, max, totalMs, months, todayPct } = useMemo(() => {
		const dates: Date[] = [];
		const projStart = toDate(projectStart);
		const projEnd = toDate(projectEnd);
		if (projStart) dates.push(projStart);
		if (projEnd) dates.push(projEnd);
		for (const m of milestones) {
			const s = toDate(m.plannedStart);
			const e = toDate(m.plannedEnd);
			if (s) dates.push(s);
			if (e) dates.push(e);
		}

		if (dates.length === 0) {
			const now = new Date();
			return {
				min: now,
				max: addMonths(now, 1),
				totalMs: 30 * 24 * 60 * 60 * 1000,
				months: [],
				todayPct: 50,
			};
		}

		const sorted = dates.map((d) => d.getTime()).sort((a, b) => a - b);
		const min = startOfMonth(new Date(sorted[0]));
		const lastDate = new Date(sorted[sorted.length - 1]);
		const max = addMonths(startOfMonth(lastDate), 1);
		const totalMs = max.getTime() - min.getTime();

		const months: { x: number; w: number; label: string }[] = [];
		let cursor = new Date(min);
		while (cursor < max) {
			const next = addMonths(cursor, 1);
			const start = cursor.getTime();
			const end = Math.min(next.getTime(), max.getTime());
			months.push({
				x: ((start - min.getTime()) / totalMs) * 100,
				w: ((end - start) / totalMs) * 100,
				label: `${MONTH_NAMES_AR[cursor.getMonth()]} ${cursor.getFullYear()}`,
			});
			cursor = next;
		}

		const now = Date.now();
		const todayPct =
			now < min.getTime() || now > max.getTime()
				? -1
				: ((now - min.getTime()) / totalMs) * 100;

		return { min, max, totalMs, months, todayPct };
	}, [milestones, projectStart, projectEnd]);

	function barPosition(start: Date | string | null, end: Date | string | null) {
		const s = toDate(start);
		const e = toDate(end);
		if (!s || !e) return null;
		const left = ((s.getTime() - min.getTime()) / totalMs) * 100;
		const width = ((e.getTime() - s.getTime()) / totalMs) * 100;
		return {
			left: Math.max(0, left),
			width: Math.max(0.5, Math.min(width, 100 - Math.max(0, left))),
		};
	}

	const statusLabel = (s: string) => {
		const map: Record<string, string> = {
			PLANNED: t("timeline.status.planned"),
			IN_PROGRESS: t("timeline.status.inProgress"),
			COMPLETED: t("timeline.status.completed"),
			DELAYED: t("timeline.status.delayed"),
			CANCELLED: t("execution.milestone.cancelled"),
		};
		return map[s] ?? s;
	};

	if (milestones.length === 0) {
		return (
			<div className="border border-slate-300 rounded p-8 text-center text-slate-500 text-sm">
				{t("timeline.emptyTitle")}
			</div>
		);
	}

	const titleColWidth = "180px";

	return (
		<div className="border border-slate-300 rounded overflow-hidden text-slate-800 bg-white">
			{/* Header row: timeline axis */}
			<div
				className="grid border-b-2 border-slate-400 bg-slate-100"
				style={{ gridTemplateColumns: `${titleColWidth} 1fr` }}
			>
				<div className="px-2 py-2 text-xs font-bold border-e border-slate-300">
					{t("execution.print.milestone")}
				</div>
				<div className="relative h-10">
					{months.map((m, i) => (
						<div
							key={i}
							className="absolute top-0 h-full border-e border-slate-300 text-[10px] px-1 text-slate-700 flex items-center font-semibold"
							style={{ insetInlineStart: `${m.x}%`, width: `${m.w}%` }}
						>
							{m.label}
						</div>
					))}
				</div>
			</div>

			{/* Milestone rows */}
			{milestones.map((m, idx) => {
				const colors = STATUS_COLORS[m.status] ?? STATUS_COLORS.PLANNED;
				const pos = barPosition(m.plannedStart, m.plannedEnd);
				const progress = Math.max(0, Math.min(100, Number(m.progress) || 0));

				return (
					<div
						key={m.id}
						className="grid border-b border-slate-200 hover:bg-slate-50"
						style={{ gridTemplateColumns: `${titleColWidth} 1fr` }}
					>
						<div className="px-2 py-2 text-xs border-e border-slate-300">
							<div className="flex items-baseline gap-1">
								<span className="text-slate-400 text-[10px] w-4 shrink-0">
									{idx + 1}
								</span>
								<span className="font-semibold truncate">
									{m.title}
								</span>
							</div>
							<div
								className={cn(
									"text-[10px] mt-0.5 flex items-center gap-2",
									colors.text,
								)}
							>
								<span>{statusLabel(m.status)}</span>
								<span className="text-slate-400">•</span>
								<span className="font-mono">{progress.toFixed(0)}%</span>
							</div>
						</div>

						<div className="relative h-10 bg-white">
							{/* month gridlines */}
							{months.map((mo, i) => (
								<div
									key={i}
									className="absolute top-0 bottom-0 border-e border-slate-100"
									style={{ insetInlineStart: `${mo.x + mo.w}%`, width: 0 }}
								/>
							))}

							{/* today marker */}
							{todayPct >= 0 && (
								<div
									className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
									style={{ insetInlineStart: `${todayPct}%` }}
								/>
							)}

							{/* bar */}
							{pos && (
								<div
									className={cn(
										"absolute top-1.5 bottom-1.5 rounded border overflow-hidden",
										colors.bar,
									)}
									style={{
										insetInlineStart: `${pos.left}%`,
										width: `${pos.width}%`,
									}}
								>
									<div
										className={cn("h-full", colors.fill)}
										style={{ width: `${progress}%` }}
									/>
								</div>
							)}
						</div>
					</div>
				);
			})}

			{/* Legend */}
			<div className="grid border-t-2 border-slate-300 bg-slate-50">
				<div className="flex items-center gap-4 px-3 py-2 text-[10px] text-slate-600 flex-wrap">
					<span className="font-semibold">{t("execution.print.legend")}:</span>
					{Object.entries(STATUS_COLORS).map(([key, colors]) => (
						<span key={key} className="inline-flex items-center gap-1">
							<span
								className={cn(
									"inline-block w-3 h-3 rounded border",
									colors.bar,
								)}
							/>
							{statusLabel(key)}
						</span>
					))}
					{todayPct >= 0 && (
						<span className="inline-flex items-center gap-1">
							<span className="inline-block w-px h-3 bg-red-500" />
							{t("execution.print.today")}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
