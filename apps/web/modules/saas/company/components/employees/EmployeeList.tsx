"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
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
import { Checkbox } from "@ui/components/checkbox";
import { Plus, Search, UserX, Users, Banknote, Clock, Shield, Download } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@saas/shared/components/Pagination";
import { AddEmployeeDialog } from "./AddEmployeeDialog";
import { BulkActionsBar } from "../../../../ui/components/bulk-actions-bar";
import { exportTableToCsv } from "../../../../../lib/export-table";

interface EmployeeListProps {
	organizationId: string;
	organizationSlug: string;
}

const EMPLOYEE_TYPES = [
	"PROJECT_MANAGER", "SITE_ENGINEER", "SUPERVISOR", "ACCOUNTANT",
	"ADMIN", "DRIVER", "TECHNICIAN", "LABORER", "SECURITY", "OTHER",
] as const;

export function EmployeeList({ organizationId, organizationSlug }: EmployeeListProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const PAGE_SIZE = 20;

	const { data, isLoading } = useQuery(
		orpc.company.employees.list.queryOptions({
			input: {
				organizationId,
				query: search || undefined,
				status: statusFilter !== "all" ? (statusFilter as "ACTIVE" | "ON_LEAVE" | "TERMINATED") : undefined,
				type: typeFilter !== "all" ? (typeFilter as typeof EMPLOYEE_TYPES[number]) : undefined,
				limit: PAGE_SIZE,
				offset: (currentPage - 1) * PAGE_SIZE,
			},
		}),
	);

	const { data: summary } = useQuery(
		orpc.company.employees.getSummary.queryOptions({
			input: { organizationId },
		}),
	);

	const terminateMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.company.employees.terminate({
				organizationId,
				id,
				endDate: new Date(),
			});
		},
		onSuccess: () => {
			toast.success(t("company.employees.terminateSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.employees.list.queryOptions({ input: { organizationId } }).queryKey });
			queryClient.invalidateQueries({ queryKey: orpc.company.employees.getSummary.queryOptions({ input: { organizationId } }).queryKey });
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.employees.terminateError"));
		},
	});

	const employees = data?.employees ?? [];
	const toggleRow = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	const toggleAllPage = () => {
		if (employees.length > 0 && selectedIds.size === employees.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(employees.map((e) => e.id)));
		}
	};
	const clearSelection = () => setSelectedIds(new Set());
	const selectedEmployees = employees.filter((e) => selectedIds.has(e.id));

	const formatCurrency = (amount: number | string) =>
		new Intl.NumberFormat("en-US").format(Number(amount)) + " " + t("common.sar");

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return (
					<Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-0 text-[10px] px-2 py-0.5">
						{t("company.employees.statusActive")}
					</Badge>
				);
			case "ON_LEAVE":
				return (
					<Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px] px-2 py-0.5">
						{t("company.employees.statusOnLeave")}
					</Badge>
				);
			case "TERMINATED":
				return (
					<Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0 text-[10px] px-2 py-0.5">
						{t("company.employees.statusTerminated")}
					</Badge>
				);
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			{/* Summary Cards - Glass Morphism */}
			{summary && (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900/30">
								<Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
							</div>
						</div>
						<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
							{t("company.employees.active")}
						</p>
						<p className="text-2xl font-bold text-sky-700 dark:text-sky-300">
							{summary.totalActive}
						</p>
					</div>

					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
								<Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
							</div>
						</div>
						<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
							{t("company.employees.onLeave")}
						</p>
						<p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
							{summary.totalOnLeave}
						</p>
					</div>

					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
								<Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>
						</div>
						<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
							{t("company.employees.totalSalaries")}
						</p>
						<p className="text-xl font-bold text-blue-700 dark:text-blue-300">
							{formatCurrency(summary.totalMonthlySalaries)}
						</p>
					</div>

					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
								<Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
							</div>
						</div>
						<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
							{t("company.employees.totalGosi")}
						</p>
						<p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
							{formatCurrency(summary.totalMonthlyGosi)}
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
							placeholder={t("company.employees.searchPlaceholder")}
							value={search}
							onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
							className="rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl pe-10 focus:ring-1 focus:ring-primary/30"
						/>
					</div>
					<Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-[140px] rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
							<SelectValue placeholder={t("company.employees.filterStatus")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							<SelectItem value="ACTIVE">{t("company.employees.statusActive")}</SelectItem>
							<SelectItem value="ON_LEAVE">{t("company.employees.statusOnLeave")}</SelectItem>
							<SelectItem value="TERMINATED">{t("company.employees.statusTerminated")}</SelectItem>
						</SelectContent>
					</Select>
					<Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-[140px] rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
							<SelectValue placeholder={t("company.employees.filterType")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							{EMPLOYEE_TYPES.map((type) => (
								<SelectItem key={type} value={type}>
									{t(`company.employees.types.${type}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button
					onClick={() => setShowAddDialog(true)}
					className="rounded-xl bg-slate-900 text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
				>
					<Plus className="ms-2 h-4 w-4" />
					{t("company.employees.addEmployee")}
				</Button>
			</div>

			{/* Table - Glass Morphism */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<Table className="table-fixed w-full">
					<TableHeader>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-transparent">
							<TableHead className="w-10">
								<Checkbox
									checked={employees.length > 0 && selectedIds.size === employees.length}
									onCheckedChange={toggleAllPage}
									aria-label={t("common.selectAll")}
								/>
							</TableHead>
							<TableHead className="text-end text-slate-500 dark:text-slate-400">{t("company.employees.name")}</TableHead>
							<TableHead className="text-end text-slate-500 dark:text-slate-400 hidden sm:table-cell">{t("company.employees.type")}</TableHead>
							<TableHead className="text-end text-slate-500 dark:text-slate-400">{t("company.employees.salary")}</TableHead>
							<TableHead className="text-end text-slate-500 dark:text-slate-400 hidden md:table-cell">{t("company.employees.status")}</TableHead>
							<TableHead className="text-end text-slate-500 dark:text-slate-400 hidden lg:table-cell">{t("company.employees.projects")}</TableHead>
							<TableHead className="text-end text-slate-500 dark:text-slate-400">{t("company.common.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i} className="border-white/10 dark:border-slate-700/30">
									{[...Array(7)].map((_, j) => (
										<TableCell key={j}>
											<div className="h-4 animate-pulse rounded bg-muted" />
										</TableCell>
									))}
								</TableRow>
							))
						) : data?.employees?.length ? (
							data.employees.map((employee, index) => (
								<TableRow
									key={employee.id}
									className="cursor-pointer border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
									onClick={() => router.push(`/app/${organizationSlug}/company/employees/${employee.id}`)}
								>
									<TableCell onClick={(e) => e.stopPropagation()}>
										<Checkbox
											checked={selectedIds.has(employee.id)}
											onCheckedChange={() => toggleRow(employee.id)}
											aria-label={`${t("common.select")} ${employee.name}`}
										/>
									</TableCell>
									<TableCell className="text-end">
										<div>
											<p className="font-medium text-slate-900 dark:text-slate-100">{employee.name}</p>
											{employee.employeeNo && (
												<p className="text-xs text-slate-400">{employee.employeeNo}</p>
											)}
										</div>
									</TableCell>
									<TableCell className="text-end text-slate-600 dark:text-slate-300 hidden sm:table-cell">
										{t(`company.employees.types.${employee.type}`)}
									</TableCell>
									<TableCell className="text-end font-semibold text-slate-700 dark:text-slate-300">
										{formatCurrency(
											Number(employee.baseSalary) +
											Number(employee.housingAllowance) +
											Number(employee.transportAllowance) +
											Number(employee.otherAllowances)
										)}
									</TableCell>
									<TableCell className="text-end hidden md:table-cell">{getStatusBadge(employee.status)}</TableCell>
									<TableCell className="text-end hidden lg:table-cell">
										{employee.assignments?.length ? (
											<div className="flex flex-wrap gap-1">
												{employee.assignments.map((a) => (
													<Badge key={a.project.id} variant="outline" className="text-[10px] rounded-lg border-slate-200/50 dark:border-slate-700/50 px-2 py-0.5">
														{a.project.name}
													</Badge>
												))}
											</div>
										) : (
											<Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-0 text-[10px] px-2 py-0.5">
												{t("company.employees.generalBudget")}
											</Badge>
										)}
									</TableCell>
									<TableCell className="text-end">
										{employee.status === "ACTIVE" && (
											<Button
												variant="ghost"
												size="icon"
												className="rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
												aria-label={t("company.employees.terminate")}
												onClick={(e) => {
													e.stopPropagation();
													if (confirm(t("company.employees.confirmTerminate"))) {
														terminateMutation.mutate(employee.id);
													}
												}}
											>
												<UserX className="h-4 w-4 text-destructive" />
											</Button>
										)}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={7} className="text-center py-16">
									<div className="flex flex-col items-center">
										<div className="mb-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-xl p-5">
											<Users className="h-10 w-10 text-slate-400 dark:text-slate-500" />
										</div>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{t("company.employees.noEmployees")}
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Bulk Actions */}
			<BulkActionsBar
				selectedCount={selectedIds.size}
				totalCount={employees.length}
				selectedIds={Array.from(selectedIds)}
				onClearSelection={clearSelection}
				actions={[
					{
						label: t("common.export"),
						icon: <Download className="h-4 w-4 me-1.5" />,
						onClick: () => {
							exportTableToCsv(
								selectedEmployees as unknown as Record<string, unknown>[],
								[
									{ key: "name", label: t("company.employees.name") },
									{ key: "employeeNo", label: t("company.employees.employeeNo") },
									{ key: "type", label: t("company.employees.type") },
									{ key: "baseSalary", label: t("company.employees.salary") },
									{ key: "status", label: t("company.employees.status") },
								],
								"employees",
							);
							clearSelection();
						},
					},
				]}
			/>

			{(data?.total ?? 0) > PAGE_SIZE && (
				<Pagination
					totalItems={data?.total ?? 0}
					itemsPerPage={PAGE_SIZE}
					currentPage={currentPage}
					onChangeCurrentPage={setCurrentPage}
				/>
			)}

			{showAddDialog && (
				<AddEmployeeDialog
					open={showAddDialog}
					onOpenChange={setShowAddDialog}
					organizationId={organizationId}
				/>
			)}
		</div>
	);
}
