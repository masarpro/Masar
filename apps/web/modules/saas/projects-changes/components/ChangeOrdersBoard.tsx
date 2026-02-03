"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { apiClient } from "@shared/lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Card } from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Input } from "@ui/components/input";
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
import {
	PlusIcon,
	SearchIcon,
	FileTextIcon,
	TrendingUpIcon,
	TrendingDownIcon,
	ClockIcon,
	DollarSignIcon,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CreateChangeOrderForm } from "./CreateChangeOrderForm";

type ChangeOrderStatus =
	| "DRAFT"
	| "SUBMITTED"
	| "APPROVED"
	| "REJECTED"
	| "IMPLEMENTED";
type ChangeOrderCategory =
	| "SCOPE_CHANGE"
	| "CLIENT_REQUEST"
	| "SITE_CONDITION"
	| "DESIGN_CHANGE"
	| "MATERIAL_CHANGE"
	| "REGULATORY"
	| "OTHER";

interface ChangeOrdersListItem {
	id: string;
	coNo: number;
	title: string;
	description?: string | null;
	category: ChangeOrderCategory;
	status: ChangeOrderStatus;
	costImpact?: string | null;
	currency?: string | null;
	timeImpactDays?: number | null;
	createdAt: string;
	updatedAt: string;
	requestedBy: { id: string; name: string; email: string };
	decidedBy?: { id: string; name: string; email: string } | null;
	milestone?: { id: string; title: string } | null;
}

interface ChangeOrdersStats {
	DRAFT: number;
	SUBMITTED: number;
	APPROVED: number;
	REJECTED: number;
	IMPLEMENTED: number;
	total: number;
	totalCostImpact: number;
	totalTimeImpact: number;
}

interface ChangeOrdersBoardProps {
	projectId: string;
}

function formatCurrency(value: number | string | null | undefined): string {
	if (value === null || value === undefined) return "-";
	const num = typeof value === "string" ? Number.parseFloat(value) : value;
	if (Number.isNaN(num)) return "-";
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(num);
}

