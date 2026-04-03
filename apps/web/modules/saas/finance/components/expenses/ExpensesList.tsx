"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useVirtualRows } from "@saas/shared/hooks/use-virtual-rows";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
import {
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
	Hammer,
	CreditCard,
	Users,
	RotateCcw,
	Package,
	FolderOpen,
	Clock,
	AlertCircle,
} from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { Currency } from "../shared/Currency";
import { PayExpenseDialog } from "./PayExpenseDialog";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { findCategoryById, EXPENSE_CATEGORIES as ALL_CATEGORIES } from "@repo/utils";

interface ExpensesListProps {
	organizationId: string;
	organizationSlug: string;
	projectId?: string;
	basePath?: string;
	hideAddButton?: boolean;
}

export function ExpensesList({
	organizationId,
	organizationSlug,
	projectId,
	basePath: customBasePath,
	hideAddButton,
}: ExpensesListProps) {
	const t = useTranslations();
	const locale = useLocale();
	const router = useRouter();
	const queryClient = useQueryClient();

	// State
	const [searchQuery, setSearchQuery] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
	const [sourceTypeFilter, setSourceTypeFilter] = useState<string | undefined>(undefined);
	const [projectFilter, setProjectFilter] = useState<string | undefined>(projectId);
	const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [payExpense, setPayExpense] = useState<{
		id: string;
		expenseNo: string;
		amount: number | string;
		paidAmount: number | string;
		description?: string | null;
	} | null>(null);

	const effectiveBasePath = customBasePath || `/app/${organizationSlug}/finance/expenses`;

	// Fetch unified expenses + subcontract payments
	const { data, isLoading } = useQuery({
		...orpc.finance.expenses.listUnified.queryOptions({
			input: {
				organizationId,
				query: searchQuery || undefined,
				categoryId: categoryFilter,
				projectId: projectFilter,
			},
		}),
		staleTime: STALE_TIMES.EXPENSES,
	});

	// Fetch projects for filter
	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
	);

	const items = data?.items ?? [];
	const grandTotal = data?.grandTotal ?? 0;
	const expensesTotal = data?.expensesTotal ?? 0;
	const subcontractTotal = data?.subcontractTotal ?? 0;
	const projects = projectsData?.projects ?? [];

	const { containerRef, virtualItems, paddingTop, paddingBottom, isVirtualized } =
		useVirtualRows({ count: items.length, rowHeight: 56, threshold: 50 });

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
		// Try new hierarchical category first
		const cat = findCategoryById(category);
		if (cat) return locale === "ar" ? cat.nameAr : cat.nameEn;
		// Fallback to old translation key for legacy records
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
			MAINTENANCE: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400",
			SUBCONTRACTOR: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400",
		};
		return colors[category] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
	};

	const getSourceTypeIcon = (sourceType: string) => {
		switch (sourceType) {
			case "FACILITY_PAYROLL": return <Users className="h-3 w-3 me-1" />;
			case "FACILITY_RECURRING": return <RotateCcw className="h-3 w-3 me-1" />;
			case "FACILITY_ASSET": return <Package className="h-3 w-3 me-1" />;
			case "PROJECT": return <FolderOpen className="h-3 w-3 me-1" />;
			default: return <CreditCard className="h-3 w-3 me-1" />;
		}
	};

	const getSourceTypeColor = (sourceType: string) => {
		switch (sourceType) {
			case "FACILITY_PAYROLL": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400";
			case "FACILITY_RECURRING": return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400";
			case "FACILITY_ASSET": return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400";
			case "PROJECT": return "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400";
			default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
		}
	};

	const getPaymentStatusBadge = (item: typeof items[number]) => {
		if (item._type !== "expense") return null;
		const expense = item as any;
		const status = expense.status;
		const paidAmount = Number(expense.paidAmount ?? 0);
		const totalAmount = Number(expense.amount ?? 0);
		const dueDate = expense.dueDate;

		if (status === "CANCELLED") {
			return <Badge className="rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-0">{t("finance.expenses.paymentStatus.cancelled")}</Badge>;
		}
		if (paidAmount >= totalAmount && status === "COMPLETED") {
			return <Badge className="rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400 border-0">{t("finance.expenses.paymentStatus.paid")}</Badge>;
		}
		if (status === "PENDING" && paidAmount > 0) {
			if (dueDate && new Date(dueDate) < new Date()) {
				return <Badge className="rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border-0"><AlertCircle className="h-3 w-3 me-1" />{t("finance.expenses.paymentStatus.overdue")}</Badge>;
			}
			return <Badge className="rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 border-0">{t("finance.expenses.paymentStatus.partial")}</Badge>;
		}
		if (status === "PENDING") {
			if (dueDate && new Date(dueDate) < new Date()) {
				return <Badge className="rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 border-0"><AlertCircle className="h-3 w-3 me-1" />{t("finance.expenses.paymentStatus.overdue")}</Badge>;
			}
			return <Badge className="rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 border-0"><Clock className="h-3 w-3 me-1" />{t("finance.expenses.paymentStatus.pending")}</Badge>;
		}
		return <Badge className="rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400 border-0">{t("finance.expenses.paymentStatus.paid")}</Badge>;
	};

	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
									<Currency amount={grandTotal} />
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-xl">
								<TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.expenses.directExpenses")}
								</p>
								<p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
									<Currency amount={expensesTotal} />
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-sky-100 dark:bg-sky-900/50 rounded-xl">
								<Hammer className="h-5 w-5 text-sky-600 dark:text-sky-400" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.expenses.subcontractPayments")}
								</p>
								<p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
									<Currency amount={subcontractTotal} />
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters & Actions */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
					<div className="relative flex-1 max-w-xs">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
						<Input
							placeholder={t("finance.expenses.searchPlaceholder")}
							value={searchQuery}
							onChange={(e: any) => setSearchQuery(e.target.value)}
							className="ps-10 rounded-xl"
						/>
					</div>
					<Select
						value={categoryFilter || "all"}
						onValueChange={(value: any) =>
							setCategoryFilter(value === "all" ? undefined : value)
						}
					>
						<SelectTrigger className="w-48 rounded-xl">
							<SelectValue placeholder={t("finance.expenses.filterByCategory")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("common.all")}</SelectItem>
							{ALL_CATEGORIES.map((cat) => (
								<SelectItem key={cat.id} value={cat.id}>
									{locale === "ar" ? cat.nameAr : cat.nameEn}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Select
						value={sourceTypeFilter || "all"}
						onValueChange={(value: any) =>
							setSourceTypeFilter(value === "all" ? undefined : value)
						}
					>
						<SelectTrigger className="w-48 rounded-xl">
							<SelectValue placeholder={t("finance.expenses.filterBySource")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("common.all")}</SelectItem>
							<SelectItem value="MANUAL">{t("finance.expenses.sourceTypes.manual")}</SelectItem>
							<SelectItem value="FACILITY_PAYROLL">{t("finance.expenses.sourceTypes.facility_payroll")}</SelectItem>
							<SelectItem value="FACILITY_RECURRING">{t("finance.expenses.sourceTypes.facility_recurring")}</SelectItem>
							<SelectItem value="FACILITY_ASSET">{t("finance.expenses.sourceTypes.facility_asset")}</SelectItem>
							<SelectItem value="PROJECT">{t("finance.expenses.sourceTypes.project")}</SelectItem>
						</SelectContent>
					</Select>
					{!projectId && (
						<Select
							value={projectFilter || "all"}
							onValueChange={(value: any) =>
								setProjectFilter(value === "all" ? undefined : value)
							}
						>
							<SelectTrigger className="w-48 rounded-xl">
								<SelectValue placeholder={t("finance.expenses.filterByProject")} />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="all">{t("finance.expenses.allProjects")}</SelectItem>
								{projects.map((project: any) => (
									<SelectItem key={project.id} value={project.id}>
										{project.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>

				{!hideAddButton && (
					<Button
						className="rounded-xl"
						onClick={() => setShowAddDialog(true)}
					>
						<Plus className="me-2 h-4 w-4" />
						{t("finance.expenses.new")}
					</Button>
				)}
			</div>

			{/* Expenses Table */}
			<Card className="rounded-2xl">
				<CardContent className="p-0">
					{isLoading ? <ListTableSkeleton /> : items.length === 0 ? (
						<EmptyState
							icon={<TrendingDown className="h-8 w-8" />}
							description={searchQuery
								? t("finance.expenses.noSearchResults")
								: t("finance.expenses.noExpenses")}
						>
							{!searchQuery && !hideAddButton && (
								<Button
									className="rounded-xl"
									onClick={() => setShowAddDialog(true)}
								>
									<Plus className="me-2 h-4 w-4" />
									{t("finance.expenses.new")}
								</Button>
							)}
						</EmptyState>
					) : (
						<div
							ref={containerRef}
							className="w-full overflow-auto"
							style={isVirtualized ? { maxHeight: 600 } : undefined}
						>
						<table className="w-full caption-bottom text-sm">
							<TableHeader className={isVirtualized ? "sticky top-0 z-10 bg-background" : ""}>
								<TableRow>
									<TableHead>{t("finance.expenses.expenseNo")}</TableHead>
									<TableHead>{t("finance.expenses.date")}</TableHead>
									<TableHead>{t("finance.expenses.type")}</TableHead>
									<TableHead>{t("finance.expenses.source")}</TableHead>
									<TableHead>{t("finance.expenses.category")}</TableHead>
									<TableHead>{t("finance.expenses.description")}</TableHead>
									<TableHead>{t("finance.expenses.account")}</TableHead>
									{!projectId && (
										<TableHead>{t("finance.expenses.project")}</TableHead>
									)}
									<TableHead className="text-end">{t("finance.expenses.amount")}</TableHead>
									<TableHead>{t("finance.expenses.paymentStatusLabel")}</TableHead>
									<TableHead className="w-[50px]" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{isVirtualized && paddingTop > 0 && (
									<tr style={{ height: paddingTop }} />
								)}
								{(isVirtualized
									? virtualItems.map((vi: { index: number }) => items[vi.index])
									: items
								).map((item: (typeof items)[number]) => (
									<TableRow
										key={`${item._type}-${item.id}`}
										className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
									>
										<TableCell>
											<Badge variant="outline" className="rounded-lg font-mono">
												{item.refNo}
											</Badge>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
												<Calendar className="h-4 w-4" />
												{formatDate(new Date(item.date))}
											</div>
										</TableCell>
										<TableCell>
											{item._type === "subcontract_payment" ? (
												<Badge className="rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400 border-0">
													<Hammer className="h-3 w-3 me-1" />
													{t("finance.expenses.subcontractBadge")}
												</Badge>
											) : (
												<Badge variant="outline" className="rounded-lg">
													{t("finance.expenses.expenseBadge")}
												</Badge>
											)}
										</TableCell>
										<TableCell>
											{item._type === "expense" ? (
												<Badge className={`rounded-lg border-0 ${getSourceTypeColor((item as any).sourceType ?? "MANUAL")}`}>
													{getSourceTypeIcon((item as any).sourceType ?? "MANUAL")}
													{t(`finance.expenses.sourceTypes.${((item as any).sourceType ?? "MANUAL").toLowerCase()}`)}
												</Badge>
											) : (
												<span className="text-slate-400">-</span>
											)}
										</TableCell>
										<TableCell>
											<Badge className={`rounded-lg ${getCategoryColor(item.category)}`}>
												{getCategoryLabel(item.category)}
											</Badge>
										</TableCell>
										<TableCell>
											<span className="line-clamp-1">
												{item.description || item.contractName || "-"}
											</span>
										</TableCell>
										<TableCell>
											{item.sourceAccount ? (
												<div className="flex items-center gap-2">
													<Building className="h-4 w-4 text-slate-400" />
													<span className="text-sm">{item.sourceAccount.name}</span>
												</div>
											) : (
												<span className="text-slate-400">-</span>
											)}
										</TableCell>
										{!projectId && (
											<TableCell>
												{item.project ? (
													<span className="text-sm">{item.project.name}</span>
												) : (
													<span className="text-slate-400">-</span>
												)}
											</TableCell>
										)}
										<TableCell className="text-end">
											<span className="font-semibold text-red-600 dark:text-red-400">
												-<Currency amount={item.amount} />
											</span>
										</TableCell>
										<TableCell>
											{getPaymentStatusBadge(item)}
										</TableCell>
										<TableCell onClick={(e: any) => e.stopPropagation()}>
											{item._type === "expense" ? (
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
																	`${effectiveBasePath}/${item.id}`,
																)
															}
														>
															<Eye className="h-4 w-4 me-2" />
															{t("common.view")}
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() =>
																router.push(
																	`${effectiveBasePath}/${item.id}`,
																)
															}
														>
															<Pencil className="h-4 w-4 me-2" />
															{t("common.edit")}
														</DropdownMenuItem>
														{(item as any).status === "PENDING" && (
															<>
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	onClick={() => setPayExpense({
																		id: item.id,
																		expenseNo: item.refNo,
																		amount: item.amount,
																		paidAmount: (item as any).paidAmount ?? 0,
																		description: item.description,
																	})}
																	className="text-sky-600"
																>
																	<CreditCard className="h-4 w-4 me-2" />
																	{t("finance.expenses.pay")}
																</DropdownMenuItem>
															</>
														)}
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() => setDeleteExpenseId(item.id)}
															className="text-red-600"
														>
															<Trash2 className="h-4 w-4 me-2" />
															{t("common.delete")}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											) : null}
										</TableCell>
									</TableRow>
								))}
								{isVirtualized && paddingBottom > 0 && (
									<tr style={{ height: paddingBottom }} />
								)}
							</TableBody>
						</table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Pay Expense Dialog */}
			<PayExpenseDialog
				open={!!payExpense}
				onOpenChange={(open) => !open && setPayExpense(null)}
				expense={payExpense}
				organizationId={organizationId}
			/>

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

			{/* Add Expense Dialog */}
			<AddExpenseDialog
				open={showAddDialog}
				onOpenChange={setShowAddDialog}
				organizationId={organizationId}
				organizationSlug={organizationSlug}
			/>
		</div>
	);
}
