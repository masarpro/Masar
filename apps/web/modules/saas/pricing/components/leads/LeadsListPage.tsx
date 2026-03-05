"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import {
	Banknote,
	ChevronLeft,
	Clock,
	Plus,
	TrendingUp,
	Users,
	UserSearch,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDebounceValue } from "usehooks-ts";
import { LeadsFilters } from "./LeadsFilters";
import { LeadCard } from "./LeadCard";

interface LeadsListPageProps {
	organizationId: string;
	organizationSlug: string;
}

function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-SA", {
		style: "decimal",
		maximumFractionDigits: 0,
	}).format(amount);
}

export function LeadsListPage({ organizationId, organizationSlug }: LeadsListPageProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/pricing/leads`;

	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("");
	const [source, setSource] = useState("");
	const [priority, setPriority] = useState("");
	const [page, setPage] = useState(1);

	const [debouncedSearch] = useDebounceValue(search, 300);

	const { data: stats } = useQuery(
		orpc.pricing.leads.getStats.queryOptions({
			input: { organizationId },
		}),
	);

	const { data, isLoading, refetch } = useQuery(
		orpc.pricing.leads.list.queryOptions({
			input: {
				organizationId,
				search: debouncedSearch || undefined,
				status: status || undefined,
				source: source || undefined,
				priority: priority || undefined,
				page,
				limit: 20,
			},
		}),
	);

	const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
		setter(v);
		setPage(1);
	};

	const handleReset = () => {
		setSearch("");
		setStatus("");
		setSource("");
		setPriority("");
		setPage(1);
	};

	const leads = data?.items ?? [];
	const openCount = stats
		? (stats.byStatus.NEW ?? 0) +
			(stats.byStatus.STUDYING ?? 0) +
			(stats.byStatus.QUOTED ?? 0) +
			(stats.byStatus.NEGOTIATING ?? 0)
		: 0;

	return (
		<div className="space-y-6">
			{/* Hero Header */}
			<div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 p-6">
				{/* Decorative Background */}
				<div className="absolute inset-0 opacity-10">
					<div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
					<div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-3xl" />
				</div>

				<div className="relative flex items-center justify-between">
					<div>
						{/* Breadcrumb */}
						<div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
							<span>{t("pricing.title")}</span>
							<ChevronLeft className="h-3 w-3" />
							<span className="text-white">{t("pricing.leads.title")}</span>
						</div>
						<h1 className="text-2xl font-bold text-white">
							{t("pricing.leads.title")}
						</h1>
						<p className="text-slate-400 text-sm mt-1">
							{t("pricing.leads.subtitle")}
						</p>
					</div>
					<Button asChild size="lg" className="gap-2">
						<Link href={`${basePath}/new`}>
							<Plus className="h-4 w-4" />
							{t("pricing.leads.create")}
						</Link>
					</Button>
				</div>

				{/* Stats Row */}
				{stats && (
					<div className="relative grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
						{/* Total */}
						<div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
							<div className="flex items-center gap-2 text-slate-300 text-xs mb-1">
								<Users className="h-3 w-3" />
								{t("pricing.leads.stats.total")}
							</div>
							<p className="text-2xl font-bold text-white">{stats.total}</p>
						</div>

						{/* Open */}
						<div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10">
							<div className="flex items-center gap-2 text-slate-300 text-xs mb-1">
								<Clock className="h-3 w-3" />
								{t("pricing.leads.stats.open")}
							</div>
							<p className="text-2xl font-bold text-white">{openCount}</p>
						</div>

						{/* Won */}
						<div className="bg-green-500/20 backdrop-blur rounded-xl p-3 border border-green-500/20">
							<div className="flex items-center gap-2 text-green-300 text-xs mb-1">
								<TrendingUp className="h-3 w-3" />
								{t("pricing.leads.stats.won")}
							</div>
							<p className="text-2xl font-bold text-green-400">
								{stats.byStatus?.WON ?? 0}
							</p>
						</div>

						{/* Estimated Value */}
						<div className="bg-blue-500/20 backdrop-blur rounded-xl p-3 border border-blue-500/20">
							<div className="flex items-center gap-2 text-blue-300 text-xs mb-1">
								<Banknote className="h-3 w-3" />
								{t("pricing.leads.stats.estimatedValue")}
							</div>
							<p className="text-lg font-bold text-blue-300">
								{formatCurrency(stats.openEstimatedValue)} <span className="text-xs font-normal">ر.س</span>
							</p>
						</div>
					</div>
				)}
			</div>

			{/* Filters */}
			<LeadsFilters
				search={search}
				status={status}
				source={source}
				priority={priority}
				stats={stats}
				onSearchChange={handleFilterChange(setSearch)}
				onStatusChange={handleFilterChange(setStatus)}
				onSourceChange={handleFilterChange(setSource)}
				onPriorityChange={handleFilterChange(setPriority)}
				onReset={handleReset}
			/>

			{/* Loading */}
			{isLoading ? (
				<div className="flex items-center justify-center py-20">
					<div className="relative">
						<div className="h-16 w-16 rounded-full border-4 border-primary/20" />
						<div className="absolute left-0 top-0 h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					</div>
				</div>
			) : leads.length > 0 ? (
				<>
					{/* Card Grid */}
					<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{leads.map((lead, index) => (
							<div
								key={lead.id}
								className="animate-in fade-in slide-in-from-bottom-4 duration-500"
								style={{ animationDelay: `${index * 50}ms` }}
							>
								<LeadCard
									lead={lead}
									basePath={basePath}
									organizationId={organizationId}
									onDelete={refetch}
								/>
							</div>
						))}
					</div>

					{/* Pagination */}
					{data && data.totalPages > 1 && (
						<div className="flex items-center justify-center gap-4 pt-2">
							<Button
								variant="outline"
								size="sm"
								className="rounded-xl border-slate-200 dark:border-slate-800"
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
							>
								{t("pricing.leads.pagination.previous")}
							</Button>
							<span className="text-sm text-slate-500 dark:text-slate-400">
								{t("pricing.leads.pagination.pageOf", {
									page: data.page,
									total: data.totalPages,
								})}
							</span>
							<Button
								variant="outline"
								size="sm"
								className="rounded-xl border-slate-200 dark:border-slate-800"
								disabled={page >= data.totalPages}
								onClick={() => setPage((p) => p + 1)}
							>
								{t("pricing.leads.pagination.next")}
							</Button>
						</div>
					)}
				</>
			) : (
				/* Empty State */
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 mb-5">
						<UserSearch className="h-12 w-12 text-slate-400 dark:text-slate-500" />
					</div>
					<h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
						{t("pricing.leads.empty")}
					</h3>
					<p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm">
						{t("pricing.leads.emptyDescription")}
					</p>
					<Button asChild className="mt-5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200">
						<Link href={`${basePath}/new`}>
							<Plus className="me-2 h-4 w-4" />
							{t("pricing.leads.create")}
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