function getStatusBadge(status: ChangeOrderStatus, t: (key: string) => string) {
	const colors: Record<ChangeOrderStatus, string> = {
		DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
		SUBMITTED:
			"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
		APPROVED:
			"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
		REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
		IMPLEMENTED:
			"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	};

	return (
		<Badge className={`border-0 ${colors[status]}`}>
			{t(`changeOrders.status.${status}`)}
		</Badge>
	);
}

function getCategoryLabel(
	category: ChangeOrderCategory,
	t: (key: string) => string,
) {
	return t(`changeOrders.category.${category}`);
}

export function ChangeOrdersBoard({ projectId }: ChangeOrdersBoardProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const { activeOrganization } = useActiveOrganization();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [page, setPage] = useState(1);
	const pageSize = 20;

	const queryKey = [
		"project-change-orders",
		activeOrganization?.id,
		projectId,
		statusFilter,
		searchQuery,
		page,
	];

	// Fetch change orders
	const { data: changeOrdersData, isLoading } = useQuery({
		queryKey,
		queryFn: async () => {
			if (!activeOrganization?.id) return null;
			return apiClient.projectChangeOrders.list({
				organizationId: activeOrganization.id,
				projectId,
				status:
					statusFilter !== "all"
						? (statusFilter as ChangeOrderStatus)
						: undefined,
				search: searchQuery || undefined,
				page,
				pageSize,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	// Fetch stats
	const { data: statsData } = useQuery({
		queryKey: ["project-change-orders-stats", activeOrganization?.id, projectId],
		queryFn: async () => {
			if (!activeOrganization?.id) return null;
			return apiClient.projectChangeOrders.getStats({
				organizationId: activeOrganization.id,
				projectId,
			});
		},
		enabled: !!activeOrganization?.id,
	});

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async (data: {
			title: string;
			description?: string;
			category?: ChangeOrderCategory;
			costImpact?: number;
			timeImpactDays?: number;
			milestoneId?: string;
		}) => {
			if (!activeOrganization?.id) throw new Error("No organization");
			return apiClient.projectChangeOrders.create({
				organizationId: activeOrganization.id,
				projectId,
				...data,
			});
		},
		onSuccess: () => {
			toast.success(t("changeOrders.notifications.created"));
			queryClient.invalidateQueries({
				queryKey: ["project-change-orders"],
			});
			queryClient.invalidateQueries({
				queryKey: ["project-change-orders-stats"],
			});
			setIsCreateOpen(false);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const changeOrders = (changeOrdersData?.changeOrders ??
		[]) as unknown as ChangeOrdersListItem[];
	const stats = statsData as ChangeOrdersStats | null;

	return (
		<div className="space-y-6">
			{/* Stats Cards */}
			{stats && (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<Card className="p-4">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-slate-100 p-2.5 dark:bg-slate-800">
								<FileTextIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
							</div>
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{t("changeOrders.stats.total")}
								</p>
								<p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
									{stats.total}
								</p>
							</div>
						</div>
					</Card>

					<Card className="p-4">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-amber-100 p-2.5 dark:bg-amber-900/50">
								<ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
							</div>
							<div>
								<p className="text-xs text-amber-600 dark:text-amber-400">
									{t("changeOrders.stats.pending")}
								</p>
								<p className="text-xl font-semibold text-amber-700 dark:text-amber-300">
									{stats.SUBMITTED}
								</p>
							</div>
						</div>
					</Card>

					<Card className="p-4">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/50">
								<DollarSignIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
							</div>
							<div>
								<p className="text-xs text-emerald-600 dark:text-emerald-400">
									{t("changeOrders.stats.costImpact")}
								</p>
								<p className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
									{formatCurrency(stats.totalCostImpact)}
								</p>
							</div>
						</div>
					</Card>

					<Card className="p-4">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/50">
								{stats.totalTimeImpact >= 0 ? (
									<TrendingUpIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								) : (
									<TrendingDownIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								)}
							</div>
							<div>
								<p className="text-xs text-blue-600 dark:text-blue-400">
									{t("changeOrders.stats.timeImpact")}
								</p>
								<p className="text-xl font-semibold text-blue-700 dark:text-blue-300">
									{stats.totalTimeImpact > 0 ? "+" : ""}
									{stats.totalTimeImpact} {t("common.days")}
								</p>
							</div>
						</div>
					</Card>
				</div>
			)}

			{/* Filters and Actions */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-4">
					<div className="relative flex-1 max-w-sm">
						<SearchIcon className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<Input
							placeholder={t("changeOrders.search")}
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value);
								setPage(1);
							}}
							className="ps-10"
						/>
					</div>
					<Select
						value={statusFilter}
						onValueChange={(value) => {
							setStatusFilter(value);
							setPage(1);
						}}
					>
						<SelectTrigger className="w-40">
							<SelectValue placeholder={t("changeOrders.filterByStatus")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("changeOrders.allStatuses")}</SelectItem>
							<SelectItem value="DRAFT">{t("changeOrders.status.DRAFT")}</SelectItem>
							<SelectItem value="SUBMITTED">
								{t("changeOrders.status.SUBMITTED")}
							</SelectItem>
							<SelectItem value="APPROVED">
								{t("changeOrders.status.APPROVED")}
							</SelectItem>
							<SelectItem value="REJECTED">
								{t("changeOrders.status.REJECTED")}
							</SelectItem>
							<SelectItem value="IMPLEMENTED">
								{t("changeOrders.status.IMPLEMENTED")}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<Button onClick={() => setIsCreateOpen(true)}>
					<PlusIcon className="me-2 h-4 w-4" />
					{t("changeOrders.create")}
				</Button>
			</div>

			{/* Change Orders Table */}
			<Card>
				{isLoading ? (
					<div className="flex items-center justify-center py-20">
						<div className="relative">
							<div className="h-12 w-12 rounded-full border-4 border-primary/20" />
							<div className="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						</div>
					</div>
				) : changeOrders.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-20 text-center">
						<FileTextIcon className="h-16 w-16 text-slate-300 dark:text-slate-600" />
						<p className="mt-4 text-lg font-medium text-slate-900 dark:text-slate-100">
							{t("changeOrders.empty.title")}
						</p>
						<p className="mt-1 text-slate-500 dark:text-slate-400">
							{t("changeOrders.empty.description")}
						</p>
						<Button onClick={() => setIsCreateOpen(true)} className="mt-4">
							<PlusIcon className="me-2 h-4 w-4" />
							{t("changeOrders.create")}
						</Button>
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-20">#</TableHead>
								<TableHead>{t("changeOrders.fields.title")}</TableHead>
								<TableHead>{t("changeOrders.fields.category")}</TableHead>
								<TableHead className="text-center">
									{t("changeOrders.fields.costImpact")}
								</TableHead>
								<TableHead className="text-center">
									{t("changeOrders.fields.timeImpact")}
								</TableHead>
								<TableHead>{t("changeOrders.fields.status")}</TableHead>
								<TableHead>{t("changeOrders.fields.updatedAt")}</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{changeOrders.map((co) => (
								<TableRow key={co.id}>
									<TableCell className="font-mono text-sm text-slate-500">
										CO-{co.coNo}
									</TableCell>
									<TableCell>
										<Link
											href={`changes/${co.id}`}
											className="font-medium text-slate-900 hover:text-primary dark:text-slate-100"
										>
											{co.title}
										</Link>
									</TableCell>
									<TableCell className="text-sm text-slate-600 dark:text-slate-400">
										{getCategoryLabel(co.category, t)}
									</TableCell>
									<TableCell className="text-center">
										{co.costImpact ? (
											<span
												className={
													Number(co.costImpact) >= 0
														? "text-emerald-600 dark:text-emerald-400"
														: "text-red-600 dark:text-red-400"
												}
											>
												{Number(co.costImpact) > 0 ? "+" : ""}
												{formatCurrency(co.costImpact)}
											</span>
										) : (
											"-"
										)}
									</TableCell>
									<TableCell className="text-center">
										{co.timeImpactDays !== null && co.timeImpactDays !== undefined ? (
											<span
												className={
													co.timeImpactDays >= 0
														? "text-blue-600 dark:text-blue-400"
														: "text-orange-600 dark:text-orange-400"
												}
											>
												{co.timeImpactDays > 0 ? "+" : ""}
												{co.timeImpactDays} {t("common.days")}
											</span>
										) : (
											"-"
										)}
									</TableCell>
									<TableCell>{getStatusBadge(co.status, t)}</TableCell>
									<TableCell className="text-sm text-slate-500">
										{new Date(co.updatedAt).toLocaleDateString("ar-SA")}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}

				{/* Pagination */}
				{changeOrdersData && changeOrdersData.totalPages > 1 && (
					<div className="flex items-center justify-center gap-2 border-t p-4">
						<Button
							variant="outline"
							size="sm"
							disabled={page === 1}
							onClick={() => setPage(page - 1)}
						>
							{t("common.previous")}
						</Button>
						<span className="text-sm text-slate-500">
							{t("common.pageOf", {
								current: page,
								total: changeOrdersData.totalPages,
							})}
						</span>
						<Button
							variant="outline"
							size="sm"
							disabled={page === changeOrdersData.totalPages}
							onClick={() => setPage(page + 1)}
						>
							{t("common.next")}
						</Button>
					</div>
				)}
			</Card>

			{/* Create Dialog */}
			<CreateChangeOrderForm
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				projectId={projectId}
				onSubmit={(data) => createMutation.mutate(data)}
				isLoading={createMutation.isPending}
			/>
		</div>
	);
}
