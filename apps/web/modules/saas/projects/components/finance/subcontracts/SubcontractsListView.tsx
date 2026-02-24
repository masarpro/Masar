"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
	FileText,
	Hammer,
	Loader2,
	Plus,
	Search,
	TrendingDown,
	TrendingUp,
	Wallet,
	X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";

interface SubcontractsListViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

const STATUS_STYLES: Record<
	string,
	{ bg: string; text: string }
> = {
	DRAFT: {
		bg: "bg-slate-100 dark:bg-slate-800",
		text: "text-slate-600 dark:text-slate-400",
	},
	ACTIVE: {
		bg: "bg-emerald-100 dark:bg-emerald-900/40",
		text: "text-emerald-700 dark:text-emerald-300",
	},
	SUSPENDED: {
		bg: "bg-amber-100 dark:bg-amber-900/40",
		text: "text-amber-700 dark:text-amber-300",
	},
	COMPLETED: {
		bg: "bg-blue-100 dark:bg-blue-900/40",
		text: "text-blue-700 dark:text-blue-300",
	},
	TERMINATED: {
		bg: "bg-red-100 dark:bg-red-900/40",
		text: "text-red-700 dark:text-red-300",
	},
};

const STATUSES = ["DRAFT", "ACTIVE", "SUSPENDED", "COMPLETED", "TERMINATED"] as const;

