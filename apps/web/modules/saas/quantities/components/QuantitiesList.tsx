"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Plus,
	Search,
	FolderKanban,
	TrendingUp,
	Clock,
	CheckCircle2,
	FileStack
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { CostStudyCard } from "./CostStudyCard";
import { formatCurrency } from "../lib/utils";

interface QuantitiesListProps {
	organizationId: string;
}

export function QuantitiesList({ organizationId }: QuantitiesListProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const { data, isLoading, refetch } = useQuery(
		orpc.quantities.list.queryOptions({
			input: {
				organizationId,
				status: statusFilter !== "all" ? statusFilter : undefined,
				query: searchTerm || undefined,
			},
		}),
	);

	const costStudies = data?.costStudies ?? [];
	const basePath = `/app/${activeOrganization?.slug}/quantities`;

	// Calculate statistics
	const stats = {
		total: costStudies.length,
		inProgress: costStudies.filter(s => s.status === "in_progress").length,
		completed: costStudies.filter(s => s.status === "completed" || s.status === "approved").length,
		totalValue: costStudies.reduce((sum, s) => sum + s.totalCost, 0),
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Statistics Cards - Modern 2026 Flat Design */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="group relative rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-5 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/50">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t("quantities.stats.total")}</p>
							<p className="text-3xl font-semibold mt-2 text-slate-900 dark:text-slate-100">{stats.total}</p>
						</div>
						<div className="p-3 rounded-2xl bg-slate-200/50 dark:bg-slate-700/50">
							<FileStack className="h-5 w-5 text-slate-600 dark:text-slate-300" />
						</div>
					</div>
				</div>

				<div className="group relative rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-5 transition-all duration-200 hover:bg-amber-100 dark:hover:bg-amber-900/30">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">{t("quantities.stats.inProgress")}</p>
							<p className="text-3xl font-semibold mt-2 text-amber-700 dark:text-amber-300">{stats.inProgress}</p>
						</div>
						<div className="p-3 rounded-2xl bg-amber-200/50 dark:bg-amber-800/30">
							<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
					</div>
				</div>

				<div className="group relative rounded-2xl bg-teal-50 dark:bg-teal-950/30 p-5 transition-all duration-200 hover:bg-teal-100 dark:hover:bg-teal-900/30">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wide">{t("quantities.stats.completed")}</p>
							<p className="text-3xl font-semibold mt-2 text-teal-700 dark:text-teal-300">{stats.completed}</p>
						</div>
						<div className="p-3 rounded-2xl bg-teal-200/50 dark:bg-teal-800/30">
							<CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
						</div>
					</div>
				</div>

				<div className="group relative rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 p-5 transition-all duration-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/30">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{t("quantities.stats.totalValue")}</p>
							<p className="text-2xl font-semibold mt-2 text-indigo-700 dark:text-indigo-300">{formatCurrency(stats.totalValue)}</p>
						</div>
						<div className="p-3 rounded-2xl bg-indigo-200/50 dark:bg-indigo-800/30">
							<TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
					</div>
				</div>
			</div>

			{/* Search and Filter Bar - Clean Minimal */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<div className="relative flex-1 max-w-md">
						<Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<Input
							placeholder={t("quantities.searchPlaceholder")}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pr-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[160px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
							<SelectValue placeholder={t("quantities.allStatuses")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("quantities.allStatuses")}</SelectItem>
							<SelectItem value="draft">{t("quantities.status.draft")}</SelectItem>
							<SelectItem value="in_progress">{t("quantities.status.inProgress")}</SelectItem>
							<SelectItem value="completed">{t("quantities.status.completed")}</SelectItem>
							<SelectItem value="approved">{t("quantities.status.approved")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button asChild className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
					<Link href={`${basePath}/new`}>
						<Plus className="ml-2 h-4 w-4" />
						{t("quantities.newStudy")}
					</Link>
				</Button>
			</div>

			{/* Grid of cost studies */}
			{costStudies.length > 0 ? (
				<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{costStudies.map((study, index) => (
						<div
							key={study.id}
							className="animate-in fade-in slide-in-from-bottom-4 duration-500"
							style={{ animationDelay: `${index * 50}ms` }}
						>
							<CostStudyCard
								study={study}
								basePath={basePath}
								onDelete={refetch}
								onDuplicate={refetch}
							/>
						</div>
					))}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 mb-5">
						<FolderKanban className="h-12 w-12 text-slate-400 dark:text-slate-500" />
					</div>
					<h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t("quantities.empty")}</h3>
					<p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm">
						{t("quantities.emptyDescription")}
					</p>
					<Button asChild className="mt-5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200">
						<Link href={`${basePath}/new`}>
							<Plus className="ml-2 h-4 w-4" />
							{t("quantities.newStudy")}
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
