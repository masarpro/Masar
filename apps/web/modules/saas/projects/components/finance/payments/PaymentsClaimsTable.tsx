"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
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
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
	Banknote,
	ChevronLeft,
	ChevronRight,
	FileText,
	Loader2,
	Receipt,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
	PaymentsClaimsFilters,
	type TimelineFilters,
} from "./PaymentsClaimsFilters";

interface PaymentsClaimsTableProps {
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

function getTypeBadge(
	type: "payment" | "claim",
	t: (key: string) => string,
) {
	if (type === "payment") {
		return (
			<Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
				<Banknote className="ml-1 h-3 w-3" />
				{t("paymentsHub.typePayment")}
			</Badge>
		);
	}
	return (
		<Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
			<Receipt className="ml-1 h-3 w-3" />
			{t("paymentsHub.typeClaim")}
		</Badge>
	);
}

function getStatusBadge(
	status: string,
	type: "payment" | "claim",
	t: (key: string) => string,
) {
	const statusConfig: Record<
		string,
		{ className: string; label: string }
	> = {
		// Payment statuses
		COMPLETED: {
			className:
				"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
			label: t("finance.status.PAID"),
		},
		PENDING: {
			className:
				"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
			label: t("finance.status.SUBMITTED"),
		},
		CANCELLED: {
			className:
				"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
			label: t("finance.status.REJECTED"),
		},
		// Claim statuses
		DRAFT: {
			className:
				"bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
			label: t("finance.status.DRAFT"),
		},
		SUBMITTED: {
			className:
				"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
			label: t("finance.status.SUBMITTED"),
		},
		APPROVED: {
			className:
				"bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
			label: t("finance.status.APPROVED"),
		},
		PAID: {
			className:
				"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
			label: t("finance.status.PAID"),
		},
		REJECTED: {
			className:
				"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
			label: t("finance.status.REJECTED"),
		},
	};

	const config = statusConfig[status] ?? statusConfig.DRAFT;
	return (
		<Badge className={`border-0 ${config.className}`}>
			{config.label}
		</Badge>
	);
}

const PAGE_SIZE = 20;

export function PaymentsClaimsTable({
	organizationId,
	organizationSlug,
	projectId,
}: PaymentsClaimsTableProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [filters, setFilters] = useState<TimelineFilters>({
		type: "all",
		status: "",
		dateFrom: "",
		dateTo: "",
		query: "",
		sortBy: "date",
		sortOrder: "desc",
	});

	const [page, setPage] = useState(0);

	const { data, isLoading } = useQuery(
		orpc.projectFinance.getPaymentsClaimsTimeline.queryOptions({
			input: {
				organizationId,
				projectId,
				type: filters.type === "all" ? undefined : filters.type,
				status: filters.status || undefined,
				dateFrom: filters.dateFrom
					? new Date(filters.dateFrom)
					: undefined,
				dateTo: filters.dateTo
					? new Date(filters.dateTo)
					: undefined,
				query: filters.query || undefined,
				sortBy: filters.sortBy,
				sortOrder: filters.sortOrder,
				limit: PAGE_SIZE,
				offset: page * PAGE_SIZE,
			},
		}),
	);

	// Claim status update mutation
	const updateClaimStatusMutation = useMutation({
		...orpc.projectFinance.updateClaimStatus.mutationOptions(),
		onSuccess: () => {
			toast.success(t("finance.notifications.statusUpdated"));
			queryClient.invalidateQueries({
				queryKey: ["projectFinance"],
			});
		},
		onError: () => {
			toast.error(t("finance.notifications.statusUpdateError"));
		},
	});

	const handleClaimStatusChange = (
		claimId: string,
		newStatus: "DRAFT" | "SUBMITTED" | "APPROVED" | "PAID" | "REJECTED",
	) => {
		updateClaimStatusMutation.mutate({
			organizationId,
			projectId,
			claimId,
			status: newStatus,
		});
	};

	const handleFiltersChange = (newFilters: TimelineFilters) => {
		setFilters(newFilters);
		setPage(0); // Reset page on filter change
	};

	const items = data?.items ?? [];
	const totalCount = data?.totalCount ?? 0;
	const from = page * PAGE_SIZE + 1;
	const to = Math.min((page + 1) * PAGE_SIZE, totalCount);
	const hasNextPage = (page + 1) * PAGE_SIZE < totalCount;
	const hasPrevPage = page > 0;

	return (
		<div className="space-y-4">
			{/* Filters */}
			<PaymentsClaimsFilters
				filters={filters}
				onFiltersChange={handleFiltersChange}
			/>

			{/* Table */}
			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<Loader2 className="h-6 w-6 animate-spin text-slate-400" />
				</div>
			) : items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<div className="mb-4 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
						<FileText className="h-8 w-8 text-slate-400" />
					</div>
					<p className="text-sm text-slate-500 dark:text-slate-400">
						{t("paymentsHub.noData")}
					</p>
				</div>
			) : (
				<>
					<div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
						<Table>
							<TableHeader>
								<TableRow className="hover:bg-transparent">
									<TableHead className="text-start">
										{t("finance.payments.date")}
									</TableHead>
									<TableHead className="text-start">
										{t("paymentsHub.allTypes")}
									</TableHead>
									<TableHead className="text-start">
										{t("finance.claims.claimNo")}
									</TableHead>
									<TableHead className="text-start">
										{t("finance.claims.amount")}
									</TableHead>
									<TableHead className="text-start">
										{t("paymentsHub.milestones")}
									</TableHead>
									<TableHead className="text-start">
										{t("finance.claims.status")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{items.map((item) => (
									<TableRow key={`${item.type}-${item.id}`}>
										{/* Date */}
										<TableCell className="text-sm text-slate-600 dark:text-slate-400">
											{format(
												new Date(item.date),
												"dd/MM/yyyy",
												{ locale: ar },
											)}
										</TableCell>

										{/* Type */}
										<TableCell>
											{getTypeBadge(
												item.type,
												t,
											)}
										</TableCell>

										{/* Reference */}
										<TableCell className="font-mono text-sm">
											{item.referenceNo}
										</TableCell>

										{/* Amount */}
										<TableCell className="font-semibold">
											{formatCurrency(item.amount)}
										</TableCell>

										{/* Milestone */}
										<TableCell>
											{item.termLabel || item.termType ? (
												<Badge
													variant="outline"
													className="rounded-lg text-[10px]"
												>
													{item.termLabel ||
														(item.termType
															? t(
																	`projects.createProject.termTypes.${item.termType}`,
																)
															: "-")}
												</Badge>
											) : (
												<span className="text-xs text-slate-400">
													-
												</span>
											)}
										</TableCell>

										{/* Status */}
										<TableCell>
											{item.type === "claim" ? (
												<Select
													value={item.status}
													onValueChange={(
														value,
													) =>
														handleClaimStatusChange(
															item.id,
															value as any,
														)
													}
													disabled={
														updateClaimStatusMutation.isPending
													}
												>
													<SelectTrigger className="h-8 w-28 border-0 bg-transparent p-0">
														<SelectValue>
															{getStatusBadge(
																item.status,
																item.type,
																t,
															)}
														</SelectValue>
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="DRAFT">
															{t(
																"finance.status.DRAFT",
															)}
														</SelectItem>
														<SelectItem value="SUBMITTED">
															{t(
																"finance.status.SUBMITTED",
															)}
														</SelectItem>
														<SelectItem value="APPROVED">
															{t(
																"finance.status.APPROVED",
															)}
														</SelectItem>
														<SelectItem value="PAID">
															{t(
																"finance.status.PAID",
															)}
														</SelectItem>
														<SelectItem value="REJECTED">
															{t(
																"finance.status.REJECTED",
															)}
														</SelectItem>
													</SelectContent>
												</Select>
											) : (
												getStatusBadge(
													item.status,
													item.type,
													t,
												)
											)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>

					{/* Pagination */}
					{totalCount > PAGE_SIZE && (
						<div className="flex items-center justify-between">
							<p className="text-xs text-slate-500">
								{t("paymentsHub.showing", {
									from,
									to,
									total: totalCount,
								})}
							</p>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setPage((p) => Math.max(0, p - 1))
									}
									disabled={!hasPrevPage}
									className="h-8 rounded-lg"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPage((p) => p + 1)}
									disabled={!hasNextPage}
									className="h-8 rounded-lg"
								>
									<ChevronLeft className="h-4 w-4" />
								</Button>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
}
