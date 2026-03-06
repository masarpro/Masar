"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import {
	Plus,
	UserSearch,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDebounceValue } from "usehooks-ts";
import { LeadsFilters } from "./LeadsFilters";
import { LeadCard } from "./LeadCard";
import { LeadStatsCards } from "./LeadStatsCards";

interface LeadsListPageProps {
	organizationId: string;
	organizationSlug: string;
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

	return (
		<div className="space-y-6" dir="rtl">
			{/* Stats Cards */}
			<LeadStatsCards organizationId={organizationId} />

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
					<div className="rounded-2xl border border-slate-200/60 bg-white shadow-lg shadow-black/5 dark:border-slate-700/50 dark:bg-slate-900/50 p-5 mb-5">
						<UserSearch className="h-12 w-12 text-slate-400 dark:text-slate-500" />
					</div>
					<h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
						{t("pricing.leads.empty")}
					</h3>
					<p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm">
						{t("pricing.leads.emptyDescription")}
					</p>
					<Button asChild className="mt-5 rounded-xl gap-2">
						<Link href={`${basePath}/new`}>
							<Plus className="h-4 w-4" />
							{t("pricing.leads.create")}
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
