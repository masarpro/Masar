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
	DRAFT: "bg-muted text-muted-foreground",
	POSTED: "bg-chart-4/15 text-chart-4",
	CANCELLED: "bg-destructive/15 text-destructive",
};

const FINANCE_STATUS_STYLES: Record<string, string> = {
	PENDING: "bg-chart-1/15 text-chart-1",
	COMPLETED: "bg-chart-4/15 text-chart-4",
	CANCELLED: "bg-destructive/15 text-destructive",
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

	const formatCurrency = (amount: number | string) =>
		formatCurrencySuffixed(Number(amount), t("common.sar"), 2);

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
		return <DetailPageSkeleton />;
	}

	if (!run) return null;

	const items = run.items ?? [];
	const totalAmount = items.reduce((sum: any, item: any) => sum + Number(item.amount ?? 0), 0);

	return (
		<div className="space-y-6" >
			{/* Back Button */}
			<Button
				variant="ghost"
				className="rounded-lg hover:bg-accent gap-2"
				onClick={() => router.push(`/app/${organizationSlug}/company/expense-runs`)}
			>
				<ArrowRight className="h-4 w-4" />
				{t("company.expenseRuns.backToPostings")}
			</Button>

			{/* Header Card */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b-2">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<FileText className="h-5 w-5 text-chart-4" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.expenseRuns.runDetail")}
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
									{t("company.expenseRuns.createdBy")}: {run.createdBy.name}
								</p>
							)}
							{run.postedBy && (
								<p className="text-xs text-muted-foreground">
									{t("company.expenseRuns.postedBy")}: {run.postedBy.name}
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
										{t("company.expenseRuns.populate")}
									</Button>
									<Button
										className="rounded-lg bg-chart-4 text-white hover:bg-chart-4/90"
										onClick={() => setShowPostDialog(true)}
										disabled={postMutation.isPending}
									>
										<Send className="ms-2 h-4 w-4" />
										{t("company.expenseRuns.postToFinance")}
									</Button>
									<Button
										variant="outline"
										className="rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
										onClick={() => setShowCancelDialog(true)}
										disabled={cancelMutation.isPending}
									>
										<XCircle className="ms-2 h-4 w-4" />
										{t("company.expenseRuns.cancel")}
									</Button>
								</>
							)}
							{run.status === "POSTED" && (
								<Button
									variant="outline"
									className="rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
									onClick={() => setShowCancelDialog(true)}
									disabled={cancelMutation.isPending}
								>
									<XCircle className="ms-2 h-4 w-4" />
									{t("company.expenseRuns.cancel")}
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Summary Cards — مضغوطة على الجوال */}
			<div className="grid grid-cols-2 gap-2 sm:gap-4">
				<div className="bg-card border-2 rounded-2xl p-3 sm:p-4">
					<div className="flex items-center justify-between mb-2 sm:mb-3">
						<div className="p-1.5 sm:flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-chart-4" />
						</div>
					</div>
					<p className="text-[11px] sm:text-xs font-medium text-muted-foreground mb-1">
						{t("company.expenseRuns.totalAmount")}
					</p>
					<p className="truncate text-base sm:text-lg font-bold text-chart-4">
						{formatCurrency(totalAmount)}
					</p>
				</div>

				<div className="bg-card border-2 rounded-2xl p-3 sm:p-4">
					<div className="flex items-center justify-between mb-2 sm:mb-3">
						<div className="p-1.5 sm:flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<FileText className="h-4 w-4 sm:h-5 sm:w-5 text-chart-4" />
						</div>
					</div>
					<p className="text-[11px] sm:text-xs font-medium text-muted-foreground mb-1">
						{t("company.expenseRuns.itemCount")}
					</p>
					<p className="truncate text-base sm:text-lg font-bold text-chart-4">
						{items.length}
					</p>
				</div>
			</div>

			{/* Expense Items Table */}
			<div className="bg-card border-2 rounded-2xl overflow-x-auto">
				<div className="flex items-center gap-3 p-5 border-b-2">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Receipt className="h-5 w-5 text-chart-4" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.expenseRuns.expenseItems")}
					</h3>
					<Badge className="border-0 text-[10px] px-2 py-0.5 bg-muted text-muted-foreground">
						{items.length}
					</Badge>
				</div>
				<Table className="table-fixed w-full min-w-[860px]">
					<TableHeader>
						<TableRow className="border-b-2 hover:bg-transparent">
							<TableHead className="text-end text-muted-foreground w-[22%]">
								{t("company.expenseRuns.expenseName")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[15%]">
								{t("company.expenseRuns.category")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[15%]">
								{t("company.expenseRuns.vendor")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[14%]">
								{t("company.expenseRuns.originalAmount")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[14%]">
								{t("company.expenseRuns.amount")}
							</TableHead>
							<TableHead className="text-end text-muted-foreground w-[12%]">
								{t("company.expenseRuns.financeStatus")}
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
											{item.name ?? "-"}
										</p>
									</TableCell>
									<TableCell className="text-end text-muted-foreground">
										{item.category ? t(`company.expenses.categories.${item.category}`) : "-"}
									</TableCell>
									<TableCell className="text-end text-muted-foreground">
										{item.vendor ?? "-"}
									</TableCell>
									<TableCell className="text-end text-muted-foreground">
										{formatCurrency(Number(item.originalAmount ?? 0))}
									</TableCell>
									<TableCell className="text-end font-semibold text-card-foreground">
										{formatCurrency(Number(item.amount ?? 0))}
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
												>
													<Pencil className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
										<div className="mb-4 rounded-2xl bg-muted p-5">
											<Receipt className="h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
										</div>
										<p className="text-sm text-muted-foreground">
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
				<AlertDialogContent  className="rounded-2xl">
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
							className="rounded-xl bg-chart-4 hover:bg-chart-4"
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
				<AlertDialogContent  className="rounded-2xl">
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
							className="rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
				onOpenChange={(open: any) => !open && setDeleteItemId(null)}
			>
				<AlertDialogContent  className="rounded-2xl">
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
