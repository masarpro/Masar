"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import {
	ArrowRight,
	Banknote,
	CheckCircle,
	Loader2,
	RefreshCw,
	Users,
	Wallet,
	XCircle,
	FileText,
	ShieldMinus,
	Pencil,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { EditPayrollItemDialog } from "./EditPayrollItemDialog";

interface PayrollRunDetailProps {
	organizationId: string;
	organizationSlug: string;
	runId: string;
}

const STATUS_STYLES: Record<string, string> = {
	DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
	APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
	PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
	CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

const FINANCE_STATUS_STYLES: Record<string, string> = {
	PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
	COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
	CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

export function PayrollRunDetail({ organizationId, organizationSlug, runId }: PayrollRunDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [showApproveDialog, setShowApproveDialog] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [editItem, setEditItem] = useState<{ id: string; [key: string]: unknown } | null>(null);
	const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

	const queryKey = orpc.company.payroll.getById.queryOptions({
		input: { organizationId, id: runId },
	}).queryKey;

	const { data: run, isLoading } = useQuery(
		orpc.company.payroll.getById.queryOptions({
			input: { organizationId, id: runId },
		}),
	);

	const formatCurrency = (amount: number | string) => {
		return new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2 }).format(Number(amount)) + " ر.س";
	};

	const getRunNo = (r: { year: number; month: number }) =>
		`PAY-${r.year}-${String(r.month).padStart(2, "0")}`;

	const getStatusBadge = (status: string) => {
		const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
		const labelKey = status.toLowerCase() as "draft" | "approved" | "paid" | "cancelled";
		return (
			<Badge className={`border-0 text-[10px] px-2 py-0.5 ${style}`}>
				{t(`company.payroll.${labelKey}`)}
			</Badge>
		);
	};

	const getFinanceStatusBadge = (status: string) => {
		const style = FINANCE_STATUS_STYLES[status] ?? FINANCE_STATUS_STYLES.PENDING;
		return (
			<Badge className={`border-0 text-[10px] px-1.5 py-0.5 ${style}`}>
				{t(`company.payroll.financeStatus_${status.toLowerCase()}`)}
			</Badge>
		);
	};

	// --- Mutations ---

	const populateMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.payroll.populate({
				organizationId,
				id: runId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.payroll.populateSuccess"));
			queryClient.invalidateQueries({ queryKey });
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.payroll.populateError"));
		},
	});

	const approveMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.payroll.approve({
				organizationId,
				id: runId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.payroll.approveSuccess"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: orpc.company.payroll.list.queryOptions({ input: { organizationId } }).queryKey,
			});
			setShowApproveDialog(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.payroll.approveError"));
			setShowApproveDialog(false);
		},
	});

	const cancelMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.payroll.cancel({
				organizationId,
				id: runId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.payroll.cancelSuccess"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: orpc.company.payroll.list.queryOptions({ input: { organizationId } }).queryKey,
			});
			setShowCancelDialog(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.payroll.cancelError"));
			setShowCancelDialog(false);
		},
	});

	const updateItemMutation = useMutation({
		mutationFn: async (data: {
			itemId: string;
			baseSalary: number;
			housingAllowance: number;
			transportAllowance: number;
			otherAllowances: number;
			gosiDeduction: number;
		}) => {
			return orpcClient.company.payroll.updateItem({
				organizationId,
				itemId: data.itemId,
				baseSalary: data.baseSalary,
				housingAllowance: data.housingAllowance,
				transportAllowance: data.transportAllowance,
				otherAllowances: data.otherAllowances,
				gosiDeduction: data.gosiDeduction,
			});
		},
		onSuccess: () => {
			toast.success(t("company.payroll.updateItemSuccess"));
			queryClient.invalidateQueries({ queryKey });
			setEditItem(null);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.payroll.updateItemError"));
		},
	});

	const deleteItemMutation = useMutation({
		mutationFn: async (itemId: string) => {
			return orpcClient.company.payroll.deleteItem({
				organizationId,
				itemId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.payroll.deleteItemSuccess"));
			queryClient.invalidateQueries({ queryKey });
			setDeleteItemId(null);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.payroll.deleteItemError"));
			setDeleteItemId(null);
		},
	});

	// --- Loading state ---

	if (isLoading) {
		return (
			<div className="space-y-6" dir="rtl">
				{[...Array(4)].map((_, i) => (
					<div
						key={i}
						className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6"
					>
						<div className="h-24 animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
		);
	}

	if (!run) return null;

	const items = run.items ?? [];
	const totalBaseSalary = items.reduce((sum, item) => sum + Number(item.baseSalary ?? 0), 0);
	const totalAllowances = items.reduce(
		(sum, item) =>
			sum +
			Number(item.housingAllowance ?? 0) +
			Number(item.transportAllowance ?? 0) +
			Number(item.otherAllowances ?? 0),
		0,
	);
	const totalDeductions = items.reduce((sum, item) => sum + Number(item.gosiDeduction ?? 0), 0);
	const netTotal = Number(run.netTotal ?? 0);

	return (
		<div className="space-y-6" dir="rtl">
			{/* Back Button */}
			<Button
				variant="ghost"
				className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 gap-2"
				onClick={() => router.push(`/app/${organizationSlug}/company/payroll`)}
			>
				<ArrowRight className="h-4 w-4" />
				{t("company.payroll.backToList")}
			</Button>

			{/* Header Card */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
						<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.payroll.runDetail")}
					</h3>
				</div>
				<div className="p-5">
					<div className="flex items-start justify-between">
						<div className="space-y-3">
							<div>
								<h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
									{getRunNo(run)}
								</h2>
								<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
									{run.month} / {run.year}
								</p>
							</div>
							<div className="flex items-center gap-2">
								{getStatusBadge(run.status)}
							</div>
							{run.createdByUser && (
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{t("company.payroll.createdBy")}: {run.createdByUser.name ?? run.createdByUser.email}
								</p>
							)}
							{run.approvedByUser && (
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{t("company.payroll.approvedBy")}: {run.approvedByUser.name ?? run.approvedByUser.email}
								</p>
							)}
							{run.notes && (
								<p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
									{run.notes}
								</p>
							)}
						</div>

						{/* Action Buttons */}
						<div className="flex items-center gap-2">
							{run.status === "DRAFT" && (
								<>
									<Button
										variant="outline"
										className="rounded-xl border-white/20 dark:border-slate-700/30"
										onClick={() => populateMutation.mutate()}
										disabled={populateMutation.isPending}
									>
										{populateMutation.isPending ? (
											<Loader2 className="ml-2 h-4 w-4 animate-spin" />
										) : (
											<RefreshCw className="ml-2 h-4 w-4" />
										)}
										{t("company.payroll.populate")}
									</Button>
									<Button
										className="rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
										onClick={() => setShowApproveDialog(true)}
										disabled={approveMutation.isPending}
									>
										<CheckCircle className="ml-2 h-4 w-4" />
										{t("company.payroll.approve")}
									</Button>
									<Button
										variant="outline"
										className="rounded-xl border-red-200/50 dark:border-red-800/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
										onClick={() => setShowCancelDialog(true)}
										disabled={cancelMutation.isPending}
									>
										<XCircle className="ml-2 h-4 w-4" />
										{t("company.payroll.cancel")}
									</Button>
								</>
							)}
							{run.status === "APPROVED" && (
								<Button
									variant="outline"
									className="rounded-xl border-red-200/50 dark:border-red-800/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									onClick={() => setShowCancelDialog(true)}
									disabled={cancelMutation.isPending}
								>
									<XCircle className="ml-2 h-4 w-4" />
									{t("company.payroll.cancel")}
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
							<Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.payroll.totalBaseSalary")}
					</p>
					<p className="text-lg font-bold text-blue-700 dark:text-blue-300">
						{formatCurrency(totalBaseSalary)}
					</p>
				</div>

				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
							<Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.payroll.totalAllowances")}
					</p>
					<p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
						{formatCurrency(totalAllowances)}
					</p>
				</div>

				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
							<ShieldMinus className="h-5 w-5 text-red-600 dark:text-red-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.payroll.totalDeductions")}
					</p>
					<p className="text-lg font-bold text-red-700 dark:text-red-300">
						{formatCurrency(totalDeductions)}
					</p>
				</div>

				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
							<Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.payroll.netTotal")}
					</p>
					<p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
						{formatCurrency(netTotal)}
					</p>
				</div>
			</div>

			{/* Employee Items Table */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
						<Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.payroll.employeeItems")}
					</h3>
					<Badge className="border-0 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
						{items.length}
					</Badge>
				</div>
				<Table className="table-fixed w-full">
					<TableHeader>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-transparent">
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[16%]">
								{t("company.payroll.employeeName")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[10%]">
								{t("company.payroll.employeeNo")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[11%]">
								{t("company.payroll.baseSalary")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[11%]">
								{t("company.payroll.housingAllowance")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[11%]">
								{t("company.payroll.transportAllowance")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[11%]">
								{t("company.payroll.otherAllowances")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[10%]">
								{t("company.payroll.gosiDeduction")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[11%]">
								{t("company.payroll.netSalary")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[9%]">
								{t("company.payroll.financeStatus")}
							</TableHead>
							{run.status === "DRAFT" && items.length > 0 && (
								<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[8%]">
									{t("company.common.actions")}
								</TableHead>
							)}
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.length ? (
							items.map((item, index) => (
								<TableRow
									key={item.id}
									className="border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
								>
									<TableCell className="text-right">
										<p className="font-medium text-slate-900 dark:text-slate-100 truncate">
											{item.employee?.name ?? "-"}
										</p>
									</TableCell>
									<TableCell className="text-right text-slate-600 dark:text-slate-300">
										{item.employee?.employeeNo ?? "-"}
									</TableCell>
									<TableCell className="text-right text-slate-700 dark:text-slate-300 font-medium">
										{formatCurrency(item.baseSalary ?? 0)}
									</TableCell>
									<TableCell className="text-right text-slate-600 dark:text-slate-300">
										{formatCurrency(item.housingAllowance ?? 0)}
									</TableCell>
									<TableCell className="text-right text-slate-600 dark:text-slate-300">
										{formatCurrency(item.transportAllowance ?? 0)}
									</TableCell>
									<TableCell className="text-right text-slate-600 dark:text-slate-300">
										{formatCurrency(item.otherAllowances ?? 0)}
									</TableCell>
									<TableCell className="text-right text-red-600 dark:text-red-400">
										{formatCurrency(item.gosiDeduction ?? 0)}
									</TableCell>
									<TableCell className="text-right font-semibold text-slate-900 dark:text-slate-100">
										{formatCurrency(item.netSalary ?? 0)}
									</TableCell>
									<TableCell className="text-right">
										{item.financeExpense?.status ? (
											getFinanceStatusBadge(item.financeExpense.status)
										) : (
											<span className="text-xs text-slate-400">-</span>
										)}
									</TableCell>
									{run.status === "DRAFT" && (
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-lg text-slate-600 hover:bg-blue-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
													onClick={() => setEditItem(item)}
													title={t("company.common.edit")}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-lg text-slate-600 hover:bg-red-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
													onClick={() => setDeleteItemId(item.id)}
													title={t("company.common.delete")}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									)}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={9} className="text-center py-16">
									<div className="flex flex-col items-center">
										<div className="mb-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-xl p-5">
											<Users className="h-10 w-10 text-slate-400 dark:text-slate-500" />
										</div>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{t("company.payroll.noItems")}
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Approve Confirmation Dialog */}
			<AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
				<AlertDialogContent dir="rtl" className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("company.payroll.approve")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("company.payroll.approveConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("company.common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => approveMutation.mutate()}
							disabled={approveMutation.isPending}
							className="rounded-xl bg-blue-600 hover:bg-blue-700"
						>
							{approveMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 me-2 animate-spin" />
									{t("company.common.saving")}
								</>
							) : (
								t("company.payroll.approve")
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Cancel Confirmation Dialog */}
			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<AlertDialogContent dir="rtl" className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("company.payroll.cancel")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("company.payroll.cancelConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("company.common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => cancelMutation.mutate()}
							disabled={cancelMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{cancelMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 me-2 animate-spin" />
									{t("company.common.saving")}
								</>
							) : (
								t("company.payroll.cancel")
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Edit Payroll Item Dialog */}
			<EditPayrollItemDialog
				open={!!editItem}
				onOpenChange={(open) => !open && setEditItem(null)}
				item={editItem}
				onSubmit={(data) => {
					if (editItem) {
						updateItemMutation.mutate({
							itemId: editItem.id,
							...data,
						});
					}
				}}
				isLoading={updateItemMutation.isPending}
			/>

			{/* Delete Item Confirmation Dialog */}
			<AlertDialog
				open={!!deleteItemId}
				onOpenChange={(open) => !open && setDeleteItemId(null)}
			>
				<AlertDialogContent dir="rtl" className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("company.payroll.deleteItem")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("company.payroll.deleteItemConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("company.common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteItemId && deleteItemMutation.mutate(deleteItemId)}
							disabled={deleteItemMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{deleteItemMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 me-2 animate-spin" />
									{t("company.common.saving")}
								</>
							) : (
								t("company.common.delete")
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
