"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
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
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import {
	Search,
	Plus,
	MoreVertical,
	Pencil,
	Trash2,
	TrendingDown,
	Eye,
	Calendar,
	Building,
	FileText,
} from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { Currency } from "../shared/Currency";

interface ExpensesListProps {
	organizationId: string;
	organizationSlug: string;
}

// فئات المصروفات
const EXPENSE_CATEGORIES = [
	"MATERIALS",
	"LABOR",
	"EQUIPMENT_RENTAL",
	"EQUIPMENT_PURCHASE",
	"SUBCONTRACTOR",
	"TRANSPORT",
	"SALARIES",
	"RENT",
	"UTILITIES",
	"COMMUNICATIONS",
	"INSURANCE",
	"LICENSES",
	"BANK_FEES",
	"FUEL",
	"MAINTENANCE",
	"SUPPLIES",
	"MARKETING",
	"TRAINING",
	"TRAVEL",
	"HOSPITALITY",
	"LOAN_PAYMENT",
	"TAXES",
	"ZAKAT",
	"REFUND",
	"MISC",
	"CUSTOM",
] as const;

export function ExpensesList({
	organizationId,
	organizationSlug,
}: ExpensesListProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	// State
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
	const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

	// Fetch expenses
	const { data, isLoading } = useQuery(
		orpc.finance.expenses.list.queryOptions({
			input: {
				organizationId,
				query: searchQuery || undefined,
				category: categoryFilter as any,
			},
		}),
	);

	// Fetch expenses summary
	const { data: summaryData } = useQuery(
		orpc.finance.expenses.getSummary.queryOptions({
			input: { organizationId },
		}),
	);

	const expenses = data?.expenses ?? [];
	const totalExpenses = summaryData?.reduce((acc, item) => acc + item.total, 0) ?? 0;

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.expenses.delete({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.expenses.deleteSuccess"));
			setDeleteExpenseId(null);
			queryClient.invalidateQueries({ queryKey: ["finance", "expenses"] });
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.expenses.deleteError"));
		},
	});

	const getCategoryLabel = (category: string) => {
		return t(`finance.expenses.categories.${category.toLowerCase()}`);
	};

	const getCategoryColor = (category: string) => {
		const colors: Record<string, string> = {
			MATERIALS: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
			LABOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
			SALARIES: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400",
			RENT: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
			UTILITIES: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400",
			FUEL: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400",
			MAINTENANCE: "bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-400",
		};
		return colors[category] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
	};

	return (
		<div className="space-y-6">
			{/* Summary Card */}
			<Card className="rounded-2xl">
				<CardContent className="p-4">
					<div className="flex items-center gap-3">
						<div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-xl">
							<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
						</div>
						<div>
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("finance.expenses.totalExpenses")}
							</p>
							<p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
								<Currency amount={totalExpenses} />
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Filters */}
			<Card className="rounded-2xl">
				<CardContent className="p-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
							<Input
								placeholder={t("finance.expenses.searchPlaceholder")}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="ps-10 rounded-xl"
							/>
						</div>
						<Select
							value={categoryFilter || "all"}
							onValueChange={(value) =>
								setCategoryFilter(value === "all" ? undefined : value)
							}
						>
							<SelectTrigger className="w-[200px] rounded-xl">
								<SelectValue placeholder={t("finance.expenses.filterByCategory")} />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="all">{t("common.all")}</SelectItem>
								{EXPENSE_CATEGORIES.map((category) => (
									<SelectItem key={category} value={category}>
										{getCategoryLabel(category)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Expenses Table */}
			<Card className="rounded-2xl">
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<div className="relative">
								<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
								<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
							</div>
						</div>
					) : expenses.length === 0 ? (
						<div className="text-center py-20">
							<TrendingDown className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
							<p className="text-slate-500 dark:text-slate-400">
								{searchQuery
									? t("finance.expenses.noSearchResults")
									: t("finance.expenses.noExpenses")}
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("finance.expenses.expenseNo")}</TableHead>
									<TableHead>{t("finance.expenses.date")}</TableHead>
									<TableHead>{t("finance.expenses.category")}</TableHead>
									<TableHead>{t("finance.expenses.description")}</TableHead>
									<TableHead>{t("finance.expenses.vendor")}</TableHead>
									<TableHead>{t("finance.expenses.account")}</TableHead>
									<TableHead className="text-end">{t("finance.expenses.amount")}</TableHead>
									<TableHead className="w-[50px]" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{expenses.map((expense) => (
									<TableRow
										key={expense.id}
										className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
									>
										<TableCell>
											<Badge variant="outline" className="rounded-lg font-mono">
												{expense.expenseNo}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
												<Calendar className="h-4 w-4" />
												{formatDate(new Date(expense.date))}
											</div>
										</TableCell>
										<TableCell>
											<Badge className={`rounded-lg ${getCategoryColor(expense.category)}`}>
												{getCategoryLabel(expense.category)}
											</Badge>
										</TableCell>
										<TableCell>
											<span className="line-clamp-1">
												{expense.description || "-"}
											</span>
										</TableCell>
										<TableCell>
											{expense.vendorName || <span className="text-slate-400">-</span>}
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2">
												<Building className="h-4 w-4 text-slate-400" />
												<span className="text-sm">{expense.sourceAccount?.name}</span>
											</div>
										</TableCell>
										<TableCell className="text-end">
											<span className="font-semibold text-red-600 dark:text-red-400">
												-<Currency amount={Number(expense.amount)} />
											</span>
										</TableCell>
										<TableCell onClick={(e) => e.stopPropagation()}>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end" className="rounded-xl">
													<DropdownMenuItem
														onClick={() =>
															router.push(
																`/app/${organizationSlug}/finance/expenses/${expense.id}`,
															)
														}
													>
														<Eye className="h-4 w-4 me-2" />
														{t("common.view")}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() =>
															router.push(
																`/app/${organizationSlug}/finance/expenses/${expense.id}`,
															)
														}
													>
														<Pencil className="h-4 w-4 me-2" />
														{t("common.edit")}
													</DropdownMenuItem>
													<DropdownMenuSeparator />
													<DropdownMenuItem
														onClick={() => setDeleteExpenseId(expense.id)}
														className="text-red-600"
													>
														<Trash2 className="h-4 w-4 me-2" />
														{t("common.delete")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deleteExpenseId}
				onOpenChange={() => setDeleteExpenseId(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.expenses.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.expenses.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteExpenseId && deleteMutation.mutate(deleteExpenseId)}
							disabled={deleteMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{deleteMutation.isPending
								? t("common.deleting")
								: t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
