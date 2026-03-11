"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { cn } from "@ui/lib";
import {
	Plus,
	Search,
	FolderKanban,
	TrendingUp,
	Clock,
	CheckCircle2,
	FileStack
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { CostStudyCard } from "./CostStudyCard";
import { CreateCostStudyDialog } from "./CreateCostStudyForm";
import { formatCurrency } from "../../lib/utils";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface QuantitiesListProps {
	organizationId: string;
}

export function QuantitiesList({ organizationId }: QuantitiesListProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showCreateDialog, setShowCreateDialog] = useState(false);

	const { data, isLoading, refetch } = useQuery(
		orpc.pricing.studies.list.queryOptions({
			input: {
				organizationId,
				status: statusFilter !== "all" ? statusFilter : undefined,
				query: searchTerm || undefined,
			},
		}),
	);

	const costStudies = (data as any)?.costStudies ?? [];
	const basePath = `/app/${activeOrganization?.slug}/pricing/studies`;

	// Calculate statistics
	const stats = {
		total: costStudies.length,
		inProgress: costStudies.filter((s: any) => s.status === "in_progress").length,
		completed: costStudies.filter((s: any) => s.status === "completed" || s.status === "approved").length,
		totalValue: costStudies.reduce((sum: any, s: any) => sum + s.totalCost, 0),
	};

	if (isLoading) {
		return <ListTableSkeleton />;
	}

	return (
		<div className="space-y-6">
			{/* Statistics Cards - Modern 2026 Flat Design */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="group relative rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-5 transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800/50">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t("pricing.studies.stats.total")}</p>
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
							<p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">{t("pricing.studies.stats.inProgress")}</p>
							<p className="text-3xl font-semibold mt-2 text-amber-700 dark:text-amber-300">{stats.inProgress}</p>
						</div>
						<div className="p-3 rounded-2xl bg-amber-200/50 dark:bg-amber-800/30">
							<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
						</div>
					</div>
				</div>

				<div className="group relative rounded-2xl bg-sky-50 dark:bg-sky-950/30 p-5 transition-all duration-200 hover:bg-sky-100 dark:hover:bg-sky-900/30">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium text-sky-600 dark:text-sky-400 uppercase tracking-wide">{t("pricing.studies.stats.completed")}</p>
							<p className="text-3xl font-semibold mt-2 text-sky-700 dark:text-sky-300">{stats.completed}</p>
						</div>
						<div className="p-3 rounded-2xl bg-sky-200/50 dark:bg-sky-800/30">
							<CheckCircle2 className="h-5 w-5 text-sky-600 dark:text-sky-400" />
						</div>
					</div>
				</div>

				<div className="group relative rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 p-5 transition-all duration-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/30">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{t("pricing.studies.stats.totalValue")}</p>
							<p className="text-2xl font-semibold mt-2 text-indigo-700 dark:text-indigo-300">{formatCurrency(stats.totalValue)}</p>
						</div>
						<div className="p-3 rounded-2xl bg-indigo-200/50 dark:bg-indigo-800/30">
							<TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
					</div>
				</div>
			</div>

			{/* Filter Tabs + Search */}
			<div className="space-y-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					{/* Status filter pills */}
					<div className="flex items-center gap-2 flex-wrap">
						{([
							{ value: "all", label: t("pricing.studies.allStatuses"), count: stats.total },
							{ value: "draft", label: t("pricing.studies.status.draft"), count: costStudies.filter((s: any) => s.status === "draft").length },
							{ value: "in_progress", label: t("pricing.studies.status.inProgress"), count: stats.inProgress },
							{ value: "completed", label: t("pricing.studies.status.completed"), count: costStudies.filter((s: any) => s.status === "completed").length },
							{ value: "approved", label: t("pricing.studies.status.approved"), count: costStudies.filter((s: any) => s.status === "approved").length },
						] as const).map((tab) => (
							<button
								key={tab.value}
								type="button"
								onClick={() => setStatusFilter(tab.value)}
								className={cn(
									"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
									statusFilter === tab.value
										? "bg-primary text-primary-foreground"
										: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
								)}
							>
								{tab.label}
								{tab.count > 0 && (
									<Badge variant={statusFilter === tab.value ? "secondary" : "outline"} className="h-5 min-w-[20px] px-1.5 text-[10px]">
										{tab.count}
									</Badge>
								)}
							</button>
						))}
					</div>
					<Button onClick={() => setShowCreateDialog(true)} className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shrink-0">
						<Plus className="ml-2 h-4 w-4" />
						{t("pricing.studies.newStudy")}
					</Button>
				</div>
				{/* Search */}
				<div className="relative max-w-md">
					<Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder={t("pricing.studies.searchPlaceholder")}
						value={searchTerm}
						onChange={(e: any) => setSearchTerm(e.target.value)}
						className="pr-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700"
					/>
				</div>
			</div>

			{/* Grid of cost studies */}
			{costStudies.length > 0 ? (
				<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{costStudies.map((study: any, index: any) => (
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
					<h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t("pricing.studies.empty")}</h3>
					<p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm">
						{t("pricing.studies.emptyDescription")}
					</p>
					<Button onClick={() => setShowCreateDialog(true)} className="mt-5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200">
							<Plus className="ml-2 h-4 w-4" />
							{t("pricing.studies.newStudy")}
					</Button>
				</div>
			)}
			<CreateCostStudyDialog
				organizationId={organizationId}
				organizationSlug={activeOrganization?.slug ?? ""}
				open={showCreateDialog}
				onOpenChange={setShowCreateDialog}
			/>
		</div>
	);
}
