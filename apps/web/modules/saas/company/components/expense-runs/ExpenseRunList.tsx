"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Plus, CalendarRange, Receipt, FileText, Loader2, Send, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Currency } from "../../../finance/components/shared/Currency";

interface ExpenseRunListProps {
	organizationId: string;
	organizationSlug: string;
}

const EXPENSE_RUN_STATUSES = ["DRAFT", "POSTED", "CANCELLED"] as const;

const STATUS_STYLES: Record<string, string> = {
	DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
	POSTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
	CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

export function ExpenseRunList({ organizationId, organizationSlug }: ExpenseRunListProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [createMonth, setCreateMonth] = useState<number>(new Date().getMonth() + 1);
	const [createYear, setCreateYear] = useState<number>(new Date().getFullYear());

	const { data, isLoading } = useQuery(
		orpc.company.expenseRuns.list.queryOptions({
			input: {
				organizationId,
				status: statusFilter !== "all" ? (statusFilter as typeof EXPENSE_RUN_STATUSES[number]) : undefined,
			},
		}),
	);

	const runs = data?.runs ?? [];

	const currentMonthRun = runs.find((r) => {
		const now = new Date();
		return r.month === now.getMonth() + 1 && r.year === now.getFullYear();
	});

	const latestRun = runs.length > 0 ? runs[0] : null;

	const createMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.expenseRuns.create({
				organizationId,
				month: createMonth,
				year: createYear,
			});
		},
		onSuccess: (result) => {
			toast.success(t("company.expenseRuns.createSuccess"));
			queryClient.invalidateQueries({
				queryKey: orpc.company.expenseRuns.list.queryOptions({ input: { organizationId } }).queryKey,
			});
			setShowCreateDialog(false);
			if (result?.id) {
				router.push(`/app/${organizationSlug}/company/expense-runs/${result.id}`);
			}
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.expenseRuns.createError"));
		},
	});

	const getStatusBadge = (status: string) => {
		const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
		const labelKey = status.toLowerCase() as "draft" | "posted" | "cancelled";
		return (
			<Badge className={`border-0 text-[10px] px-2 py-0.5 ${style}`}>
				{t(`company.expenseRuns.${labelKey}`)}
			</Badge>
		);
	};

	const getRunNo = (run: { year: number; month: number }) =>
		`FEXP-${run.year}-${String(run.month).padStart(2, "0")}`;

	return (
		<div className="space-y-6" dir="rtl">
			{/* Back to Expenses */}
			<Button
				variant="ghost"
				className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 gap-2"
				onClick={() => router.push(`/app/${organizationSlug}/company/expenses`)}
			>
				<ArrowRight className="h-4 w-4" />
				{t("company.expenses.title")}
			</Button>

			{/* Summary Cards - Glass Morphism */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
							<FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.expenseRuns.totalRuns")}
					</p>
					<p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
						{runs.length}
					</p>
				</div>

				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
							<CalendarRange className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.expenseRuns.currentMonthStatus")}
					</p>
					<div className="mt-1">
						{currentMonthRun ? (
							getStatusBadge(currentMonthRun.status)
						) : (
							<span className="text-sm text-slate-400">{t("company.expenseRuns.noRuns")}</span>
						)}
					</div>
				</div>

				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
							<Receipt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
					</div>
					<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
						{t("company.expenseRuns.totalAmount")}
					</p>
					<p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
						{latestRun ? (
							<Currency amount={Number(latestRun.totalAmount)} />
						) : (
							<Currency amount={0} />
						)}
					</p>
				</div>
			</div>

			{/* Filter Bar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[160px] rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
							<SelectValue placeholder={t("company.expenseRuns.status")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							{EXPENSE_RUN_STATUSES.map((status) => (
								<SelectItem key={status} value={status}>
									{t(`company.expenseRuns.${status.toLowerCase()}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button
					onClick={() => setShowCreateDialog(true)}
					className="rounded-xl bg-slate-900 text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
				>
					<Plus className="ml-2 h-4 w-4" />
					{t("company.expenseRuns.createRun")}
				</Button>
			</div>

			{/* Table - Glass Morphism */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<Table className="table-fixed w-full">
					<TableHeader>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-transparent">
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[20%]">{t("company.expenseRuns.runNo")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[20%]">{t("company.expenseRuns.month")} / {t("company.expenseRuns.year")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[15%]">{t("company.expenseRuns.itemCount")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[20%]">{t("company.expenseRuns.totalAmount")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[15%]">{t("company.expenseRuns.status")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[10%]">{t("company.common.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i} className="border-white/10 dark:border-slate-700/30">
									{[...Array(6)].map((_, j) => (
										<TableCell key={j}>
											<div className="h-4 animate-pulse rounded bg-muted" />
										</TableCell>
									))}
								</TableRow>
							))
						) : runs.length ? (
							runs.map((run, index) => (
								<TableRow
									key={run.id}
									className="cursor-pointer border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
									onClick={() => router.push(`/app/${organizationSlug}/company/expense-runs/${run.id}`)}
								>
									<TableCell className="text-right">
										<p className="font-medium text-slate-900 dark:text-slate-100">
											{getRunNo(run)}
										</p>
									</TableCell>
									<TableCell className="text-right text-slate-600 dark:text-slate-300">
										{run.month} / {run.year}
									</TableCell>
									<TableCell className="text-right text-slate-600 dark:text-slate-300">
										{run.itemCount ?? 0}
									</TableCell>
									<TableCell className="text-right font-semibold text-slate-700 dark:text-slate-300">
										<Currency amount={Number(run.totalAmount)} />
									</TableCell>
									<TableCell className="text-right">
										{getStatusBadge(run.status)}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="ghost"
											size="icon"
											className="rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50"
											onClick={(e) => {
												e.stopPropagation();
												router.push(`/app/${organizationSlug}/company/expense-runs/${run.id}`);
											}}
										>
											<FileText className="h-4 w-4 text-slate-500" />
										</Button>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-16">
									<div className="flex flex-col items-center">
										<div className="mb-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-xl p-5">
											<FileText className="h-10 w-10 text-slate-400 dark:text-slate-500" />
										</div>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{t("company.expenseRuns.noRuns")}
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Create Expense Run Dialog */}
			{showCreateDialog && (
				<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
					<DialogContent dir="rtl" className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
						<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
							<DialogTitle className="text-base font-semibold text-right">
								{t("company.expenseRuns.createRun")}
							</DialogTitle>
						</DialogHeader>

						<form
							onSubmit={(e) => {
								e.preventDefault();
								createMutation.mutate();
							}}
						>
							<div className="p-5 space-y-4">
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1">
										<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
											{t("company.expenseRuns.month")} *
										</Label>
										<Select
											value={String(createMonth)}
											onValueChange={(value) => setCreateMonth(Number(value))}
										>
											<SelectTrigger className="rounded-xl h-10">
												<SelectValue />
											</SelectTrigger>
											<SelectContent className="rounded-xl max-h-[250px]">
												{Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
													<SelectItem key={m} value={String(m)}>
														{m}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1">
										<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
											{t("company.expenseRuns.year")} *
										</Label>
										<Input
											type="number"
											min={2020}
											max={2100}
											value={createYear}
											onChange={(e) => setCreateYear(Number(e.target.value))}
											className="rounded-xl h-10"
											required
										/>
									</div>
								</div>
							</div>

							{/* Footer Actions */}
							<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex gap-3">
								<Button
									type="button"
									variant="outline"
									className="flex-1 rounded-xl h-10"
									onClick={() => setShowCreateDialog(false)}
									disabled={createMutation.isPending}
								>
									{t("company.common.cancel")}
								</Button>
								<Button
									type="submit"
									className="flex-1 rounded-xl h-10"
									disabled={createMutation.isPending}
								>
									{createMutation.isPending ? (
										<>
											<Loader2 className="h-4 w-4 me-2 animate-spin" />
											{t("company.common.saving")}
										</>
									) : (
										<>
											<Send className="h-4 w-4 me-2" />
											{t("company.expenseRuns.createRun")}
										</>
									)}
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