export function SubcontractsListView({
	organizationId,
	organizationSlug,
	projectId,
}: SubcontractsListViewProps) {
	const t = useTranslations();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("_all");
	const [sortBy, setSortBy] = useState<"date" | "value" | "name">("date");

	const { data: contracts, isLoading } = useQuery(
		orpc.subcontracts.list.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const { data: summary } = useQuery(
		orpc.subcontracts.getSummary.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/subcontracts`;

	// Client-side filtering and sorting
	const filteredContracts = useMemo(() => {
		if (!contracts) return [];

		let result = [...contracts];

		// Search filter
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			result = result.filter(
				(c) =>
					c.name.toLowerCase().includes(q) ||
					(c.contractNo && c.contractNo.toLowerCase().includes(q)) ||
					(c.companyName && c.companyName.toLowerCase().includes(q)),
			);
		}

		// Status filter
		if (statusFilter && statusFilter !== "_all") {
			result = result.filter((c) => c.status === statusFilter);
		}

		// Sort
		result.sort((a, b) => {
			if (sortBy === "value") return b.adjustedValue - a.adjustedValue;
			if (sortBy === "name") return a.name.localeCompare(b.name, "ar");
			// date (default) - newest first
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});

		return result;
	}, [contracts, searchQuery, statusFilter, sortBy]);

	const hasActiveFilters = searchQuery !== "" || statusFilter !== "_all";

	const clearFilters = () => {
		setSearchQuery("");
		setStatusFilter("_all");
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
			</div>
		);
	}

	return (
		<div className="w-full max-w-full space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
						{t("subcontracts.title")}
					</h2>
					<p className="text-sm text-slate-500">
						{t("subcontracts.empty.description")}
					</p>
				</div>
				<Link href={`${basePath}/new`}>
					<Button
						size="sm"
						className="rounded-xl bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
					>
						<Plus className="ml-1.5 h-4 w-4" />
						{t("subcontracts.newContract")}
					</Button>
				</Link>
			</div>

			{/* Summary Cards */}
			{summary && summary.contractsCount > 0 && (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
					<div className="rounded-xl bg-orange-50 p-4 dark:bg-orange-950/30">
						<div className="flex items-center gap-2">
							<div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/50">
								<FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-orange-600 dark:text-orange-400">
									{t("subcontracts.summary.totalValue")}
								</p>
								<p className="truncate text-sm font-semibold text-orange-700 dark:text-orange-300">
									{formatCurrency(summary.totalValue)}
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30">
						<div className="flex items-center gap-2">
							<div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/50">
								<TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-amber-600 dark:text-amber-400">
									{t("subcontracts.summary.changeOrders")}
								</p>
								<p className="truncate text-sm font-semibold text-amber-700 dark:text-amber-300">
									{formatCurrency(summary.coImpact)}
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/30">
						<div className="flex items-center gap-2">
							<div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/50">
								<TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-red-600 dark:text-red-400">
									{t("subcontracts.summary.totalPaid")}
								</p>
								<p className="truncate text-sm font-semibold text-red-700 dark:text-red-300">
									{formatCurrency(summary.totalPaid)}
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-xl bg-teal-50 p-4 dark:bg-teal-950/30">
						<div className="flex items-center gap-2">
							<div className="rounded-lg bg-teal-100 p-2 dark:bg-teal-900/50">
								<Wallet className="h-4 w-4 text-teal-600 dark:text-teal-400" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-teal-600 dark:text-teal-400">
									{t("subcontracts.summary.remaining")}
								</p>
								<p className="truncate text-sm font-semibold text-teal-700 dark:text-teal-300">
									{formatCurrency(summary.remaining)}
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Filters */}
			{contracts && contracts.length > 0 && (
				<div className="space-y-3">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						{/* Search */}
						<div className="relative flex-1">
							<Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<Input
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder={t("subcontracts.list.searchPlaceholder")}
								className="rounded-xl pr-10"
							/>
						</div>

						{/* Status segmented control */}
						<div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
							<button
								type="button"
								onClick={() => setStatusFilter("_all")}
								className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
									statusFilter === "_all"
										? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
										: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
								}`}
							>
								{t("subcontracts.list.allStatuses")}
							</button>
							<button
								type="button"
								onClick={() => setStatusFilter("ACTIVE")}
								className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
									statusFilter === "ACTIVE"
										? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
										: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
								}`}
							>
								{t("subcontracts.status.ACTIVE")}
							</button>
							<button
								type="button"
								onClick={() => setStatusFilter("DRAFT")}
								className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
									statusFilter === "DRAFT"
										? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
										: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
								}`}
							>
								{t("subcontracts.status.DRAFT")}
							</button>
							<button
								type="button"
								onClick={() => setStatusFilter("COMPLETED")}
								className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
									statusFilter === "COMPLETED"
										? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
										: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
								}`}
							>
								{t("subcontracts.status.COMPLETED")}
							</button>
						</div>
					</div>

					{/* Sort + Additional status + Clear */}
					<div className="flex flex-wrap items-center gap-2">
						{/* Full status select (for SUSPENDED / TERMINATED) */}
						<Select
							value={statusFilter}
							onValueChange={setStatusFilter}
						>
							<SelectTrigger className="h-8 w-32 rounded-lg text-xs">
								<SelectValue placeholder={t("subcontracts.list.filterByStatus")} />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="_all">
									{t("subcontracts.list.allStatuses")}
								</SelectItem>
								{STATUSES.map((s) => (
									<SelectItem key={s} value={s}>
										{t(`subcontracts.status.${s}`)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						{/* Sort */}
						<Select
							value={sortBy}
							onValueChange={(v) => setSortBy(v as "date" | "value" | "name")}
						>
							<SelectTrigger className="h-8 w-32 rounded-lg text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="date">
									{t("subcontracts.list.sortByDate")}
								</SelectItem>
								<SelectItem value="value">
									{t("subcontracts.list.sortByValue")}
								</SelectItem>
								<SelectItem value="name">
									{t("subcontracts.list.sortByName")}
								</SelectItem>
							</SelectContent>
						</Select>

						{/* Clear filters */}
						{hasActiveFilters && (
							<Button
								variant="ghost"
								size="sm"
								onClick={clearFilters}
								className="h-8 rounded-lg px-2 text-xs text-slate-500"
							>
								<X className="ml-1 h-3 w-3" />
								{t("common.clear")}
							</Button>
						)}

						{/* Results count */}
						<span className="text-xs text-slate-400">
							{t("subcontracts.list.resultsCount", { count: filteredContracts.length })}
						</span>
					</div>
				</div>
			)}

			{/* Empty State */}
			{(!contracts || contracts.length === 0) && (
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="mb-4 rounded-2xl bg-orange-100 p-5 dark:bg-orange-900/30">
						<Hammer className="h-10 w-10 text-orange-500" />
					</div>
					<h3 className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-300">
						{t("subcontracts.empty.title")}
					</h3>
					<p className="mb-6 max-w-sm text-sm text-slate-500 dark:text-slate-400">
						{t("subcontracts.empty.description")}
					</p>
					<Link href={`${basePath}/new`}>
						<Button className="rounded-xl bg-orange-600 text-white hover:bg-orange-700">
							<Plus className="me-2 h-4 w-4" />
							{t("subcontracts.empty.action")}
						</Button>
					</Link>
				</div>
			)}

			{/* No results after filter */}
			{contracts && contracts.length > 0 && filteredContracts.length === 0 && (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
						<Search className="h-8 w-8 text-slate-400" />
					</div>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{t("subcontracts.list.noResults")}
					</p>
					<Button
						variant="ghost"
						size="sm"
						onClick={clearFilters}
						className="mt-2 text-xs text-orange-600"
					>
						{t("common.clear")}
					</Button>
				</div>
			)}

			{/* Contract List */}
			{filteredContracts.length > 0 && (
				<div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
					{filteredContracts.map((contract, idx) => {
						const progress =
							contract.adjustedValue > 0
								? Math.min(
										(contract.totalPaid / contract.adjustedValue) * 100,
										100,
									)
								: 0;
						const statusStyle =
							STATUS_STYLES[contract.status] ?? STATUS_STYLES.DRAFT;

						return (
							<Link
								key={contract.id}
								href={`${basePath}/${contract.id}`}
								className="group block"
							>
								<div
									className={`flex flex-col gap-3 p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:flex-row sm:items-center sm:gap-4 ${
										idx !== filteredContracts.length - 1
											? "border-b border-slate-100 dark:border-slate-800"
											: ""
									}`}
								>
									{/* Right section: Name & Status */}
									<div className="flex min-w-0 flex-1 items-start gap-3">
										{/* Icon */}
										<div className="mt-0.5 shrink-0 rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
											<Hammer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
													{contract.name}
												</h3>
												<Badge
													className={`shrink-0 border-0 text-[10px] ${statusStyle.bg} ${statusStyle.text}`}
												>
													{t(`subcontracts.status.${contract.status}`)}
												</Badge>
											</div>
											<div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
												{contract.contractNo && (
													<span className="font-mono">
														{contract.contractNo}
													</span>
												)}
												{contract.contractNo && contract.companyName && (
													<span>•</span>
												)}
												{contract.companyName && (
													<span>{contract.companyName}</span>
												)}
											</div>
										</div>
									</div>

									{/* Middle section: Value & Progress */}
									<div className="flex items-center gap-4 sm:w-64 sm:shrink-0">
										<div className="min-w-0 flex-1">
											<div className="mb-1 flex items-baseline justify-between">
												<span className="text-sm font-bold text-orange-600 dark:text-orange-400">
													{formatCurrency(contract.adjustedValue)}
												</span>
												<span className="text-[10px] font-medium text-slate-500">
													{progress.toFixed(0)}%
												</span>
											</div>
											<div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
												<div
													className="h-full rounded-full bg-orange-500 transition-all"
													style={{ width: `${progress}%` }}
												/>
											</div>
											<div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
												<span>
													{t("subcontracts.card.paid")}: {formatCurrency(contract.totalPaid)}
												</span>
												<span>
													{t("subcontracts.summary.remaining")}: {formatCurrency(contract.remaining)}
												</span>
											</div>
										</div>
									</div>

									{/* Left section: Date & Counts */}
									<div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 sm:w-36 sm:shrink-0 sm:flex-col sm:items-end sm:gap-1">
										{contract.startDate && (
											<span>
												{format(
													new Date(contract.startDate),
													"dd/MM/yyyy",
													{ locale: ar },
												)}
											</span>
										)}
										<div className="flex items-center gap-2">
											{contract._count.payments > 0 && (
												<span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-800">
													{contract._count.payments} {t("subcontracts.detail.paymentsHistory")}
												</span>
											)}
											{contract._count.changeOrders > 0 && (
												<span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
													{contract._count.changeOrders} {t("subcontracts.detail.changeOrdersSection")}
												</span>
											)}
										</div>
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
}
