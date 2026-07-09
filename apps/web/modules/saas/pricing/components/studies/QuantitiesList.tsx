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
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
import {
	Plus,
	Search,
	FolderKanban,
	TrendingUp,
	Clock,
	CheckCircle2,
	FileStack,
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { CostStudyCard } from "./CostStudyCard";
import { CreateCostStudyDialog } from "./CreateCostStudyForm";
import { formatCurrency } from "../../lib/utils";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";

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

	// Statistics aggregated server-side across ALL studies (not just this page)
	const byStatus: Record<string, number> = (data as any)?.stats?.byStatus ?? {};
	const stats = {
		total: (data as any)?.stats?.totalCount ?? 0,
		inProgress: byStatus.in_progress ?? 0,
		completed: (byStatus.completed ?? 0) + (byStatus.approved ?? 0),
		totalValue: (data as any)?.stats?.totalValue ?? 0,
	};

	if (isLoading) {
		return <ListTableSkeleton />;
	}

	return (
		<div className="space-y-6">
			{/* الجوال: شريط إحصائيات مضغوط */}
			<CompactStatGrid
				className="sm:hidden"
				items={[
					{
						label: t("pricing.studies.stats.total"),
						value: stats.total,
						icon: FileStack,
					},
					{
						label: t("pricing.studies.stats.inProgress"),
						value: stats.inProgress,
						icon: Clock,
						iconClassName: "text-amber-600 dark:text-amber-400",
						iconBgClassName: "bg-amber-100 dark:bg-amber-900/30",
						valueClassName: "text-amber-700 dark:text-amber-300",
					},
					{
						label: t("pricing.studies.stats.completed"),
						value: stats.completed,
						icon: CheckCircle2,
						iconClassName: "text-sky-600 dark:text-sky-400",
						iconBgClassName: "bg-sky-100 dark:bg-sky-900/30",
						valueClassName: "text-sky-700 dark:text-sky-300",
					},
					{
						label: t("pricing.studies.stats.totalValue"),
						value: formatCurrency(stats.totalValue),
						icon: TrendingUp,
						iconClassName: "text-indigo-600 dark:text-indigo-400",
						iconBgClassName: "bg-indigo-100 dark:bg-indigo-900/30",
						valueClassName: "text-indigo-700 dark:text-indigo-300",
					},
				]}
			/>

			{/* Statistics Cards - Modern 2026 Flat Design (الديسكتوب كما هو) */}
			<div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

				<div className="group relative rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 p-5 transition-all duration-200 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 overflow-hidden">
					<div className="flex items-center justify-between gap-2">
						<div className="min-w-0 flex-1">
							<p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">{t("pricing.studies.stats.totalValue")}</p>
							<p className="text-lg sm:text-2xl font-semibold mt-2 text-indigo-700 dark:text-indigo-300 break-words leading-snug">{formatCurrency(stats.totalValue)}</p>
						</div>
						<div className="p-3 rounded-2xl bg-indigo-200/50 dark:bg-indigo-800/30 shrink-0 max-sm:hidden">
							<TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
					</div>
				</div>
			</div>

			{/* بحث + زر فلترة (الحالة داخله) + إنشاء — صف واحد للجوال والكمبيوتر */}
			<div className="flex items-center gap-2">
				<div className="relative min-w-0 flex-1 sm:max-w-md">
					<Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder={t("pricing.studies.searchPlaceholder")}
						value={searchTerm}
						onChange={(e: any) => setSearchTerm(e.target.value)}
						className="pe-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-1 focus:ring-slate-300 dark:focus:ring-slate-700"
					/>
				</div>
				<MobileFilterSheet activeCount={statusFilter !== "all" ? 1 : 0}>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full rounded-xl">
							<SelectValue placeholder={t("pricing.studies.allStatuses")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("pricing.studies.allStatuses")}</SelectItem>
							<SelectItem value="draft">{t("pricing.studies.status.draft")}</SelectItem>
							<SelectItem value="in_progress">{t("pricing.studies.status.inProgress")}</SelectItem>
							<SelectItem value="completed">{t("pricing.studies.status.completed")}</SelectItem>
							<SelectItem value="approved">{t("pricing.studies.status.approved")}</SelectItem>
						</SelectContent>
					</Select>
				</MobileFilterSheet>
				<div className="sm:hidden">
					<Button
						size="icon"
						aria-label={t("pricing.studies.newStudy")}
						onClick={() => setShowCreateDialog(true)}
						className="h-10 w-10 shrink-0 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
					>
						<Plus className="h-5 w-5" />
					</Button>
				</div>
				<div className="hidden sm:block shrink-0">
					<Button onClick={() => setShowCreateDialog(true)} className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
						<Plus className="me-2 h-4 w-4" />
						{t("pricing.studies.newStudy")}
					</Button>
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
							<Plus className="me-2 h-4 w-4" />
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
