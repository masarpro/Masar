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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { CostStudyCard, type CostStudyListItem } from "./CostStudyCard";
import { CreateCostStudyDialog } from "./CreateCostStudyForm";
import { formatSAR } from "@shared/lib/formatters";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";

interface QuantitiesListProps {
	organizationId: string;
}

interface StudiesListResponse {
	costStudies: CostStudyListItem[];
	total: number;
	stats: {
		totalCount: number;
		totalValue: number;
		byStatus: Record<string, number>;
	};
}

export function QuantitiesList({ organizationId }: QuantitiesListProps) {
	const t = useTranslations();
	const { activeOrganization } = useActiveOrganization();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showCreateDialog, setShowCreateDialog] = useState(false);

	// Auto-open the create dialog when arriving via /pricing/studies?new=1
	// (dashboard quick action), then clean the param from the URL.
	const hasNewParam = searchParams.get("new") !== null;
	useEffect(() => {
		if (hasNewParam) {
			setShowCreateDialog(true);
			router.replace(pathname, { scroll: false });
		}
	}, [hasNewParam, pathname, router]);

	const { data, isLoading, refetch } = useQuery(
		orpc.pricing.studies.list.queryOptions({
			input: {
				organizationId,
				status: statusFilter !== "all" ? statusFilter : undefined,
				query: searchTerm || undefined,
			},
		}),
	);

	const listData = data as StudiesListResponse | undefined;
	const costStudies = listData?.costStudies ?? [];
	const basePath = `/app/${activeOrganization?.slug}/pricing/studies`;

	// Statistics aggregated server-side across ALL studies (not just this page)
	const byStatus: Record<string, number> = listData?.stats?.byStatus ?? {};
	const stats = {
		total: listData?.stats?.totalCount ?? 0,
		inProgress: byStatus.in_progress ?? 0,
		completed: byStatus.completed ?? 0,
		totalValue: listData?.stats?.totalValue ?? 0,
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
						iconClassName: "text-chart-1",
						iconBgClassName: "bg-chart-1/15",
						valueClassName: "text-chart-1",
					},
					{
						label: t("pricing.studies.stats.completed"),
						value: stats.completed,
						icon: CheckCircle2,
						iconClassName: "text-chart-4",
						iconBgClassName: "bg-chart-4/15",
						valueClassName: "text-chart-4",
					},
					{
						label: t("pricing.studies.stats.totalValue"),
						value: formatSAR(stats.totalValue),
						icon: TrendingUp,
						iconClassName: "text-chart-4",
						iconBgClassName: "bg-chart-4/15",
						valueClassName: "text-chart-4",
					},
				]}
			/>

			{/* Statistics Cards - Modern 2026 Flat Design (الديسكتوب كما هو) */}
			<div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="group relative rounded-2xl bg-card border-2 p-5 transition-all duration-200 hover:border-primary/30">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("pricing.studies.stats.total")}</p>
							<p className="text-3xl font-semibold mt-2 text-card-foreground">{stats.total}</p>
						</div>
						<div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
							<FileStack className="h-5 w-5" />
						</div>
					</div>
				</div>

				<div className="group relative rounded-2xl bg-card border-2 p-5 transition-all duration-200 hover:border-primary/30">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("pricing.studies.stats.inProgress")}</p>
							<p className="text-3xl font-semibold mt-2 text-chart-1">{stats.inProgress}</p>
						</div>
						<div className="flex size-11 items-center justify-center rounded-2xl bg-chart-1/15 text-chart-1">
							<Clock className="h-5 w-5" />
						</div>
					</div>
				</div>

				<div className="group relative rounded-2xl bg-card border-2 p-5 transition-all duration-200 hover:border-primary/30">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("pricing.studies.stats.completed")}</p>
							<p className="text-3xl font-semibold mt-2 text-chart-4">{stats.completed}</p>
						</div>
						<div className="flex size-11 items-center justify-center rounded-2xl bg-chart-4/15 text-chart-4">
							<CheckCircle2 className="h-5 w-5" />
						</div>
					</div>
				</div>

				<div className="group relative rounded-2xl bg-card border-2 p-5 transition-all duration-200 hover:border-primary/30 overflow-hidden">
					<div className="flex items-center justify-between gap-2">
						<div className="min-w-0 flex-1">
							<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("pricing.studies.stats.totalValue")}</p>
							<p className="text-lg sm:text-2xl font-semibold mt-2 text-chart-4 break-words leading-snug">{formatSAR(stats.totalValue)}</p>
						</div>
						<div className="flex size-11 items-center justify-center rounded-2xl bg-chart-4/15 text-chart-4 shrink-0 max-sm:hidden">
							<TrendingUp className="h-5 w-5" />
						</div>
					</div>
				</div>
			</div>

			{/* بحث + زر فلترة (الحالة داخله) + إنشاء — صف واحد للجوال والكمبيوتر */}
			<div className="flex items-center gap-2">
				<div className="relative min-w-0 flex-1 sm:max-w-md">
					<Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("pricing.studies.searchPlaceholder")}
						value={searchTerm}
						onChange={(e: any) => setSearchTerm(e.target.value)}
						className="pe-10 bg-card border-border rounded-xl focus:ring-1 focus:ring-ring"
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
							<SelectItem value="in_progress">{t("pricing.studies.status.in_progress")}</SelectItem>
							<SelectItem value="completed">{t("pricing.studies.status.completed")}</SelectItem>
						</SelectContent>
					</Select>
				</MobileFilterSheet>
				<div className="sm:hidden">
					<Button
						size="icon"
						aria-label={t("pricing.studies.newStudy")}
						onClick={() => setShowCreateDialog(true)}
						className="h-10 w-10 shrink-0 rounded-xl"
					>
						<Plus className="h-5 w-5" />
					</Button>
				</div>
				<div className="hidden sm:block shrink-0">
					<Button onClick={() => setShowCreateDialog(true)} className="rounded-xl">
						<Plus className="me-2 h-4 w-4" />
						{t("pricing.studies.newStudy")}
					</Button>
				</div>
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
					<div className="p-5 rounded-2xl bg-muted mb-5">
						<FolderKanban className="h-12 w-12 text-muted-foreground" />
					</div>
					<h3 className="text-lg font-medium text-card-foreground">{t("pricing.studies.empty")}</h3>
					<p className="text-muted-foreground mt-2 max-w-sm text-sm">
						{t("pricing.studies.emptyDescription")}
					</p>
					<Button onClick={() => setShowCreateDialog(true)} className="mt-5 rounded-xl">
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
