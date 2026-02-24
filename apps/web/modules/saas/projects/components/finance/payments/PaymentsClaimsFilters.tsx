"use client";

import { Input } from "@ui/components/input";
import { Button } from "@ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

export interface TimelineFilters {
	type: "all" | "payment" | "claim";
	status: string;
	dateFrom: string;
	dateTo: string;
	query: string;
	sortBy: "date" | "amount";
	sortOrder: "asc" | "desc";
}

interface PaymentsClaimsFiltersProps {
	filters: TimelineFilters;
	onFiltersChange: (filters: TimelineFilters) => void;
}

export function PaymentsClaimsFilters({
	filters,
	onFiltersChange,
}: PaymentsClaimsFiltersProps) {
	const t = useTranslations();
	const [searchInput, setSearchInput] = useState(filters.query);

	// Debounce search
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchInput !== filters.query) {
				onFiltersChange({ ...filters, query: searchInput });
			}
		}, 400);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const updateFilter = useCallback(
		(key: keyof TimelineFilters, value: string) => {
			onFiltersChange({ ...filters, [key]: value });
		},
		[filters, onFiltersChange],
	);

	const hasActiveFilters =
		filters.type !== "all" ||
		filters.status !== "" ||
		filters.dateFrom !== "" ||
		filters.dateTo !== "" ||
		filters.query !== "";

	const clearFilters = () => {
		setSearchInput("");
		onFiltersChange({
			type: "all",
			status: "",
			dateFrom: "",
			dateTo: "",
			query: "",
			sortBy: "date",
			sortOrder: "desc",
		});
	};

	return (
		<div className="space-y-3">
			{/* Search + Type segmented control */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				{/* Search */}
				<div className="relative flex-1">
					<Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						placeholder={t("paymentsHub.searchPlaceholder")}
						className="rounded-xl pr-10"
					/>
				</div>

				{/* Type segmented control */}
				<div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
					{(
						[
							{ value: "all", label: t("paymentsHub.allTypes") },
							{
								value: "payment",
								label: t("paymentsHub.paymentsOnly"),
							},
							{
								value: "claim",
								label: t("paymentsHub.claimsOnly"),
							},
						] as const
					).map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => updateFilter("type", opt.value)}
							className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
								filters.type === opt.value
									? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
									: "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
							}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			</div>

			{/* Status, Date Range, Sort */}
			<div className="flex flex-wrap items-center gap-2">
				{/* Status */}
				<Select
					value={filters.status || "_all"}
					onValueChange={(v) =>
						updateFilter("status", v === "_all" ? "" : v)
					}
				>
					<SelectTrigger className="h-8 w-32 rounded-lg text-xs">
						<SelectValue placeholder={t("finance.claims.status")} />
					</SelectTrigger>
					<SelectContent className="rounded-xl">
						<SelectItem value="_all">
							{t("paymentsHub.allTypes")}
						</SelectItem>
						{/* Payment statuses */}
						<SelectItem value="COMPLETED">
							{t("finance.status.PAID")}
						</SelectItem>
						<SelectItem value="PENDING">
							{t("finance.status.SUBMITTED")}
						</SelectItem>
						<SelectItem value="CANCELLED">
							{t("finance.status.REJECTED")}
						</SelectItem>
						{/* Claim statuses */}
						<SelectItem value="DRAFT">
							{t("finance.status.DRAFT")}
						</SelectItem>
						<SelectItem value="SUBMITTED">
							{t("finance.status.SUBMITTED")}
						</SelectItem>
						<SelectItem value="APPROVED">
							{t("finance.status.APPROVED")}
						</SelectItem>
						<SelectItem value="PAID">
							{t("finance.status.PAID")}
						</SelectItem>
						<SelectItem value="REJECTED">
							{t("finance.status.REJECTED")}
						</SelectItem>
					</SelectContent>
				</Select>

				{/* Date Range */}
				<div className="flex items-center gap-1.5">
					<span className="text-xs text-slate-500">
						{t("paymentsHub.from")}
					</span>
					<Input
						type="date"
						value={filters.dateFrom}
						onChange={(e) =>
							updateFilter("dateFrom", e.target.value)
						}
						className="h-8 w-32 rounded-lg text-xs"
					/>
					<span className="text-xs text-slate-500">
						{t("paymentsHub.to")}
					</span>
					<Input
						type="date"
						value={filters.dateTo}
						onChange={(e) =>
							updateFilter("dateTo", e.target.value)
						}
						className="h-8 w-32 rounded-lg text-xs"
					/>
				</div>

				{/* Sort */}
				<Select
					value={filters.sortBy}
					onValueChange={(v) =>
						updateFilter("sortBy", v as "date" | "amount")
					}
				>
					<SelectTrigger className="h-8 w-28 rounded-lg text-xs">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="rounded-xl">
						<SelectItem value="date">
							{t("paymentsHub.sortByDate")}
						</SelectItem>
						<SelectItem value="amount">
							{t("paymentsHub.sortByAmount")}
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
			</div>
		</div>
	);
}
