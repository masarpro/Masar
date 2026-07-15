"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrencySuffixed } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
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
import { Plus, Search, XCircle, Receipt, Banknote, CalendarRange, Send, Download } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@saas/shared/components/Pagination";
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
import { MobileDocList, MobileDocRow } from "@saas/shared/components/mobile/MobileDocRow";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { BulkActionsBar } from "../../../../ui/components/bulk-actions-bar";
import { exportTableToCsv } from "../../../../../lib/export-table";

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
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	const PAGE_SIZE = 20;

	const { data, isLoading } = useQuery({
		...orpc.company.expenses.list.queryOptions({
			input: {
				organizationId,
				query: search || undefined,
				category: categoryFilter !== "all" ? (categoryFilter as typeof EXPENSE_CATEGORIES[number]) : undefined,
				isActive: activeFilter !== "all" ? activeFilter === "true" : undefined,
				limit: PAGE_SIZE,
				offset: (currentPage - 1) * PAGE_SIZE,
			},
		}),
		staleTime: STALE_TIMES.EXPENSES,
	});

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

	const expenses = data?.expenses ?? [];
	const toggleRow = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	const toggleAllPage = () => {
		if (expenses.length > 0 && selectedIds.size === expenses.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(expenses.map((e: any) => e.id)));
		}
	};
	const clearSelection = () => setSelectedIds(new Set());
	const selectedExpenses = expenses.filter((e: any) => selectedIds.has(e.id));

	const formatCurrency = (amount: number | string) =>
		formatCurrencySuffixed(Number(amount), t("common.sar"), 0);

	const getStatusBadge = (active: boolean) => {
		if (active) {
			return (
				<Badge className="bg-chart-4/15 text-chart-4 border-0 text-[10px] px-2 py-0.5">
					{t("company.expenses.statusActive")}
				</Badge>
			);
		}
		return (
			<Badge className="bg-muted text-muted-foreground border-0 text-[10px] px-2 py-0.5">
				{t("company.expenses.statusInactive")}
			</Badge>
		);
	};

	const getRecurrenceBadge = (recurrence: string) => {
		const styles: Record<string, string> = {
			MONTHLY: "bg-chart-4/15 text-chart-4",
			QUARTERLY: "bg-chart-4/15 text-chart-4",
			SEMI_ANNUAL: "bg-chart-1/15 text-chart-1",
			ANNUAL: "bg-destructive/15 text-destructive",
			ONE_TIME: "bg-muted text-muted-foreground",
		};
		return (
			<Badge className={`border-0 text-[10px] px-2 py-0.5 ${styles[recurrence] ?? styles.ONE_TIME}`}>
				{t(`company.expenses.recurrences.${recurrence}`)}
			</Badge>
		);
	};

	// قائمة إجراءات الصف — مشتركة بين الجدول (ديسكتوب) وبطاقات الجوال
	const renderRowMenu = (expense: any) =>
		expense.isActive && (
			<Button
				variant="ghost"
				size="icon"
				className="rounded-xl hover:bg-destructive/10"
				aria-label={t("company.expenses.deactivate")}
				onClick={(e: any) => {
					e.stopPropagation();
					if (confirm(t("company.expenses.confirmDeactivate"))) {
						deactivateMutation.mutate(expense.id);
					}
				}}
			>
				<XCircle className="h-4 w-4 text-destructive" />
			</Button>
		);

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
								label: t("company.expenses.totalMonthly"),
								value: formatCurrency(summary.totalMonthlyAmount),
								icon: Banknote,
								iconClassName: "text-chart-4",
								iconBgClassName: "bg-chart-4/15",
								valueClassName: "text-chart-4",
							},
							{
								label: t("company.expenses.totalAnnual"),
								value: formatCurrency(summary.totalAnnualAmount),
								icon: CalendarRange,
								iconClassName: "text-chart-4",
								iconBgClassName: "bg-chart-4/15",
								valueClassName: "text-chart-4",
							},
							{
								label: t("company.expenses.activeCount"),
								value: summary.totalActiveExpenses,
								icon: Receipt,
								iconClassName: "text-chart-4",
								iconBgClassName: "bg-chart-4/15",
								valueClassName: "text-chart-4",
							},
						]}
					/>

					{/* الديسكتوب كما هو */}
					<div className="hidden sm:grid sm:grid-cols-2 gap-4 lg:grid-cols-3">
					<div className="bg-card border-2 rounded-2xl p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
								<Banknote className="h-5 w-5 text-chart-4" />
							</div>
						</div>
						<p className="text-xs font-medium text-muted-foreground mb-1">
							{t("company.expenses.totalMonthly")}
						</p>
						<p className="text-xl font-bold text-chart-4">
							{formatCurrency(summary.totalMonthlyAmount)}
						</p>
					</div>

					<div className="bg-card border-2 rounded-2xl p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
								<CalendarRange className="h-5 w-5 text-chart-4" />
							</div>
						</div>
						<p className="text-xs font-medium text-muted-foreground mb-1">
							{t("company.expenses.totalAnnual")}
						</p>
						<p className="text-xl font-bold text-chart-4">
							{formatCurrency(summary.totalAnnualAmount)}
						</p>
					</div>

					<div className="bg-card border-2 rounded-2xl p-4">
						<div className="flex items-center justify-between mb-3">
							<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
								<Receipt className="h-5 w-5 text-chart-4" />
							</div>
						</div>
						<p className="text-xs font-medium text-muted-foreground mb-1">
							{t("company.expenses.activeCount")}
						</p>
						<p className="text-2xl font-bold text-chart-4">
							{summary.totalActiveExpenses}
						</p>
					</div>
					</div>
				</>
			)}

			{/* الجوال: بحث + ورقة فلاتر + أزرار مضغوطة في صف واحد */}
			<div className="flex items-center gap-2 sm:hidden">
				<div className="relative min-w-0 flex-1">
					<Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("company.expenses.searchPlaceholder")}
						value={search}
						onChange={(e: any) => { setSearch(e.target.value); setCurrentPage(1); }}
						className="rounded-lg border border-input bg-card pe-10"
					/>
				</div>
				<MobileFilterSheet activeCount={(categoryFilter !== "all" ? 1 : 0) + (activeFilter !== "all" ? 1 : 0)}>
					<Select value={categoryFilter} onValueChange={(v: any) => { setCategoryFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-full rounded-xl">
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
					<Select value={activeFilter} onValueChange={(v: any) => { setActiveFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-full rounded-xl">
							<SelectValue placeholder={t("company.expenses.filterStatus")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							<SelectItem value="true">{t("company.expenses.statusActive")}</SelectItem>
							<SelectItem value="false">{t("company.expenses.statusInactive")}</SelectItem>
						</SelectContent>
					</Select>
				</MobileFilterSheet>
				<Button
					variant="outline"
					onClick={() => router.push(`/app/${organizationSlug}/company/expense-runs`)}
					className="h-10 shrink-0 rounded-xl px-2.5 text-xs border-chart-4/30 text-chart-4 hover:bg-chart-4/15"
				>
					<Send className="me-1 h-4 w-4" />
					{t("company.expenses.postToFinance")}
				</Button>
				<Button
					size="icon"
					aria-label={t("company.expenses.addExpense")}
					onClick={() => setShowAddDialog(true)}
					className="h-10 w-10 shrink-0 rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Plus className="h-5 w-5" />
				</Button>
			</div>

			{/* Search and Filter Bar (الديسكتوب كما هو) */}
			<div className="hidden gap-4 sm:flex sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<div className="relative max-w-md flex-1">
						<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder={t("company.expenses.searchPlaceholder")}
							value={search}
							onChange={(e: any) => { setSearch(e.target.value); setCurrentPage(1); }}
							className="rounded-lg border border-input bg-card pe-10"
						/>
					</div>
					<Select value={categoryFilter} onValueChange={(v: any) => { setCategoryFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-[160px] rounded-lg border border-input bg-card">
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
					<Select value={activeFilter} onValueChange={(v: any) => { setActiveFilter(v); setCurrentPage(1); }}>
						<SelectTrigger className="w-[140px] rounded-lg border border-input bg-card">
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
						className="rounded-xl border-chart-4/30 text-chart-4 hover:bg-chart-4/15"
					>
						<Send className="ms-2 h-4 w-4" />
						{t("company.expenses.postToFinance")}
					</Button>
					<Button
						onClick={() => setShowAddDialog(true)}
						className="rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
					>
						<Plus className="ms-2 h-4 w-4" />
						{t("company.expenses.addExpense")}
					</Button>
				</div>
			</div>

			{/* الجوال: صفوف مستندات بسطرين بدل الجدول متعدد الأعمدة */}
			{expenses.length > 0 && (
				<MobileDocList className="sm:hidden">
					{expenses.map((expense: any) => (
						<MobileDocRow
							key={expense.id}
							href={`/app/${organizationSlug}/company/expenses/${expense.id}`}
							title={expense.name}
							subtitle={t(`company.expenses.categories.${expense.category}`)}
							amount={formatCurrency(Number(expense.amount))}
							badge={getStatusBadge(expense.isActive)}
							actions={renderRowMenu(expense)}
						/>
					))}
				</MobileDocList>
			)}

			{/* Table - Glass Morphism */}
			<div className="hidden sm:block bg-card border-2 rounded-2xl overflow-hidden overflow-x-auto">
				<Table className="w-full">
					<TableHeader>
						<TableRow className="border-b-2 hover:bg-transparent">
							<TableHead className="w-10">
								<Checkbox
									checked={expenses.length > 0 && selectedIds.size === expenses.length}
									onCheckedChange={toggleAllPage}
									aria-label={t("common.selectAll")}
								/>
							</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.expenses.name")}</TableHead>
							<TableHead className="text-end text-muted-foreground hidden sm:table-cell">{t("company.expenses.category")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.expenses.amount")}</TableHead>
							<TableHead className="text-end text-muted-foreground hidden md:table-cell">{t("company.expenses.recurrenceLabel")}</TableHead>
							<TableHead className="text-end text-muted-foreground hidden lg:table-cell">{t("company.expenses.vendor")}</TableHead>
							<TableHead className="text-end text-muted-foreground hidden sm:table-cell">{t("company.expenses.status")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.common.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i} className="border-b-2">
									{[...Array(8)].map((_, j) => (
										<TableCell key={j}>
											<div className="h-4 animate-pulse rounded bg-muted" />
										</TableCell>
									))}
								</TableRow>
							))
						) : data?.expenses?.length ? (
							data.expenses.map((expense: any, index: any) => (
								<TableRow
									key={expense.id}
									className="cursor-pointer border-b-2 hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
									onClick={() => router.push(`/app/${organizationSlug}/company/expenses/${expense.id}`)}
								>
									<TableCell onClick={(e: any) => e.stopPropagation()}>
										<Checkbox
											checked={selectedIds.has(expense.id)}
											onCheckedChange={() => toggleRow(expense.id)}
											aria-label={`${t("common.select")} ${expense.name}`}
										/>
									</TableCell>
									<TableCell className="text-end">
										<p className="font-medium text-card-foreground truncate">{expense.name}</p>
									</TableCell>
									<TableCell className="text-end text-muted-foreground hidden sm:table-cell">
										{t(`company.expenses.categories.${expense.category}`)}
									</TableCell>
									<TableCell className="text-end font-semibold text-card-foreground">
										{formatCurrency(Number(expense.amount))}
									</TableCell>
									<TableCell className="text-end hidden md:table-cell">{getRecurrenceBadge(expense.recurrence)}</TableCell>
									<TableCell className="text-end hidden lg:table-cell">
										{expense.vendor ? (
											<span className="text-muted-foreground truncate block">{expense.vendor}</span>
										) : (
											<span className="text-xs text-muted-foreground">-</span>
										)}
									</TableCell>
									<TableCell className="text-end hidden sm:table-cell">{getStatusBadge(expense.isActive)}</TableCell>
									<TableCell className="text-end">
										{renderRowMenu(expense)}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={8}>
									<EmptyState
										icon={<Receipt className="h-10 w-10" />}
										description={t("company.expenses.noExpenses")}
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
				totalCount={expenses.length}
				selectedIds={Array.from(selectedIds)}
				onClearSelection={clearSelection}
				actions={[
					{
						label: t("common.export"),
						icon: <Download className="h-4 w-4 me-1.5" />,
						onClick: () => {
							exportTableToCsv(
								selectedExpenses as unknown as Record<string, unknown>[],
								[
									{ key: "name", label: t("company.expenses.name") },
									{ key: "category", label: t("company.expenses.category") },
									{ key: "amount", label: t("company.expenses.amount") },
									{ key: "recurrence", label: t("company.expenses.recurrenceLabel") },
									{ key: "vendor", label: t("company.expenses.vendor") },
								],
								"expenses",
							);
							clearSelection();
						},
					},
					{
						label: t("company.expenses.bulkDeactivate"),
						icon: <XCircle className="h-4 w-4 me-1.5" />,
						variant: "destructive",
						onClick: () => {
							const eligible = selectedExpenses.filter((e: any) => e.isActive);
							if (eligible.length === 0) {
								toast.error(t("company.expenses.noActiveSelected"));
								return;
							}
							if (confirm(t("company.expenses.bulkDeactivateConfirm", { count: eligible.length }))) {
								Promise.allSettled(
									eligible.map((e: any) =>
										orpcClient.company.expenses.deactivate({ organizationId, id: e.id }),
									),
								).then(() => {
									queryClient.invalidateQueries({ queryKey: orpc.company.expenses.list.queryOptions({ input: { organizationId } }).queryKey });
									queryClient.invalidateQueries({ queryKey: orpc.company.expenses.getSummary.queryOptions({ input: { organizationId } }).queryKey });
									clearSelection();
									toast.success(t("company.expenses.bulkDeactivateSuccess"));
								});
							}
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
				<AddExpenseDialog
					open={showAddDialog}
					onOpenChange={setShowAddDialog}
					organizationId={organizationId}
				/>
			)}
		</div>
	);
}
