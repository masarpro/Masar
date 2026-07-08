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
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";

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

const STATUS_OPTIONS = [
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

	const hasActiveFilters = search || status || source || priority;
	const activeFiltersCount = [status, source, priority].filter(Boolean).length;

	function getStatusCount(value: string): number {
		if (!stats) return 0;
		if (!value) return stats.total;
		return stats.byStatus[value] ?? 0;
	}

	return (
		<div dir="rtl">
			{/* بحث + زر فلترة واحد (الحالة/المصدر/الأولوية داخله) — للجوال والكمبيوتر */}
			<div className="flex items-center gap-2">
				<div className="relative min-w-0 flex-1 sm:max-w-md">
					<Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder={t("pricing.leads.searchPlaceholder")}
						value={search}
						onChange={(e: any) => onSearchChange(e.target.value)}
						className="pe-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700"
					/>
				</div>
				<MobileFilterSheet activeCount={activeFiltersCount}>
					<Select
						value={status || "all"}
						onValueChange={(v: any) => onStatusChange(v === "all" ? "" : v)}
					>
						<SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
							<SelectValue placeholder={t("pricing.leads.allStatuses")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							{STATUS_OPTIONS.map((opt) => (
								<SelectItem key={opt.key} value={opt.value || "all"}>
									{opt.value
										? t(`pricing.leads.status.${opt.value}`)
										: t("pricing.leads.allStatuses")}
									{stats ? ` (${getStatusCount(opt.value)})` : ""}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={source || "all"} onValueChange={(v: any) => onSourceChange(v === "all" ? "" : v)}>
						<SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
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
					<Select value={priority || "all"} onValueChange={(v: any) => onPriorityChange(v === "all" ? "" : v)}>
						<SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
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
							className="w-full gap-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
						>
							<X className="h-3 w-3" />
							{t("pricing.leads.resetFilters")}
						</Button>
					)}
				</MobileFilterSheet>
			</div>
		</div>
	);
}
