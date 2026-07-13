"use client";

import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { cn } from "@ui/lib";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	CalendarRange,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useEffect, useState } from "react";

/**
 * أدوات مشتركة لقوائم المالية (المصروفات/المقبوضات):
 * فلترة الفترة الزمنية، رقاقات الفلاتر النشطة، رؤوس أعمدة قابلة للفرز،
 * وتصدير CSV — لتوحيد التجربة عبر جداول المالية.
 */

// ── Debounce ──────────────────────────────────────────────────────────────

export function useDebouncedValue<T>(value: T, delay = 300): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const handle = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(handle);
	}, [value, delay]);
	return debounced;
}

// ── Date range presets ────────────────────────────────────────────────────

export type DatePreset =
	| "all"
	| "thisMonth"
	| "lastMonth"
	| "thisQuarter"
	| "thisYear"
	| "custom";

const PRESET_LABEL_KEYS: Record<DatePreset, string> = {
	all: "allTime",
	thisMonth: "thisMonth",
	lastMonth: "lastMonth",
	thisQuarter: "thisQuarter",
	thisYear: "thisYear",
	custom: "custom",
};

const PRESETS: DatePreset[] = [
	"all",
	"thisMonth",
	"lastMonth",
	"thisQuarter",
	"thisYear",
	"custom",
];

export function resolveDateRange(
	preset: DatePreset,
	customFrom: string,
	customTo: string,
): { from?: Date; to?: Date } {
	const now = new Date();
	const y = now.getFullYear();
	const m = now.getMonth();
	switch (preset) {
		case "thisMonth":
			return { from: new Date(y, m, 1) };
		case "lastMonth":
			return {
				from: new Date(y, m - 1, 1),
				to: new Date(y, m, 0, 23, 59, 59, 999),
			};
		case "thisQuarter":
			return { from: new Date(y, Math.floor(m / 3) * 3, 1) };
		case "thisYear":
			return { from: new Date(y, 0, 1) };
		case "custom":
			return {
				from: customFrom
					? new Date(`${customFrom}T00:00:00`)
					: undefined,
				to: customTo ? new Date(`${customTo}T23:59:59.999`) : undefined,
			};
		default:
			return {};
	}
}

interface PeriodFilterProps {
	preset: DatePreset;
	onPresetChange: (preset: DatePreset) => void;
	customFrom: string;
	customTo: string;
	onCustomFromChange: (value: string) => void;
	onCustomToChange: (value: string) => void;
	triggerClassName?: string;
	/** يرصّ حقلي التاريخ المخصص عمودياً (لورقة فلاتر الجوال) */
	stacked?: boolean;
}

export function PeriodFilter({
	preset,
	onPresetChange,
	customFrom,
	customTo,
	onCustomFromChange,
	onCustomToChange,
	triggerClassName,
	stacked,
}: PeriodFilterProps) {
	const t = useTranslations("finance.listControls");
	return (
		<>
			<Select
				value={preset}
				onValueChange={(value: any) =>
					onPresetChange(value as DatePreset)
				}
			>
				<SelectTrigger className={cn("rounded-xl", triggerClassName)}>
					<span className="flex min-w-0 items-center gap-1.5">
						<CalendarRange className="h-4 w-4 shrink-0 text-muted-foreground" />
						<SelectValue />
					</span>
				</SelectTrigger>
				<SelectContent className="rounded-xl">
					{PRESETS.map((p) => (
						<SelectItem key={p} value={p}>
							{t(PRESET_LABEL_KEYS[p])}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{preset === "custom" && (
				<div
					className={cn(
						"flex gap-1.5",
						stacked ? "flex-col" : "items-center",
					)}
				>
					<Input
						type="date"
						value={customFrom}
						onChange={(e: any) =>
							onCustomFromChange(e.target.value)
						}
						aria-label={t("from")}
						className={cn(
							"rounded-xl",
							stacked ? "w-full" : "w-36",
						)}
					/>
					{!stacked && (
						<span className="text-xs text-muted-foreground">–</span>
					)}
					<Input
						type="date"
						value={customTo}
						onChange={(e: any) => onCustomToChange(e.target.value)}
						aria-label={t("to")}
						className={cn(
							"rounded-xl",
							stacked ? "w-full" : "w-36",
						)}
					/>
				</div>
			)}
		</>
	);
}

// ── Active filter chips ───────────────────────────────────────────────────

export interface FilterChip {
	key: string;
	label: ReactNode;
	onRemove: () => void;
}

export function ActiveFilterChips({
	chips,
	onClearAll,
}: {
	chips: FilterChip[];
	onClearAll: () => void;
}) {
	const t = useTranslations("finance.listControls");
	if (chips.length === 0) {
		return null;
	}
	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{chips.map((chip) => (
				<span
					key={chip.key}
					className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pe-1 ps-2.5 text-xs font-medium text-primary"
				>
					{chip.label}
					<button
						type="button"
						onClick={chip.onRemove}
						aria-label={t("removeFilter")}
						className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
					>
						<X className="h-3 w-3" />
					</button>
				</span>
			))}
			<Button
				variant="ghost"
				size="sm"
				className="h-7 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground"
				onClick={onClearAll}
			>
				{t("clearFilters")}
			</Button>
		</div>
	);
}

// ── Sortable column header ────────────────────────────────────────────────

export type SortDirection = "asc" | "desc";

export function SortableColumnButton({
	label,
	active,
	direction,
	onClick,
	className,
}: {
	label: ReactNode;
	active: boolean;
	direction: SortDirection;
	onClick: () => void;
	className?: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"group inline-flex items-center gap-1 whitespace-nowrap transition-colors hover:text-foreground",
				active && "font-semibold text-foreground",
				className,
			)}
		>
			{label}
			{active ? (
				direction === "asc" ? (
					<ArrowUp className="h-3.5 w-3.5" />
				) : (
					<ArrowDown className="h-3.5 w-3.5" />
				)
			) : (
				<ArrowUpDown className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-50" />
			)}
		</button>
	);
}

// ── CSV export ────────────────────────────────────────────────────────────

export function downloadCsv(
	filename: string,
	headers: string[],
	rows: (string | number | null | undefined)[][],
) {
	const escapeCell = (value: string | number | null | undefined) =>
		`"${String(value ?? "").replace(/"/g, '""')}"`;
	// BOM لدعم العربية في Excel
	const csv =
		"\uFEFF" +
		[headers, ...rows]
			.map((row) => row.map(escapeCell).join(","))
			.join("\r\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
