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
	Receipt,
	CheckCircle,
	Loader2,
	RefreshCw,
	Send,
	XCircle,
	FileText,
	Pencil,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { EditExpenseRunItemDialog } from "./EditExpenseRunItemDialog";

interface ExpenseRunDetailProps {
	organizationId: string;
	organizationSlug: string;
	runId: string;
}

const STATUS_STYLES: Record<string, string> = {
	DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
	POSTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
	CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

const FINANCE_STATUS_STYLES: Record<string, string> = {
	PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
	COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
	CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

export function ExpenseRunDetail({ organizationId, organizationSlug, runId }: ExpenseRunDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [showPostDialog, setShowPostDialog] = useState(false);
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [editItem, setEditItem] = useState<{ id: string; [key: string]: unknown } | null>(null);
	const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

	const queryKey = orpc.company.expenseRuns.getById.queryOptions({
		input: { organizationId, id: runId },
	}).queryKey;

	const { data: run, isLoading } = useQuery(
		orpc.company.expenseRuns.getById.queryOptions({
			input: { organizationId, id: runId },
		}),
	);

	const formatCurrency = (amount: number | string) => {
		return new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2 }).format(Number(amount)) + " ر.س";
	};

	const getRunNo = (r: { year: number; month: number }) =>
		`FEXP-${r.year}-${String(r.month).padStart(2, "0")}`;

	const getStatusBadge = (status: string) => {
		const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
		const labelKey = status.toLowerCase() as "draft" | "posted" | "cancelled";
		return (
			<Badge className={`border-0 text-[10px] px-2 py-0.5 ${style}`}>
				{t(`company.expenseRuns.${labelKey}`)}
			</Badge>
		);
	};

	const getFinanceStatusBadge = (status: string) => {
		const style = FINANCE_STATUS_STYLES[status] ?? FINANCE_STATUS_STYLES.PENDING;
		return (
			<Badge className={`border-0 text-[10px] px-1.5 py-0.5 ${style}`}>
				{t(`company.expenseRuns.financeStatus_${status.toLowerCase()}`)}
			</Badge>
		);
	};

	// --- Mutations ---

	const populateMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.expenseRuns.populate({
				organizationId,
				id: runId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.expenseRuns.populateSuccess"));
			queryClient.invalidateQueries({ queryKey });
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.expenseRuns.populateError"));
		},
	});

	const postMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.expenseRuns.post({
				organizationId,
				id: runId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.expenseRuns.postSuccess"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: orpc.company.expenseRuns.list.queryOptions({ input: { organizationId } }).queryKey,
			});
			setShowPostDialog(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.expenseRuns.postError"));
			setShowPostDialog(false);
		},
	});

	const cancelMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.expenseRuns.cancel({
				organizationId,
				id: runId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.expenseRuns.cancelSuccess"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({
				queryKey: orpc.company.expenseRuns.list.queryOptions({ input: { organizationId } }).queryKey,
			});
			setShowCancelDialog(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.expenseRuns.cancelError"));
			setShowCancelDialog(false);
		},
	});

	const updateItemMutation = useMutation({
		mutationFn: async (data: {
			itemId: string;
			amount: number;
			notes?: string;
		}) => {
			return orpcClient.company.expenseRuns.updateItem({
				organizationId,
				itemId: data.itemId,
				amount: data.amount,
				notes: data.notes,
			});
		},
		onSuccess: () => {
			toast.success(t("company.expenseRuns.updateItemSuccess"));
			queryClient.invalidateQueries({ queryKey });
			setEditItem(null);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.expenseRuns.updateItemError"));
		},
	});

	const deleteItemMutation = useMutation({
		mutationFn: async (itemId: string) => {
			return orpcClient.company.expenseRuns.deleteItem({
				organizationId,
				itemId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.expenseRuns.deleteItemSuccess"));
			queryClient.invalidateQueries({ queryKey });
			setDeleteItemId(null);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.expenseRuns.deleteItemError"));
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
	const totalAmount = items.reduce((sum, item) => sum + Number(item.amount ?? 0), 0);

	return (
		<div className="space-y-6" dir="rtl">
			{/* Back Button */}
			<Button
				variant="ghost"
				className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 gap-2"
				onClick={() => router.push(`/app/${organizationSlug}/company/expense-runs`)}
			>
				<ArrowRight className="h-4 w-4" />
				{t("company.expenseRuns.backToPostings")}
			</Button>

			{/* Header Card */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
						<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.expenseRuns.runDetail")}
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
							{run.createdBy && (
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{t("company.expenseRuns.createdBy")}: {run.createdBy.name}
								</p>
							)}
							{run.postedBy && (
								<p className="text-xs text-slate-500 dark:text-slate-400">
									{t("company.expenseRuns.postedBy")}: {run.postedBy.name}
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
										{t("company.expenseRuns.populate")}
									</Button>
									<Button
										className="rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
										onClick={() => setShowPostDialog(true)}
										disabled={postMutation.isPending}
									>
										<Send className="ml-2 h-4 w-4" />
										{t("company.expenseRuns.postToFinance")}
									</Button>
									<Button
										variant="outline"
										className="rounded-xl border-red-200/50 dark:border-red-800/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
										onClick={() => setShowCancelDialog(true)}
										disabled={cancelMutation.isPending}
									>
										<XCircle className="ml-2 h-4 w-4" />
										{t("company.expenseRuns.cancel")}
									</Button>
								</>
							)}
							{run.status === "POSTED" && (
								<Button
									variant="outline"
									className="rounded-xl border-red-200/50 dark:border-red-800/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
									onClick={() => setShowCancelDialog(true)}
									disabled={cancelMutation.isPending}
								>
									<XCircle className="ml-2 h-4 w-4" />
									{t("company.expenseRuns.cancel")}
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 gap-4">
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
							<Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.expenseRuns.totalAmount")}
					</p>
					<p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
						{formatCurrency(totalAmount)}
					</p>
				</div>

				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
							<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.expenseRuns.itemCount")}
					</p>
					<p className="text-lg font-bold text-blue-700 dark:text-blue-300">
						{items.length}
					</p>
				</div>
			</div>

			{/* Expense Items Table */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
						<Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.expenseRuns.expenseItems")}
					</h3>
					<Badge className="border-0 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
						{items.length}
					</Badge>
				</div>
				<Table className="table-fixed w-full">
					<TableHeader>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-transparent">
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[22%]">
								{t("company.expenseRuns.expenseName")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[15%]">
								{t("company.expenseRuns.category")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[15%]">
								{t("company.expenseRuns.vendor")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[14%]">
								{t("company.expenseRuns.originalAmount")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[14%]">
								{t("company.expenseRuns.amount")}
							</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[12%]">
								{t("company.expenseRuns.financeStatus")}
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
											{item.name ?? "-"}
										</p>
									</TableCell>
									<TableCell className="text-right text-slate-600 dark:text-slate-300">
										{item.category ? t(`company.expenses.categories.${item.category}`) : "-"}
									</TableCell>
									<TableCell className="text-right text-slate-600 dark:text-slate-300">
										{item.vendor ?? "-"}
									</TableCell>
									<TableCell className="text-right text-slate-600 dark:text-slate-300">
										{formatCurrency(item.originalAmount ?? 0)}
									</TableCell>
									<TableCell className="text-right font-semibold text-slate-900 dark:text-slate-100">
										{formatCurrency(item.amount ?? 0)}
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
								<TableCell colSpan={7} className="text-center py-16">
									<div className="flex flex-col items-center">
										<div className="mb-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-xl p-5">
											<Receipt className="h-10 w-10 text-slate-400 dark:text-slate-500" />
										</div>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{t("company.expenseRuns.noItems")}
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Post to Finance Confirmation Dialog */}
			<AlertDialog open={showPostDialog} onOpenChange={setShowPostDialog}>
				<AlertDialogContent dir="rtl" className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("company.expenseRuns.postToFinance")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("company.expenseRuns.postConfirm")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("company.common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => postMutation.mutate()}
							disabled={postMutation.isPending}
							className="rounded-xl bg-blue-600 hover:bg-blue-700"
						>
							{postMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 me-2 animate-spin" />
									{t("company.common.saving")}
								</>
							) : (
								t("company.expenseRuns.postToFinance")
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
							{t("company.expenseRuns.cancel")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("company.expenseRuns.cancelConfirm")}
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
								t("company.expenseRuns.cancel")
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Edit Expense Run Item Dialog */}
			<EditExpenseRunItemDialog
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
							{t("company.expenseRuns.deleteItem")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("company.expenseRuns.deleteItemConfirm")}
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
