"use client";

import { formatSAR } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";
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
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { useMemo, useState } from "react";

interface SubcontractsListViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

const STATUS_STYLES: Record<
	string,
	{ bg: string; text: string }
> = {
	DRAFT: {
		bg: "bg-muted dark:bg-muted",
		text: "text-muted-foreground dark:text-muted-foreground",
	},
	ACTIVE: {
		bg: "bg-chart-4/15 dark:bg-chart-4/20",
		text: "text-chart-4 dark:text-chart-4",
	},
	SUSPENDED: {
		bg: "bg-chart-1/20 dark:bg-chart-1/25",
		text: "text-chart-1 dark:text-chart-1",
	},
	COMPLETED: {
		bg: "bg-chart-4/15 dark:bg-chart-4/20",
		text: "text-chart-4 dark:text-chart-4",
	},
	TERMINATED: {
		bg: "bg-destructive/15 dark:bg-destructive/20",
		text: "text-destructive dark:text-destructive",
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
		return <ListTableSkeleton />;
	}

	return (
		<div className="w-full max-w-full space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-xl font-semibold text-muted-foreground dark:text-muted-foreground">
						{t("subcontracts.title")}
					</h2>
					<p className="text-sm text-muted-foreground">
						{t("subcontracts.empty.description")}
					</p>
				</div>
				<Link href={`${basePath}/new`}>
					<Button
						size="sm"
						className="rounded-xl bg-chart-1 text-white hover:bg-chart-1 dark:bg-chart-1 dark:hover:bg-chart-1"
					>
						<Plus className="me-1.5 h-4 w-4" />
						{t("subcontracts.newContract")}
					</Button>
				</Link>
			</div>

			{/* Summary Cards */}
			{summary && summary.contractsCount > 0 && (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
					<div className="rounded-xl bg-chart-1/20 p-4 dark:bg-chart-1/25">
						<div className="flex items-center gap-2">
							<div className="rounded-lg bg-chart-1/20 p-2 dark:bg-chart-1/25">
								<FileText className="h-4 w-4 text-chart-1 dark:text-chart-1" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-chart-1 dark:text-chart-1">
									{t("subcontracts.summary.totalValue")}
								</p>
								<p className="truncate text-sm font-semibold text-chart-1 dark:text-chart-1">
									{formatSAR(summary.totalValue)}
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-xl bg-chart-1/20 p-4 dark:bg-chart-1/25">
						<div className="flex items-center gap-2">
							<div className="rounded-lg bg-chart-1/20 p-2 dark:bg-chart-1/25">
								<TrendingUp className="h-4 w-4 text-chart-1 dark:text-chart-1" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-chart-1 dark:text-chart-1">
									{t("subcontracts.summary.changeOrders")}
								</p>
								<p className="truncate text-sm font-semibold text-chart-1 dark:text-chart-1">
									{formatSAR(summary.coImpact)}
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-xl bg-destructive/15 p-4 dark:bg-destructive/20">
						<div className="flex items-center gap-2">
							<div className="rounded-lg bg-destructive/15 p-2 dark:bg-destructive/20">
								<TrendingDown className="h-4 w-4 text-destructive dark:text-destructive" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-destructive dark:text-destructive">
									{t("subcontracts.summary.totalPaid")}
								</p>
								<p className="truncate text-sm font-semibold text-destructive dark:text-destructive">
									{formatSAR(summary.totalPaid)}
								</p>
							</div>
						</div>
					</div>
					<div className="rounded-xl bg-chart-4/15 p-4 dark:bg-chart-4/20">
						<div className="flex items-center gap-2">
							<div className="rounded-lg bg-chart-4/15 p-2 dark:bg-chart-4/20">
								<Wallet className="h-4 w-4 text-chart-4 dark:text-chart-4" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-chart-4 dark:text-chart-4">
									{t("subcontracts.summary.remaining")}
								</p>
								<p className="truncate text-sm font-semibold text-chart-4 dark:text-chart-4">
									{formatSAR(summary.remaining)}
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
							<Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={searchQuery}
								onChange={(e: any) => setSearchQuery(e.target.value)}
								placeholder={t("subcontracts.list.searchPlaceholder")}
								className="rounded-xl ps-10"
							/>
						</div>

						{/* Status segmented control */}
						<div className="flex rounded-xl border border-border bg-muted p-0.5 dark:border-border dark:bg-muted">
							<button
								type="button"
								onClick={() => setStatusFilter("_all")}
								className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
									statusFilter === "_all"
										? "bg-white text-muted-foreground shadow-sm dark:bg-muted dark:text-muted-foreground"
										: "text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-muted-foreground"
								}`}
							>
								{t("subcontracts.list.allStatuses")}
							</button>
							<button
								type="button"
								onClick={() => setStatusFilter("ACTIVE")}
								className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
									statusFilter === "ACTIVE"
										? "bg-white text-muted-foreground shadow-sm dark:bg-muted dark:text-muted-foreground"
										: "text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-muted-foreground"
								}`}
							>
								{t("subcontracts.status.ACTIVE")}
							</button>
							<button
								type="button"
								onClick={() => setStatusFilter("DRAFT")}
								className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
									statusFilter === "DRAFT"
										? "bg-white text-muted-foreground shadow-sm dark:bg-muted dark:text-muted-foreground"
										: "text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-muted-foreground"
								}`}
							>
								{t("subcontracts.status.DRAFT")}
							</button>
							<button
								type="button"
								onClick={() => setStatusFilter("COMPLETED")}
								className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
									statusFilter === "COMPLETED"
										? "bg-white text-muted-foreground shadow-sm dark:bg-muted dark:text-muted-foreground"
										: "text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-muted-foreground"
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
							onValueChange={(v: any) => setSortBy(v as "date" | "value" | "name")}
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
								className="h-8 rounded-lg px-2 text-xs text-muted-foreground"
							>
								<X className="me-1 h-3 w-3" />
								{t("common.clear")}
							</Button>
						)}

						{/* Results count */}
						<span className="text-xs text-muted-foreground">
							{t("subcontracts.list.resultsCount", { count: filteredContracts.length })}
						</span>
					</div>
				</div>
			)}

			{/* Empty State */}
			{(!contracts || contracts.length === 0) && (
				<EmptyState
					icon={<Hammer className="h-10 w-10" />}
					title={t("subcontracts.empty.title")}
					description={t("subcontracts.empty.description")}
				>
					<Link href={`${basePath}/new`}>
						<Button className="rounded-xl bg-chart-1 text-white hover:bg-chart-1">
							<Plus className="me-2 h-4 w-4" />
							{t("subcontracts.empty.action")}
						</Button>
					</Link>
				</EmptyState>
			)}

			{/* No results after filter */}
			{contracts && contracts.length > 0 && filteredContracts.length === 0 && (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<div className="mb-4 rounded-2xl bg-muted p-4 dark:bg-muted">
						<Search className="h-8 w-8 text-muted-foreground" />
					</div>
					<p className="text-sm text-muted-foreground dark:text-muted-foreground">
						{t("subcontracts.list.noResults")}
					</p>
					<Button
						variant="ghost"
						size="sm"
						onClick={clearFilters}
						className="mt-2 text-xs text-chart-1"
					>
						{t("common.clear")}
					</Button>
				</div>
			)}

			{/* Contract List */}
			{filteredContracts.length > 0 && (
				<div className="overflow-hidden rounded-xl border border-border dark:border-border">
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
									className={`flex flex-col gap-3 p-4 transition-colors hover:bg-muted dark:hover:bg-muted sm:flex-row sm:items-center sm:gap-4 ${
										idx !== filteredContracts.length - 1
											? "border-b border-border dark:border-border"
											: ""
									}`}
								>
									{/* Right section: Name & Status */}
									<div className="flex min-w-0 flex-1 items-start gap-3">
										{/* Icon */}
										<div className="mt-0.5 shrink-0 rounded-lg bg-chart-1/20 p-2 dark:bg-chart-1/25">
											<Hammer className="h-4 w-4 text-chart-1 dark:text-chart-1" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<h3 className="truncate text-sm font-semibold text-muted-foreground dark:text-muted-foreground">
													{contract.name}
												</h3>
												<Badge
													className={`shrink-0 border-0 text-[10px] ${statusStyle.bg} ${statusStyle.text}`}
												>
													{t(`subcontracts.status.${contract.status}`)}
												</Badge>
											</div>
											<div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground dark:text-muted-foreground">
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
												<span className="text-sm font-bold text-chart-1 dark:text-chart-1">
													{formatSAR(contract.adjustedValue)}
												</span>
												<span className="text-[10px] font-medium text-muted-foreground">
													{progress.toFixed(0)}%
												</span>
											</div>
											<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-muted">
												<div
													className="h-full rounded-full bg-chart-1 transition-all"
													style={{ width: `${progress}%` }}
												/>
											</div>
											<div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
												<span>
													{t("subcontracts.card.paid")}: {formatSAR(contract.totalPaid)}
												</span>
												<span>
													{t("subcontracts.summary.remaining")}: {formatSAR(contract.remaining)}
												</span>
											</div>
										</div>
									</div>

									{/* Left section: Date & Counts */}
									<div className="flex items-center gap-4 text-xs text-muted-foreground dark:text-muted-foreground sm:w-36 sm:shrink-0 sm:flex-col sm:items-end sm:gap-1">
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
												<span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] dark:bg-muted">
													{contract._count.payments} {t("subcontracts.detail.paymentsHistory")}
												</span>
											)}
											{contract._count.changeOrders > 0 && (
												<span className="rounded-md bg-chart-1/20 px-1.5 py-0.5 text-[10px] text-chart-1 dark:bg-chart-1/25 dark:text-chart-1">
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
