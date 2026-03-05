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
import { RotateCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface LeadsFiltersProps {
	search: string;
	status: string;
	source: string;
	priority: string;
	onSearchChange: (v: string) => void;
	onStatusChange: (v: string) => void;
	onSourceChange: (v: string) => void;
	onPriorityChange: (v: string) => void;
	onReset: () => void;
}

const STATUSES = ["NEW", "STUDYING", "QUOTED", "NEGOTIATING", "WON", "LOST"] as const;
const SOURCES = ["REFERRAL", "SOCIAL_MEDIA", "WEBSITE", "DIRECT", "EXHIBITION", "OTHER"] as const;
const PRIORITIES = ["NORMAL", "HIGH", "URGENT"] as const;

export function LeadsFilters({
	search,
	status,
	source,
	priority,
	onSearchChange,
	onStatusChange,
	onSourceChange,
	onPriorityChange,
	onReset,
}: LeadsFiltersProps) {
	const t = useTranslations();

	const hasActiveFilters = search || status || source || priority;

	return (
		<div className="flex flex-wrap items-center gap-3">
			<div className="relative flex-1 min-w-[200px] max-w-md">
				<Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
				<Input
					placeholder={t("pricing.leads.searchPlaceholder")}
					value={search}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pr-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700"
				/>
			</div>

			<Select value={status || "all"} onValueChange={(v) => onStatusChange(v === "all" ? "" : v)}>
				<SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
					<SelectValue placeholder={t("pricing.leads.allStatuses")} />
				</SelectTrigger>
				<SelectContent className="rounded-xl">
					<SelectItem value="all">{t("pricing.leads.allStatuses")}</SelectItem>
					{STATUSES.map((s) => (
						<SelectItem key={s} value={s}>
							{t(`pricing.leads.status.${s}`)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select value={source || "all"} onValueChange={(v) => onSourceChange(v === "all" ? "" : v)}>
				<SelectTrigger className="w-[140px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
					<SelectValue placeholder={t("pricing.leads.allSources")} />
				</SelectTrigger>
				<SelectContent className="rounded-xl">
					<SelectItem value="all">{t("pricing.leads.allSources")}</SelectItem>
					{SOURCES.map((s) => (
						<SelectItem key={s} value={s}>
							{t(`pricing.leads.source.${s}`)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select value={priority || "all"} onValueChange={(v) => onPriorityChange(v === "all" ? "" : v)}>
				<SelectTrigger className="w-[130px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
					<SelectValue placeholder={t("pricing.leads.allPriorities")} />
				</SelectTrigger>
				<SelectContent className="rounded-xl">
					<SelectItem value="all">{t("pricing.leads.allPriorities")}</SelectItem>
					{PRIORITIES.map((p) => (
						<SelectItem key={p} value={p}>
							{t(`pricing.leads.priority.${p}`)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{hasActiveFilters && (
				<Button
					variant="ghost"
					size="sm"
					onClick={onReset}
					className="gap-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
				>
					<RotateCcw className="h-3.5 w-3.5" />
					{t("pricing.leads.resetFilters")}
				</Button>
			)}
		</div>
	);
}
