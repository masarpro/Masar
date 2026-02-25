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
import { Plus, Search, XCircle, Receipt, Banknote, CalendarRange, Send } from "lucide-react";
import { toast } from "sonner";
import { AddExpenseDialog } from "./AddExpenseDialog";

interface ExpenseListProps {
	organizationId: string;
	organizationSlug: string;
}

const EXPENSE_CATEGORIES = [
	"RENT", "UTILITIES", "COMMUNICATIONS", "INSURANCE", "LICENSES",
	"SUBSCRIPTIONS", "MAINTENANCE", "BANK_FEES", "MARKETING",
	"TRANSPORT", "HOSPITALITY", "OTHER",
] as const;

export function ExpenseList({ organizationId, organizationSlug }: ExpenseListProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [search, setSearch] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [activeFilter, setActiveFilter] = useState<string>("all");
	const [showAddDialog, setShowAddDialog] = useState(false);

	const { data, isLoading } = useQuery(
		orpc.company.expenses.list.queryOptions({
			input: {
				organizationId,
				query: search || undefined,
				category: categoryFilter !== "all" ? (categoryFilter as typeof EXPENSE_CATEGORIES[number]) : undefined,
				isActive: activeFilter !== "all" ? activeFilter === "true" : undefined,
			},
		}),
	);

	const { data: summary } = useQuery(
		orpc.company.expenses.getSummary.queryOptions({
			input: { organizationId },
		}),
	);

	const deactivateMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.company.expenses.deactivate({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("company.expenses.deactivateSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.expenses.list.queryOptions({ input: { organizationId } }).queryKey });
			queryClient.invalidateQueries({ queryKey: orpc.company.expenses.getSummary.queryOptions({ input: { organizationId } }).queryKey });
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.expenses.deactivateError"));
		},
	});

	const formatCurrency = (amount: number) =>
		new Intl.NumberFormat("ar-SA").format(amount) + " ر.س";

	const getStatusBadge = (active: boolean) => {
		if (active) {
			return (
				<Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-0 text-[10px] px-2 py-0.5">
					{t("company.expenses.statusActive")}
				</Badge>
			);
		}
		return (
			<Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-0 text-[10px] px-2 py-0.5">
				{t("company.expenses.statusInactive")}
			</Badge>
		);
	};

	const getRecurrenceBadge = (recurrence: string) => {
		const styles: Record<string, string> = {
			MONTHLY: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
			QUARTERLY: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
			SEMI_ANNUAL: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
			ANNUAL: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
			ONE_TIME: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
		};
		return (
			<Badge className={`border-0 text-[10px] px-2 py-0.5 ${styles[recurrence] ?? styles.ONE_TIME}`}>
				{t(`company.expenses.recurrences.${recurrence}`)}
			</Badge>
		);
	};

	return (
		<div className="space-y-6" dir="rtl">
			{/* Summary Cards - Glass Morphism */}
			{summary && (
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
								<Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>
						</div>
						<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
							{t("company.expenses.totalMonthly")}
						</p>
						<p className="text-xl font-bold text-blue-700 dark:text-blue-300">
							{formatCurrency(summary.totalMonthlyAmount)}
						</p>
					</div>

					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
								<CalendarRange className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
							</div>
						</div>
						<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
							{t("company.expenses.totalAnnual")}
						</p>
						<p className="text-xl font-bold text-indigo-700 dark:text-indigo-300">
							{formatCurrency(summary.totalAnnualAmount)}
						</p>
					</div>

					<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
								<Receipt className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
							</div>
						</div>
						<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
							{t("company.expenses.activeCount")}
						</p>
						<p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
							{summary.totalActiveExpenses}
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
							placeholder={t("company.expenses.searchPlaceholder")}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl pr-10 focus:ring-1 focus:ring-primary/30"
						/>
					</div>
					<Select value={categoryFilter} onValueChange={setCategoryFilter}>
						<SelectTrigger className="w-[160px] rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
							<SelectValue placeholder={t("company.expenses.filterCategory")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							{EXPENSE_CATEGORIES.map((category) => (
								<SelectItem key={category} value={category}>
									{t(`company.expenses.categories.${category}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select value={activeFilter} onValueChange={setActiveFilter}>
						<SelectTrigger className="w-[140px] rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
							<SelectValue placeholder={t("company.expenses.filterStatus")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							<SelectItem value="true">{t("company.expenses.statusActive")}</SelectItem>
							<SelectItem value="false">{t("company.expenses.statusInactive")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => router.push(`/app/${organizationSlug}/company/expense-runs`)}
						className="rounded-xl border-blue-200/50 dark:border-blue-800/30 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
					>
						<Send className="ml-2 h-4 w-4" />
						{t("company.expenses.postToFinance")}
					</Button>
					<Button
						onClick={() => setShowAddDialog(true)}
						className="rounded-xl bg-slate-900 text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
					>
						<Plus className="ml-2 h-4 w-4" />
						{t("company.expenses.addExpense")}
					</Button>
				</div>
			</div>

			{/* Table - Glass Morphism */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<Table className="table-fixed w-full">
					<TableHeader>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-transparent">
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[20%]">{t("company.expenses.name")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[15%]">{t("company.expenses.category")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[15%]">{t("company.expenses.amount")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[14%]">{t("company.expenses.recurrenceLabel")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[16%]">{t("company.expenses.vendor")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[12%]">{t("company.expenses.status")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400 w-[8%]">{t("company.common.actions")}</TableHead>
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
						) : data?.expenses?.length ? (
							data.expenses.map((expense, index) => (
								<TableRow
									key={expense.id}
									className="cursor-pointer border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
									onClick={() => router.push(`/app/${organizationSlug}/company/expenses/${expense.id}`)}
								>
									<TableCell className="text-right">
										<p className="font-medium text-slate-900 dark:text-slate-100 truncate">{expense.name}</p>
									</TableCell>
									<TableCell className="text-right text-slate-600 dark:text-slate-300">
										{t(`company.expenses.categories.${expense.category}`)}
									</TableCell>
									<TableCell className="text-right font-semibold text-slate-700 dark:text-slate-300">
										{formatCurrency(Number(expense.amount))}
									</TableCell>
									<TableCell className="text-right">{getRecurrenceBadge(expense.recurrence)}</TableCell>
									<TableCell className="text-right">
										{expense.vendor ? (
											<span className="text-slate-600 dark:text-slate-300 truncate block">{expense.vendor}</span>
										) : (
											<span className="text-xs text-slate-400">-</span>
										)}
									</TableCell>
									<TableCell className="text-right">{getStatusBadge(expense.active)}</TableCell>
									<TableCell className="text-right">
										{expense.active && (
											<Button
												variant="ghost"
												size="icon"
												className="rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
												onClick={(e) => {
													e.stopPropagation();
													if (confirm(t("company.expenses.confirmDeactivate"))) {
														deactivateMutation.mutate(expense.id);
													}
												}}
											>
												<XCircle className="h-4 w-4 text-destructive" />
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
											<Receipt className="h-10 w-10 text-slate-400 dark:text-slate-500" />
										</div>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{t("company.expenses.noExpenses")}
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{showAddDialog && (
				<AddExpenseDialog
					open={showAddDialog}
					onOpenChange={setShowAddDialog}
					organizationId={organizationId}
				/>
			)}
		</div>
	);
}
