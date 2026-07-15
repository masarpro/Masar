"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { formatCurrencySuffixed } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { EmptyState } from "@ui/components/empty-state";
import { Plus, Search, Package, CheckCircle2, Banknote, Wrench } from "lucide-react";
import { Pagination } from "@saas/shared/components/Pagination";
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
import { MobileDocList, MobileDocRow } from "@saas/shared/components/mobile/MobileDocRow";
import { AddAssetDialog } from "./AddAssetDialog";

interface AssetListProps {
	organizationId: string;
	organizationSlug: string;
}

const ASSET_CATEGORIES = [
	"HEAVY_EQUIPMENT", "LIGHT_EQUIPMENT", "VEHICLES", "TOOLS",
	"IT_EQUIPMENT", "FURNITURE", "SAFETY_EQUIPMENT", "SURVEYING", "OTHER",
] as const;

const ASSET_STATUSES = ["AVAILABLE", "IN_USE", "MAINTENANCE", "RETIRED"] as const;

export function AssetList({ organizationId, organizationSlug }: AssetListProps) {
	const t = useTranslations();
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);

	const PAGE_SIZE = 20;

	const { data, isLoading } = useQuery(
		orpc.company.assets.list.queryOptions({
			input: {
				organizationId,
				query: search || undefined,
				category: categoryFilter !== "all" ? (categoryFilter as typeof ASSET_CATEGORIES[number]) : undefined,
				status: statusFilter !== "all" ? (statusFilter as typeof ASSET_STATUSES[number]) : undefined,
				limit: PAGE_SIZE,
				offset: (currentPage - 1) * PAGE_SIZE,
			},
		}),
	);

	const { data: summary } = useQuery(
		orpc.company.assets.getSummary.queryOptions({
			input: { organizationId },
		}),
	);

	const formatCurrency = (amount: number | string | null | undefined) => {
		if (!amount) return "-";
		return formatCurrencySuffixed(Number(amount), t("common.sar"), 0);
	};

	const getStatusBadge = (status: string) => {
		const styles: Record<string, string> = {
			AVAILABLE: "bg-chart-4/15 text-chart-4",
			IN_USE: "bg-chart-4/15 text-chart-4",
			MAINTENANCE: "bg-chart-1/15 text-chart-1",
			RETIRED: "bg-muted text-muted-foreground",
		};
		return (
			<Badge className={`border-0 text-[10px] px-2 py-0.5 ${styles[status] ?? styles.RETIRED}`}>
				{t(`company.assets.statuses.${status}`)}
			</Badge>
		);
	};

	return (
		<div className="space-y-6">
			{/* Summary Cards - Glass Morphism */}
			{summary && (
				<>
					{/* الجوال: شريط إحصائيات مضغوط */}
					<CompactStatGrid
						className="sm:hidden"
						items={[
							{
								label: t("company.assets.available"),
								value: summary.available,
								icon: CheckCircle2,
								iconClassName: "text-chart-4",
								iconBgClassName: "bg-chart-4/15",
							},
							{
								label: t("company.assets.inUse"),
								value: summary.inUse,
								icon: Package,
								iconClassName: "text-chart-4",
								iconBgClassName: "bg-chart-4/15",
							},
							{
								label: t("company.assets.totalValue"),
								value: formatCurrency(summary.totalValue),
								icon: Banknote,
								iconClassName: "text-chart-4",
								iconBgClassName: "bg-chart-4/15",
								valueClassName: "text-chart-4",
							},
							{
								label: t("company.assets.monthlyRent"),
								value: formatCurrency(summary.totalMonthlyRent),
								icon: Wrench,
								iconClassName: "text-chart-1",
								iconBgClassName: "bg-chart-1/15",
								valueClassName: "text-chart-1",
							},
						]}
					/>

					{/* الديسكتوب كما هو */}
					<div className="hidden sm:grid sm:grid-cols-2 gap-4 lg:grid-cols-4">
					<div className="bg-card border-2 rounded-2xl p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
								<CheckCircle2 className="h-5 w-5" />
							</div>
						</div>
						<p className="text-xs font-medium text-muted-foreground mb-1">
							{t("company.assets.available")}
						</p>
						<p className="text-2xl font-bold text-chart-4">
							{summary.available}
						</p>
					</div>

					<div className="bg-card border-2 rounded-2xl p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
								<Package className="h-5 w-5" />
							</div>
						</div>
						<p className="text-xs font-medium text-muted-foreground mb-1">
							{t("company.assets.inUse")}
						</p>
						<p className="text-2xl font-bold text-chart-4">
							{summary.inUse}
						</p>
					</div>

					<div className="bg-card border-2 rounded-2xl p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
								<Banknote className="h-5 w-5" />
							</div>
						</div>
						<p className="text-xs font-medium text-muted-foreground mb-1">
							{t("company.assets.totalValue")}
						</p>
						<p className="text-xl font-bold text-chart-4">
							{formatCurrency(summary.totalValue)}
						</p>
					</div>

					<div className="bg-card border-2 rounded-2xl p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex size-9 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
								<Wrench className="h-5 w-5" />
							</div>
						</div>
						<p className="text-xs font-medium text-muted-foreground mb-1">
							{t("company.assets.monthlyRent")}
						</p>
						<p className="text-xl font-bold text-chart-1">
							{formatCurrency(summary.totalMonthlyRent)}
						</p>
					</div>
					</div>
				</>
			)}

			{/* الجوال: بحث + ورقة فلاتر + زر إضافة مضغوط في صف واحد */}
			<div className="flex items-center gap-2 sm:hidden">
				<div className="relative min-w-0 flex-1">
					<Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("company.assets.searchPlaceholder")}
						value={search}
						onChange={(e: any) => { setSearch(e.target.value); setCurrentPage(1); }}
						className="rounded-lg border border-input bg-card pe-10"
					/>
				</div>
				<MobileFilterSheet activeCount={(categoryFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0)}>
					<Select value={categoryFilter} onValueChange={(v: any) => { setCategoryFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-full rounded-xl">
							<SelectValue placeholder={t("company.assets.filterCategory")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							{ASSET_CATEGORIES.map((cat) => (
								<SelectItem key={cat} value={cat}>
									{t(`company.assets.categories.${cat}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-full rounded-xl">
							<SelectValue placeholder={t("company.assets.filterStatus")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							{ASSET_STATUSES.map((s) => (
								<SelectItem key={s} value={s}>
									{t(`company.assets.statuses.${s}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</MobileFilterSheet>
				<Button
					size="icon"
					aria-label={t("company.assets.addAsset")}
					onClick={() => setShowAddDialog(true)}
					className="h-10 w-10 shrink-0 rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Plus className="h-5 w-5" />
				</Button>
			</div>

			{/* Search and Filter Bar (الديسكتوب كما هو) */}
			<div className="hidden gap-4 sm:flex sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<div className="relative max-w-md flex-1">
						<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder={t("company.assets.searchPlaceholder")}
							value={search}
							onChange={(e: any) => { setSearch(e.target.value); setCurrentPage(1); }}
							className="rounded-lg border border-input bg-card pe-10"
						/>
					</div>
					<Select value={categoryFilter} onValueChange={(v: any) => { setCategoryFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-[160px] rounded-lg border border-input bg-card">
							<SelectValue placeholder={t("company.assets.filterCategory")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							{ASSET_CATEGORIES.map((cat) => (
								<SelectItem key={cat} value={cat}>
									{t(`company.assets.categories.${cat}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-[140px] rounded-lg border border-input bg-card">
							<SelectValue placeholder={t("company.assets.filterStatus")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							{ASSET_STATUSES.map((s) => (
								<SelectItem key={s} value={s}>
									{t(`company.assets.statuses.${s}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button
					onClick={() => setShowAddDialog(true)}
					className="rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Plus className="ms-2 h-4 w-4" />
					{t("company.assets.addAsset")}
				</Button>
			</div>

			{/* الجوال: صفوف مستندات بسطرين بدل الجدول متعدد الأعمدة */}
			{(data?.assets?.length ?? 0) > 0 && (
				<MobileDocList className="sm:hidden">
					{data?.assets?.map((asset: any) => (
						<MobileDocRow
							key={asset.id}
							href={`/app/${organizationSlug}/company/assets/${asset.id}`}
							title={asset.name}
							subtitle={
								<>
									{asset.assetNo && (
										<>
											<span dir="ltr" className="whitespace-nowrap">
												{asset.assetNo}
											</span>
											{" · "}
										</>
									)}
									{t(`company.assets.categories.${asset.category}`)}
								</>
							}
							amount={formatCurrency(Number(asset.currentValue ?? asset.purchasePrice))}
							badge={getStatusBadge(asset.status)}
						/>
					))}
				</MobileDocList>
			)}

			{/* Table - Glass Morphism */}
			<div className="hidden sm:block bg-card border-2 rounded-2xl overflow-x-auto">
				<Table className="table-fixed w-full min-w-[760px]">
					<TableHeader>
						<TableRow className="border-b-2 hover:bg-transparent">
							<TableHead className="text-end text-muted-foreground w-[22%]">{t("company.assets.name")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[18%]">{t("company.assets.category")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[14%]">{t("company.assets.type")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[18%]">{t("company.assets.value")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[12%]">{t("company.assets.status")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[16%]">{t("company.assets.currentProject")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i} className="border-b-2">
									{[...Array(6)].map((_, j) => (
										<TableCell key={j}>
											<div className="h-4 animate-pulse rounded bg-muted" />
										</TableCell>
									))}
								</TableRow>
							))
						) : data?.assets?.length ? (
							data.assets.map((asset: any, index: any) => (
								<TableRow
									key={asset.id}
									className="cursor-pointer border-b-2 hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
									onClick={() => router.push(`/app/${organizationSlug}/company/assets/${asset.id}`)}
								>
									<TableCell className="text-end">
										<div>
											<p className="font-medium text-card-foreground truncate">{asset.name}</p>
											{asset.assetNo && <p className="text-xs text-muted-foreground">{asset.assetNo}</p>}
										</div>
									</TableCell>
									<TableCell className="text-end text-muted-foreground">
										{t(`company.assets.categories.${asset.category}`)}
									</TableCell>
									<TableCell className="text-end text-muted-foreground">
										{t(`company.assets.types.${asset.type}`)}
									</TableCell>
									<TableCell className="text-end font-semibold text-card-foreground">
										{formatCurrency(Number(asset.currentValue ?? asset.purchasePrice))}
									</TableCell>
									<TableCell className="text-end">{getStatusBadge(asset.status)}</TableCell>
									<TableCell className="text-end">
										{asset.currentProject ? (
											<Badge variant="outline" className="text-[10px] rounded-lg px-2 py-0.5">
												{asset.currentProject.name}
											</Badge>
										) : (
											<span className="text-xs text-muted-foreground">-</span>
										)}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6}>
									<EmptyState
										icon={<Package className="h-10 w-10" />}
										description={t("company.assets.noAssets")}
									/>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{(data?.total ?? 0) > PAGE_SIZE && (
				<Pagination
					totalItems={data?.total ?? 0}
					itemsPerPage={PAGE_SIZE}
					currentPage={currentPage}
					onChangeCurrentPage={setCurrentPage}
				/>
			)}

			{showAddDialog && (
				<AddAssetDialog
					open={showAddDialog}
					onOpenChange={setShowAddDialog}
					organizationId={organizationId}
				/>
			)}
		</div>
	);
}
