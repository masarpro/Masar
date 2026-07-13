"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrencySuffixed } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { statusToneClasses } from "@ui/components/status-chip";
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

export function PayrollRunDetail({ organizationId, organizationSlug, runId }: PayrollRunDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [showApproveDialog, setShowApproveDialog] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [selectedBankId, setSelectedBankId] = useState<string>("");
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

	const { data: bankAccounts } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId },
		}),
	);

	const formatCurrency = (amount: number | string) =>
		formatCurrencySuffixed(Number(amount), t("common.sar"), 2);

	const getRunNo = (r: { year: number; month: number }) =>
		`PAY-${r.year}-${String(r.month).padStart(2, "0")}`;

	const getStatusBadge = (status: string) => {
		const labelKey = status.toLowerCase() as "draft" | "approved" | "paid" | "cancelled";
		return (
			<Badge className={`border-0 text-[10px] px-2 py-0.5 ${statusToneClasses(status)}`}>
				{t(`company.payroll.${labelKey}`)}
			</Badge>
		);
	};

	const getFinanceStatusBadge = (status: string) => {
		return (
			<Badge className={`border-0 text-[10px] px-1.5 py-0.5 ${statusToneClasses(status)}`}>
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
				sourceAccountId: selectedBankId || undefined,
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
		return <DetailPageSkeleton />;
	}

	if (!run) return null;

	const items = run.items ?? [];
	const totalBaseSalary = items.reduce((sum: any, item: any) => sum + Number(item.baseSalary ?? 0), 0);
	const totalAllowances = items.reduce(
		(sum: any, item: any) =>
			sum +
			Number(item.housingAllowance ?? 0) +
			Number(item.transportAllowance ?? 0) +
			Number(item.otherAllowances ?? 0),
		0,
	);
	const totalDeductions = items.reduce((sum: any, item: any) => sum + Number(item.gosiDeduction ?? 0), 0);
	const netTotal = Number(run.totalNetSalary ?? 0);

	return (
		<div className="space-y-6">
			{/* Back Button */}
			<Button
				variant="ghost"
				className="rounded-lg hover:bg-accent gap-2"
				onClick={() => router.push(`/app/${organizationSlug}/company/payroll`)}
			>
				<ArrowRight className="h-4 w-4" />
				{t("company.payroll.backToList")}
			</Button>

			{/* Header Card */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b-2">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<FileText className="h-5 w-5 text-chart-4" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.payroll.runDetail")}
					</h3>
				</div>
				<div className="p-5">
					<div className="flex flex-wrap items-start justify-between gap-y-3">
						<div className="space-y-3">
							<div>
								<h2 className="text-xl font-bold text-card-foreground">
									{getRunNo(run)}
								</h2>
								<p className="text-sm text-muted-foreground mt-1">
									{run.month} / {run.year}
								</p>
							</div>
							<div className="flex items-center gap-2">
								{getStatusBadge(run.status)}
							</div>
							{run.createdBy && (
								<p className="text-xs text-muted-foreground">
									{t("company.payroll.createdBy")}: {run.createdBy.name}
								</p>
							)}
							{run.approvedBy && (
								<p className="text-xs text-muted-foreground">
									{t("company.payroll.approvedBy")}: {run.approvedBy.name}
								</p>
							)}
							{run.notes && (
								<p className="text-sm text-muted-foreground mt-2">
									{run.notes}
								</p>
							)}
						</div>

						{/* Action Buttons */}
						<div className="flex flex-wrap items-center gap-2">
							{run.status === "DRAFT" && (
								<>
									<Button
										variant="outline"
										className="rounded-lg"
										onClick={() => populateMutation.mutate()}
										disabled={populateMutation.isPending}
									>
										{populateMutation.isPending ? (
											<Loader2 className="ms-2 h-4 w-4 animate-spin" />
										) : (
											<RefreshCw className="ms-2 h-4 w-4" />
										)}
										{t("company.payroll.populate")}
									</Button>
									<Button
										className="rounded-lg bg-chart-4 text-white hover:bg-chart-4/90"
										onClick={() => setShowApproveDialog(true)}
										disabled={approveMutation.isPending}
									>
										<CheckCircle className="ms-2 h-4 w-4" />
										{t("company.payroll.approve")}
									</Button>
									<Button
										variant="outline"
										className="rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
										onClick={() => setShowCancelDialog(true)}
										disabled={cancelMutation.isPending}
									>
										<XCircle className="ms-2 h-4 w-4" />
										{t("company.payroll.cancel")}
									</Button>
								</>
							)}
							{run.status === "APPROVED" && (
								<Button
									variant="outline"
									className="rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
									onClick={() => setShowCancelDialog(true)}
									disabled={cancelMutation.isPending}
								>
									<XCircle className="ms-2 h-4 w-4" />
									{t("company.payroll.cancel")}
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Summary Cards — مضغوطة على الجوال */}
			<div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
				<div className="bg-card border-2 rounded-2xl p-3 sm:p-4">
					<div className="flex items-center justify-between mb-2 sm:mb-3">
						<div className="p-1.5 sm:flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-chart-4" />
						</div>
					</div>
					<p className="text-[11px] sm:text-xs font-medium text-muted-foreground mb-1">
						{t("company.payroll.totalBaseSalary")}
					</p>
					<p className="truncate text-base sm:text-lg font-bold text-chart-4">
						{formatCurrency(totalBaseSalary)}
					</p>
				</div>

				<div className="bg-card border-2 rounded-2xl p-3 sm:p-4">
					<div className="flex items-center justify-between mb-2 sm:mb-3">
						<div className="p-1.5 sm:flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-chart-4" />
						</div>
					</div>
					<p className="text-[11px] sm:text-xs font-medium text-muted-foreground mb-1">
						{t("company.payroll.totalAllowances")}
					</p>
					<p className="truncate text-base sm:text-lg font-bold text-chart-4">
						{formatCurrency(totalAllowances)}
					</p>
				</div>

				<div className="bg-card border-2 rounded-2xl p-3 sm:p-4">
					<div className="flex items-center justify-between mb-2 sm:mb-3">
						<div className="p-1.5 sm:p-2 rounded-lg bg-destructive/15">
							<ShieldMinus className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
						</div>
					</div>
					<p className="text-[11px] sm:text-xs font-medium text-muted-foreground mb-1">
						{t("company.payroll.totalDeductions")}
					</p>
					<p className="truncate text-base sm:text-lg font-bold text-destructive">
						{formatCurrency(totalDeductions)}
					</p>
				</div>

				<div className="bg-card border-2 rounded-2xl p-3 sm:p-4">
					<div className="flex items-center justify-between mb-2 sm:mb-3">
						<div className="p-1.5 sm:flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Users className="h-4 w-4 sm:h-5 sm:w-5 text-chart-4" />
						</div>
					</div>
					<p className="text-[11px] sm:text-xs font-medium text-muted-foreground mb-1">
						{t("company.payroll.netTotal")}
					</p>
					<p className="truncate text-base sm:text-lg font-bold text-chart-4">
						{formatCurrency(netTotal)}
					</p>
				</div>
			</div>

			{/* Employee Items Table */}
			<div className="bg-card border-2 rounded-2xl overflow-x-auto">
				<div className="flex items-center gap-3 p-5 border-b-2">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Users className="h-5 w-5 text-chart-4" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.payroll.employeeItems")}
					</h3>
					<Badge className="border-0 text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
						{items.length}
					</Badge>
				</div>
				<Table className="table-fixed w-full min-w-[1100px]">
					<TableHeader>
						<TableRow className="border-b-2 hover:bg-transparent">
							<TableHead className="text-end text-muted-foreground w-[16%]">
								{t("company.payroll.employeeName")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[10%]">
								{t("company.payroll.employeeNo")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[11%]">
								{t("company.payroll.baseSalary")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[11%]">
								{t("company.payroll.housingAllowance")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[11%]">
								{t("company.payroll.transportAllowance")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[11%]">
								{t("company.payroll.otherAllowances")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[10%]">
								{t("company.payroll.gosiDeduction")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[11%]">
								{t("company.payroll.netSalary")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[9%]">
								{t("company.payroll.financeStatus")}
							</TableHead>
							{run.status === "DRAFT" && items.length > 0 && (
								<TableHead className="text-end text-muted-foreground w-[8%]">
									{t("company.common.actions")}
								</TableHead>
							)}
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.length ? (
							items.map((item: any, index: any) => (
								<TableRow
									key={item.id}
									className="border-b-2 hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
								>
									<TableCell className="text-end">
										<p className="font-medium text-card-foreground truncate">
											{item.employee?.name ?? "-"}
										</p>
									</TableCell>
									<TableCell className="text-end text-muted-foreground">
										{item.employee?.employeeNo ?? "-"}
									</TableCell>
									<TableCell className="text-end text-card-foreground font-medium">
										{formatCurrency(Number(item.baseSalary ?? 0))}
									</TableCell>
									<TableCell className="text-end text-muted-foreground">
										{formatCurrency(Number(item.housingAllowance ?? 0))}
									</TableCell>
									<TableCell className="text-end text-muted-foreground">
										{formatCurrency(Number(item.transportAllowance ?? 0))}
									</TableCell>
									<TableCell className="text-end text-muted-foreground">
										{formatCurrency(Number(item.otherAllowances ?? 0))}
									</TableCell>
									<TableCell className="text-end text-destructive">
										{formatCurrency(Number(item.gosiDeduction ?? 0))}
									</TableCell>
									<TableCell className="text-end font-semibold text-card-foreground">
										{formatCurrency(Number(item.netSalary ?? 0))}
									</TableCell>
									<TableCell className="text-end">
										{item.financeExpense?.status ? (
											getFinanceStatusBadge(item.financeExpense.status)
										) : (
											<span className="text-xs text-muted-foreground">-</span>
										)}
									</TableCell>
									{run.status === "DRAFT" && (
										<TableCell className="text-end">
											<div className="flex items-center justify-end gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-chart-4/15 hover:text-chart-4"
													onClick={() => setEditItem(item)}
													title={t("company.common.edit")}
													aria-label={t("company.common.edit")}
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
													onClick={() => setDeleteItemId(item.id)}
													title={t("company.common.delete")}
													aria-label={t("company.common.delete")}
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
										<div className="mb-4 rounded-2xl bg-muted p-5">
											<Users className="h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
										</div>
										<p className="text-sm text-muted-foreground">
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
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("company.payroll.approve")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("company.payroll.approveConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					{bankAccounts && (bankAccounts as any).accounts?.length > 0 && (
						<div className="space-y-2 py-2">
							<label className="text-sm font-medium text-card-foreground">
								{t("company.payroll.sourceAccount")}
							</label>
							<Select value={selectedBankId} onValueChange={setSelectedBankId}>
								<SelectTrigger className="rounded-xl">
									<SelectValue placeholder={t("company.payroll.selectSourceAccount")} />
								</SelectTrigger>
								<SelectContent>
									{(bankAccounts as any).accounts?.map((bank: any) => (
										<SelectItem key={bank.id} value={bank.id}>
											{bank.name} {bank.isDefault ? `(${t("company.payroll.default")})` : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("company.common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => approveMutation.mutate()}
							disabled={approveMutation.isPending}
							className="rounded-xl bg-chart-4 hover:bg-chart-4"
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
				<AlertDialogContent className="rounded-2xl">
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
							className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
				onOpenChange={(open: any) => !open && setDeleteItemId(null)}
			>
				<AlertDialogContent className="rounded-2xl">
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
							className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
