"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrencySuffixed } from "@shared/lib/formatters";
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
import { EmptyState } from "@ui/components/empty-state";
import { Plus, Search, UserX, Users, Banknote, Clock, Shield, Download } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@saas/shared/components/Pagination";
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
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
			setSelectedIds(new Set(employees.map((e: any) => e.id)));
		}
	};
	const clearSelection = () => setSelectedIds(new Set());
	const selectedEmployees = employees.filter((e: any) => selectedIds.has(e.id));

	const formatCurrency = (amount: number | string) =>
		formatCurrencySuffixed(Number(amount), t("common.sar"), 0);

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return (
					<Badge className="bg-chart-4/15 text-chart-4 border-0 text-[10px] px-2 py-0.5">
						{t("company.employees.statusActive")}
					</Badge>
				);
			case "ON_LEAVE":
				return (
					<Badge className="bg-chart-1/15 text-chart-1 border-0 text-[10px] px-2 py-0.5">
						{t("company.employees.statusOnLeave")}
					</Badge>
				);
			case "TERMINATED":
				return (
					<Badge className="bg-muted text-muted-foreground border-0 text-[10px] px-2 py-0.5">
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
				<>
					{/* الجوال: شريط إحصائيات مضغوط */}
					<CompactStatGrid
						className="sm:hidden"
						items={[
							{
								label: t("company.employees.active"),
								value: summary.totalActive,
								icon: Users,
								iconClassName: "text-chart-4",
								iconBgClassName: "bg-chart-4/15",
							},
							{
								label: t("company.employees.onLeave"),
								value: summary.totalOnLeave,
								icon: Clock,
								iconClassName: "text-chart-1",
								iconBgClassName: "bg-chart-1/15",
							},
							{
								label: t("company.employees.totalSalaries"),
								value: formatCurrency(summary.totalMonthlySalaries),
								icon: Banknote,
								iconClassName: "text-chart-4",
								iconBgClassName: "bg-chart-4/15",
								valueClassName: "text-chart-4",
							},
							{
								label: t("company.employees.totalGosi"),
								value: formatCurrency(summary.totalMonthlyGosi),
								icon: Shield,
								iconClassName: "text-chart-4",
								iconBgClassName: "bg-chart-4/15",
								valueClassName: "text-chart-4",
							},
						]}
					/>

					{/* الديسكتوب كما هو */}
					<div className="hidden sm:grid sm:grid-cols-2 gap-4 lg:grid-cols-4">
					<div className="bg-card border-2 rounded-2xl p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
								<Users className="h-5 w-5" />
							</div>
						</div>
						<p className="text-xs font-medium text-muted-foreground mb-1">
							{t("company.employees.active")}
						</p>
						<p className="text-2xl font-bold text-chart-4">
							{summary.totalActive}
						</p>
					</div>

					<div className="bg-card border-2 rounded-2xl p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex size-9 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
								<Clock className="h-5 w-5" />
							</div>
						</div>
						<p className="text-xs font-medium text-muted-foreground mb-1">
							{t("company.employees.onLeave")}
						</p>
						<p className="text-2xl font-bold text-chart-1">
							{summary.totalOnLeave}
						</p>
					</div>

					<div className="bg-card border-2 rounded-2xl p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
								<Banknote className="h-5 w-5" />
							</div>
						</div>
						<p className="text-xs font-medium text-muted-foreground mb-1">
							{t("company.employees.totalSalaries")}
						</p>
						<p className="text-xl font-bold text-chart-4">
							{formatCurrency(summary.totalMonthlySalaries)}
						</p>
					</div>

					<div className="bg-card border-2 rounded-2xl p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
								<Shield className="h-5 w-5" />
							</div>
						</div>
						<p className="text-xs font-medium text-muted-foreground mb-1">
							{t("company.employees.totalGosi")}
						</p>
						<p className="text-xl font-bold text-chart-4">
							{formatCurrency(summary.totalMonthlyGosi)}
						</p>
					</div>
					</div>
				</>
			)}

			{/* الجوال: بحث + ورقة فلاتر + زر إضافة مضغوط في صف واحد */}
			<div className="flex items-center gap-2 sm:hidden">
				<div className="relative min-w-0 flex-1">
					<Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("company.employees.searchPlaceholder")}
						value={search}
						onChange={(e: any) => { setSearch(e.target.value); setCurrentPage(1); }}
						className="rounded-lg border border-input bg-card pe-10"
					/>
				</div>
				<MobileFilterSheet activeCount={(statusFilter !== "all" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0)}>
					<Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-full rounded-xl">
							<SelectValue placeholder={t("company.employees.filterStatus")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							<SelectItem value="ACTIVE">{t("company.employees.statusActive")}</SelectItem>
							<SelectItem value="ON_LEAVE">{t("company.employees.statusOnLeave")}</SelectItem>
							<SelectItem value="TERMINATED">{t("company.employees.statusTerminated")}</SelectItem>
						</SelectContent>
					</Select>
					<Select value={typeFilter} onValueChange={(v: any) => { setTypeFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-full rounded-xl">
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
				</MobileFilterSheet>
				<Button
					size="icon"
					aria-label={t("company.employees.addEmployee")}
					onClick={() => setShowAddDialog(true)}
					className="h-10 w-10 shrink-0 rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Plus className="h-5 w-5" />
				</Button>
			</div>

			{/* Search and Filter Bar (الديسكتوب كما هو) */}
			<div className="hidden gap-4 sm:flex sm:items-center sm:justify-between">
				<div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
					<div className="relative max-w-md flex-1">
						<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder={t("company.employees.searchPlaceholder")}
							value={search}
							onChange={(e: any) => { setSearch(e.target.value); setCurrentPage(1); }}
							className="rounded-lg border border-input bg-card pe-10"
						/>
					</div>
					<Select value={statusFilter} onValueChange={(v: any) => { setStatusFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-full sm:w-[140px] rounded-lg border border-input bg-card">
							<SelectValue placeholder={t("company.employees.filterStatus")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							<SelectItem value="ACTIVE">{t("company.employees.statusActive")}</SelectItem>
							<SelectItem value="ON_LEAVE">{t("company.employees.statusOnLeave")}</SelectItem>
							<SelectItem value="TERMINATED">{t("company.employees.statusTerminated")}</SelectItem>
						</SelectContent>
					</Select>
					<Select value={typeFilter} onValueChange={(v: any) => { setTypeFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-full sm:w-[140px] rounded-lg border border-input bg-card">
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
					className="rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Plus className="ms-2 h-4 w-4" />
					{t("company.employees.addEmployee")}
				</Button>
			</div>

			{/* Table - Glass Morphism */}
			<div className="bg-card border-2 rounded-2xl overflow-x-auto">
				<Table className="table-fixed w-full min-w-[860px]">
					<TableHeader>
						<TableRow className="border-b-2 hover:bg-transparent">
							<TableHead className="w-10">
								<Checkbox
									checked={employees.length > 0 && selectedIds.size === employees.length}
									onCheckedChange={toggleAllPage}
									aria-label={t("common.selectAll")}
								/>
							</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.employees.name")}</TableHead>
							<TableHead className="text-end text-muted-foreground hidden sm:table-cell">{t("company.employees.type")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.employees.salary")}</TableHead>
							<TableHead className="text-end text-muted-foreground hidden md:table-cell">{t("company.employees.status")}</TableHead>
							<TableHead className="text-end text-muted-foreground hidden lg:table-cell">{t("company.employees.projects")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.common.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i} className="border-b-2">
									{[...Array(7)].map((_, j) => (
										<TableCell key={j}>
											<div className="h-4 animate-pulse rounded bg-muted" />
										</TableCell>
									))}
								</TableRow>
							))
						) : data?.employees?.length ? (
							data.employees.map((employee: any, index: any) => (
								<TableRow
									key={employee.id}
									className="cursor-pointer border-b-2 hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
									onClick={() => router.push(`/app/${organizationSlug}/company/employees/${employee.id}`)}
								>
									<TableCell onClick={(e: any) => e.stopPropagation()}>
										<Checkbox
											checked={selectedIds.has(employee.id)}
											onCheckedChange={() => toggleRow(employee.id)}
											aria-label={`${t("common.select")} ${employee.name}`}
										/>
									</TableCell>
									<TableCell className="text-end">
										<div>
											<p className="font-medium text-card-foreground">{employee.name}</p>
											{employee.employeeNo && (
												<p className="text-xs text-muted-foreground">{employee.employeeNo}</p>
											)}
										</div>
									</TableCell>
									<TableCell className="text-end text-muted-foreground hidden sm:table-cell">
										{t(`company.employees.types.${employee.type}`)}
									</TableCell>
									<TableCell className="text-end font-semibold text-card-foreground">
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
												{employee.assignments.map((a: any) => (
													<Badge key={a.project.id} variant="outline" className="text-[10px] rounded-lg px-2 py-0.5">
														{a.project.name}
													</Badge>
												))}
											</div>
										) : (
											<Badge className="bg-chart-4/15 text-chart-4 border-0 text-[10px] px-2 py-0.5">
												{t("company.employees.generalBudget")}
											</Badge>
										)}
									</TableCell>
									<TableCell className="text-end">
										{employee.status === "ACTIVE" && (
											<Button
												variant="ghost"
												size="icon"
												className="rounded-lg hover:bg-destructive/10"
												aria-label={t("company.employees.terminate")}
												onClick={(e: any) => {
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
								<TableCell colSpan={7}>
									<EmptyState
										icon={<Users className="h-10 w-10" />}
										description={t("company.employees.noEmployees")}
									/>
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
