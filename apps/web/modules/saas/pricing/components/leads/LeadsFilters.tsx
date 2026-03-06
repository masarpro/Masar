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
import { RotateCcw, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface LeadsFiltersProps {
	search: string;
	status: string;
	source: string;
	priority: string;
	stats?: {
		total: number;
		byStatus: Record<string, number>;
		openEstimatedValue: number;
		recentCount: number;
	} | null;
	onSearchChange: (v: string) => void;
	onStatusChange: (v: string) => void;
	onSourceChange: (v: string) => void;
	onPriorityChange: (v: string) => void;
	onReset: () => void;
}

const SOURCES = ["REFERRAL", "SOCIAL_MEDIA", "WEBSITE", "DIRECT", "EXHIBITION", "OTHER"] as const;
const PRIORITIES = ["NORMAL", "HIGH", "URGENT"] as const;

const STATUS_TABS = [
	{ value: "", key: "all" },
	{ value: "NEW", key: "NEW" },
	{ value: "STUDYING", key: "STUDYING" },
	{ value: "QUOTED", key: "QUOTED" },
	{ value: "NEGOTIATING", key: "NEGOTIATING" },
	{ value: "WON", key: "WON" },
	{ value: "LOST", key: "LOST" },
] as const;

export function LeadsFilters({
	search,
	status,
	source,
	priority,
	stats,
	onSearchChange,
	onStatusChange,
	onSourceChange,
	onPriorityChange,
	onReset,
}: LeadsFiltersProps) {
	const t = useTranslations();

	const hasActiveFilters = search || source || priority;
	const activeFiltersCount = [search, source, priority].filter(Boolean).length;

	function getTabCount(tabValue: string): number {
		if (!stats) return 0;
		if (!tabValue) return stats.total;
		return stats.byStatus[tabValue] ?? 0;
	}

	return (
		<div className="space-y-3" dir="rtl">
			{/* Status Tabs */}
			<nav className="flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 shadow-lg overflow-x-auto scrollbar-hide">
				{STATUS_TABS.map((tab) => {
					const count = getTabCount(tab.value);
					const isActive = status === tab.value;
					return (
						<button
							key={tab.key}
							type="button"
							onClick={() => onStatusChange(tab.value)}
							className={cn(
								"flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm whitespace-nowrap transition-all",
								isActive
									? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium shadow-md shadow-primary/20"
									: "text-muted-foreground hover:text-foreground hover:bg-muted/60",
							)}
						>
							{tab.value ? t(`pricing.leads.status.${tab.value}`) : t("pricing.leads.allStatuses")}
							<span
								className={cn(
									"text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
									isActive ? "bg-white/20" : "bg-background",
								)}
							>
								{count}
							</span>
						</button>
					);
				})}
			</nav>

			{/* Search and Secondary Filters */}
			<div className="flex items-center gap-2 flex-wrap">
				<div className="relative flex-1 min-w-[200px] max-w-md">
					<Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder={t("pricing.leads.searchPlaceholder")}
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pr-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700"
					/>
				</div>

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
						<X className="h-3 w-3" />
						{t("pricing.leads.resetFilters")}
						{activeFiltersCount > 0 && (
							<span className="text-[10px] bg-muted rounded-full px-1.5">{activeFiltersCount}</span>
						)}
					</Button>
				)}
			</div>
		</div>
	);
}
