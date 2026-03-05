"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDebounceValue } from "usehooks-ts";
import { LeadStatsCards } from "./LeadStatsCards";
import { LeadsFilters } from "./LeadsFilters";
import { LeadsTable } from "./LeadsTable";

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

	const { data, isLoading } = useQuery(
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

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-xl font-bold text-foreground">
						{t("pricing.leads.title")}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t("pricing.leads.subtitle")}
					</p>
				</div>
				<Button asChild className="rounded-xl gap-1.5">
					<Link href={`${basePath}/new`}>
						<Plus className="h-4 w-4" />
						{t("pricing.leads.create")}
					</Link>
				</Button>
			</div>

			{/* Stats */}
			<LeadStatsCards organizationId={organizationId} />

			{/* Filters */}
			<LeadsFilters
				search={search}
				status={status}
				source={source}
				priority={priority}
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
			) : (
				<>
					{/* Table */}
					<LeadsTable
						leads={data?.items ?? []}
						organizationId={organizationId}
						organizationSlug={organizationSlug}
					/>

					{/* Pagination */}
					{data && data.totalPages > 1 && (
						<div className="flex items-center justify-center gap-4">
							<Button
								variant="outline"
								size="sm"
								className="rounded-xl"
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
							>
								{t("pricing.leads.pagination.previous")}
							</Button>
							<span className="text-sm text-muted-foreground">
								{t("pricing.leads.pagination.pageOf", {
									page: data.page,
									total: data.totalPages,
								})}
							</span>
							<Button
								variant="outline"
								size="sm"
								className="rounded-xl"
								disabled={page >= data.totalPages}
								onClick={() => setPage((p) => p + 1)}
							>
								{t("pricing.leads.pagination.next")}
							</Button>
						</div>
					)}
				</>
			)}
		</div>
	);
}
