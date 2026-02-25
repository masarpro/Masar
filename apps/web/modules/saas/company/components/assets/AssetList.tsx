"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
import { Plus, Search, Package, CheckCircle2, Banknote, Wrench } from "lucide-react";
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

	const { data, isLoading } = useQuery(
		orpc.company.assets.list.queryOptions({
			input: {
				organizationId,
				query: search || undefined,
				category: categoryFilter !== "all" ? (categoryFilter as typeof ASSET_CATEGORIES[number]) : undefined,
				status: statusFilter !== "all" ? (statusFilter as typeof ASSET_STATUSES[number]) : undefined,
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
		return new Intl.NumberFormat("ar-SA").format(Number(amount)) + " ر.س";
	};

	const getStatusBadge = (status: string) => {
		const styles: Record<string, string> = {
			AVAILABLE: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
			IN_USE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
			MAINTENANCE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
			RETIRED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
		};
		return (
			<Badge className={`border-0 text-[10px] px-2 py-0.5 ${styles[status] ?? styles.RETIRED}`}>
				{t(`company.assets.statuses.${status}`)}
			</Badge>
		);
	};

	return (
		<div className="space-y-6" dir="rtl">
			{/* Summary Cards - Glass Morphism */}
			{summary && (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30">
								<CheckCircle2 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
							</div>
						</div>
						<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
							{t("company.assets.available")}
						</p>
						<p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
							{summary.available}
						</p>
					</div>

					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
								<Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>
						</div>
						<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
							{t("company.assets.inUse")}
						</p>
						<p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
							{summary.inUse}
						</p>
					</div>

					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
								<Banknote className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
							</div>
						</div>
						<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
							{t("company.assets.totalValue")}
						</p>
						<p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
							{formatCurrency(summary.totalValue)}
						</p>
					</div>

					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
								<Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
							</div>
						</div>
						<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
							{t("company.assets.monthlyRent")}
						</p>
						<p className="text-xl font-bold text-orange-700 dark:text-orange-300">
							{formatCurrency(summary.totalMonthlyRent)}
						</p>
					</div>
				</div>
			)}

			{/* Search and Filter Bar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<div className="relative max-w-md flex-1">
						<Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<Input
							placeholder={t("company.assets.searchPlaceholder")}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl pr-10 focus:ring-1 focus:ring-primary/30"
						/>
					</div>
					<Select value={categoryFilter} onValueChange={setCategoryFilter}>
						<SelectTrigger className="w-[160px] rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
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
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[140px] rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
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
					className="rounded-xl bg-slate-900 text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
				>
					<Plus className="ml-2 h-4 w-4" />
					{t("company.assets.addAsset")}
				</Button>
			</div>

			{/* Table - Glass Morphism */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<Table className="table-fixed w-full">
					<TableHeader>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-transparent">
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[22%]">{t("company.assets.name")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[18%]">{t("company.assets.category")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[14%]">{t("company.assets.type")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[18%]">{t("company.assets.value")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[12%]">{t("company.assets.status")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[16%]">{t("company.assets.currentProject")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i} className="border-white/10 dark:border-slate-700/30">
									{[...Array(6)].map((_, j) => (
										<TableCell key={j}>
											<div className="h-4 animate-pulse rounded bg-muted" />
										</TableCell>
									))}
								</TableRow>
							))
						) : data?.assets?.length ? (
							data.assets.map((asset, index) => (
								<TableRow
									key={asset.id}
									className="cursor-pointer border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
									onClick={() => router.push(`/app/${organizationSlug}/company/assets/${asset.id}`)}
								>
									<TableCell className="text-right">
										<div>
											<p className="font-medium text-slate-900 dark:text-slate-100 truncate">{asset.name}</p>
											{asset.assetNo && <p className="text-xs text-slate-400">{asset.assetNo}</p>}
										</div>
									</TableCell>
									<TableCell className="text-right text-slate-600 dark:text-slate-300">
										{t(`company.assets.categories.${asset.category}`)}
									</TableCell>
									<TableCell className="text-right text-slate-600 dark:text-slate-300">
										{t(`company.assets.types.${asset.type}`)}
									</TableCell>
									<TableCell className="text-right font-semibold text-slate-700 dark:text-slate-300">
										{formatCurrency(asset.currentValue ?? asset.purchasePrice)}
									</TableCell>
									<TableCell className="text-right">{getStatusBadge(asset.status)}</TableCell>
									<TableCell className="text-right">
										{asset.currentProject ? (
											<Badge variant="outline" className="text-[10px] rounded-lg border-slate-200/50 dark:border-slate-700/50 px-2 py-0.5">
												{asset.currentProject.name}
											</Badge>
										) : (
											<span className="text-xs text-slate-400">-</span>
										)}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-16">
									<div className="flex flex-col items-center">
										<div className="mb-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-xl p-5">
											<Package className="h-10 w-10 text-slate-400 dark:text-slate-500" />
										</div>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{t("company.assets.noAssets")}
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

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
