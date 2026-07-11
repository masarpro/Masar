"use client";

import {
	EXPENSE_CATEGORIES as ALL_CATEGORIES,
	findCategoryById,
} from "@repo/utils";
import { usePartnerAccess } from "@saas/organizations/hooks/use-partner-access";
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { useVirtualRows } from "@saas/shared/hooks/use-virtual-rows";
import { formatDate } from "@shared/lib/formatters";
import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { EmptyState } from "@ui/components/empty-state";
import { GlassStatCard } from "@ui/components/glass-stat-card";
import { Input } from "@ui/components/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@ui/components/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	AlertCircle,
	Building,
	Calendar,
	Clock,
	CreditCard,
	Download,
	Eye,
	FolderOpen,
	Hammer,
	MoreVertical,
	Package,
	Pencil,
	Plus,
	Receipt,
	RotateCcw,
	Search,
	SlidersHorizontal,
	Trash2,
	TrendingDown,
	UserIcon,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Currency } from "../shared/Currency";
import {
	ActiveFilterChips,
	type DatePreset,
	downloadCsv,
	type FilterChip,
	PeriodFilter,
	resolveDateRange,
	SortableColumnButton,
	useDebouncedValue,
} from "../shared/list-controls";
import { AddExpenseDialog } from "./AddExpenseDialog";
import { PayExpenseDialog } from "./PayExpenseDialog";

interface ExpensesListProps {
	organizationId: string;
	organizationSlug: string;
	projectId?: string;
	basePath?: string;
	hideAddButton?: boolean;
}

type SortKey = "date" | "amount";

const SOURCE_TYPES = [
	"MANUAL",
	"FACILITY_PAYROLL",
	"FACILITY_RECURRING",
	"FACILITY_ASSET",
	"PROJECT",
] as const;

const STATUS_OPTIONS = ["PENDING", "COMPLETED", "CANCELLED"] as const;

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
	const { canAccessPartners } = usePartnerAccess();

	// State — الفلاتر
	const [searchInput, setSearchInput] = useState("");
	const searchQuery = useDebouncedValue(searchInput, 300);
	const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
		undefined,
	);
	const [sourceTypeFilter, setSourceTypeFilter] = useState<
		string | undefined
	>(undefined);
	const [projectFilter, setProjectFilter] = useState<string | undefined>(
		projectId,
	);
	const [statusFilter, setStatusFilter] = useState<string | undefined>(
		undefined,
	);
	const [accountFilter, setAccountFilter] = useState<string | undefined>(
		undefined,
	);
	const [datePreset, setDatePreset] = useState<DatePreset>("all");
	const [customFrom, setCustomFrom] = useState("");
	const [customTo, setCustomTo] = useState("");
	// State — الفرز
	const [sortKey, setSortKey] = useState<SortKey | null>(null);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
	// State — النوافذ
	const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
	const [payExpense, setPayExpense] = useState<{
		id: string;
		expenseNo: string;
		amount: number | string;
		paidAmount: number | string;
		description?: string | null;
	} | null>(null);

	const effectiveBasePath =
		customBasePath || `/app/${organizationSlug}/finance/expenses`;

	const dateRange = useMemo(
		() => resolveDateRange(datePreset, customFrom, customTo),
		[datePreset, customFrom, customTo],
	);

	// Fetch unified expenses + subcontract payments
	const { data, isLoading } = useQuery({
		...orpc.finance.expenses.listUnified.queryOptions({
			input: {
				organizationId,
				query: searchQuery || undefined,
				categoryId: categoryFilter,
				projectId: projectFilter,
				status: statusFilter as any,
				sourceAccountId: accountFilter,
				dateFrom: dateRange.from,
				dateTo: dateRange.to,
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

	// Fetch accounts for filter
	const { data: banksData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);

	const rawItems = data?.items ?? [];
	const grandTotal = data?.grandTotal ?? 0;
	const expensesTotal = data?.expensesTotal ?? 0;
	const subcontractTotal = data?.subcontractTotal ?? 0;
	const ownerDrawingsTotal = (data as any)?.ownerDrawingsTotal ?? 0;
	const projects = projectsData?.projects ?? [];
	const accounts = banksData?.accounts ?? [];

	// فلترة المصدر تتم على الواجهة — الـ API لا يدعم sourceType
	const items = useMemo(() => {
		let list = rawItems;
		if (sourceTypeFilter === "OWNER_DRAWING") {
			list = list.filter((i: any) => i._type === "owner_drawing");
		} else if (sourceTypeFilter) {
			list = list.filter(
				(i: any) =>
					i._type === "expense" &&
					(i.sourceType ?? "MANUAL") === sourceTypeFilter,
			);
		}
		if (sortKey) {
			list = [...list].sort((a: any, b: any) => {
				const av =
					sortKey === "date"
						? new Date(a.date).getTime()
						: Number(a.amount);
				const bv =
					sortKey === "date"
						? new Date(b.date).getTime()
						: Number(b.amount);
				return sortDir === "asc" ? av - bv : bv - av;
			});
		}
		return list;
	}, [rawItems, sourceTypeFilter, sortKey, sortDir]);

	const filteredTotal = useMemo(
		() =>
			items.reduce(
				(sum: number, item: any) => sum + Number(item.amount ?? 0),
				0,
			),
		[items],
	);

	const expenseCount = rawItems.filter(
		(i: any) => i._type === "expense",
	).length;
	const subCount = rawItems.filter(
		(i: any) => i._type === "subcontract_payment",
	).length;
	const drawingCount = rawItems.filter(
		(i: any) => i._type === "owner_drawing",
	).length;

	const {
		containerRef,
		virtualItems,
		paddingTop,
		paddingBottom,
		isVirtualized,
	} = useVirtualRows({ count: items.length, rowHeight: 56, threshold: 50 });

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
			queryClient.invalidateQueries({
				queryKey: orpc.finance.expenses.key(),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.finance.banks.key(),
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.expenses.deleteError"));
		},
	});

	const getCategoryLabel = (item: any) => {
		const category = item?.category ?? "";
		// 1) DB-backed hierarchical category (resolved server-side)
		const dbNameAr = item?.categoryNameAr as string | null | undefined;
		const dbNameEn = item?.categoryNameEn as string | null | undefined;
		if (dbNameAr || dbNameEn) {
			return locale === "ar"
				? (dbNameAr ?? dbNameEn ?? "")
				: (dbNameEn ?? dbNameAr ?? "");
		}
		// 2) Static default hierarchical category by system ID
		const cat = findCategoryById(category);
		if (cat) return locale === "ar" ? cat.nameAr : cat.nameEn;
		// 3) Fallback to old translation key for legacy records
		return t(
			`finance.expenses.categories.${String(category).toLowerCase()}`,
		);
	};

	const getCategoryColor = (category: string) => {
		const colors: Record<string, string> = {
			MATERIALS:
				"bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
			LABOR: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
			SALARIES:
				"bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400",
			RENT: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
			UTILITIES:
				"bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400",
			FUEL: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400",
			MAINTENANCE:
				"bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400",
			SUBCONTRACTOR:
				"bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400",
		};
		return (
			colors[category] ||
			"bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
		);
	};

	const getSourceTypeIcon = (sourceType: string) => {
		switch (sourceType) {
			case "FACILITY_PAYROLL":
				return <Users className="h-3 w-3 me-1" />;
			case "FACILITY_RECURRING":
				return <RotateCcw className="h-3 w-3 me-1" />;
			case "FACILITY_ASSET":
				return <Package className="h-3 w-3 me-1" />;
			case "PROJECT":
				return <FolderOpen className="h-3 w-3 me-1" />;
			default:
				return <CreditCard className="h-3 w-3 me-1" />;
		}
	};

	const getSourceTypeColor = (sourceType: string) => {
		switch (sourceType) {
			case "FACILITY_PAYROLL":
				return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400";
			case "FACILITY_RECURRING":
				return "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400";
			case "FACILITY_ASSET":
				return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400";
			case "PROJECT":
				return "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400";
			default:
				return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
		}
	};

	const getPaymentStatusKey = (item: any): string | null => {
		if (item._type !== "expense") return null;
		const status = item.status;
		const paidAmount = Number(item.paidAmount ?? 0);
		const totalAmount = Number(item.amount ?? 0);
		const overdue = item.dueDate && new Date(item.dueDate) < new Date();
		if (status === "CANCELLED") return "cancelled";
		if (status === "COMPLETED" && paidAmount >= totalAmount) return "paid";
		if (status === "PENDING") {
			if (overdue) return "overdue";
			return paidAmount > 0 ? "partial" : "pending";
		}
		return "paid";
	};

	const getPaymentStatusBadge = (item: any) => {
		const key = getPaymentStatusKey(item);
		if (!key) return null;
		const classes: Record<string, string> = {
			cancelled:
				"bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
			paid: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400",
			overdue:
				"bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
			partial:
				"bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
			pending:
				"bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
		};
		return (
			<Badge className={`rounded-lg border-0 ${classes[key]}`}>
				{key === "overdue" && <AlertCircle className="h-3 w-3 me-1" />}
				{key === "pending" && <Clock className="h-3 w-3 me-1" />}
				{t(`finance.expenses.paymentStatus.${key}`)}
			</Badge>
		);
	};

	const getTypeLabel = (item: any) =>
		item._type === "subcontract_payment"
			? t("finance.expenses.subcontractBadge")
			: item._type === "owner_drawing"
				? t("finance.expenses.ownerDrawingBadge")
				: t("finance.expenses.expenseBadge");

	const toggleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortDir((dir) => (dir === "desc" ? "asc" : "desc"));
		} else {
			setSortKey(key);
			setSortDir("desc");
		}
	};

	const clearAllFilters = () => {
		setCategoryFilter(undefined);
		setSourceTypeFilter(undefined);
		if (!projectId) setProjectFilter(undefined);
		setStatusFilter(undefined);
		setAccountFilter(undefined);
		setDatePreset("all");
		setCustomFrom("");
		setCustomTo("");
	};

	// رقاقات الفلاتر النشطة
	const filterChips = useMemo(() => {
		const chips: FilterChip[] = [];
		if (datePreset !== "all") {
			chips.push({
				key: "period",
				label:
					datePreset === "custom"
						? `${customFrom || "…"} – ${customTo || "…"}`
						: t(`finance.listControls.${datePreset}`),
				onRemove: () => {
					setDatePreset("all");
					setCustomFrom("");
					setCustomTo("");
				},
			});
		}
		if (categoryFilter) {
			const cat = findCategoryById(categoryFilter);
			chips.push({
				key: "category",
				label: cat
					? locale === "ar"
						? cat.nameAr
						: cat.nameEn
					: categoryFilter,
				onRemove: () => setCategoryFilter(undefined),
			});
		}
		if (sourceTypeFilter) {
			chips.push({
				key: "source",
				label:
					sourceTypeFilter === "OWNER_DRAWING"
						? t("finance.expenses.filterOwnerDrawingsOnly")
						: t(
								`finance.expenses.sourceTypes.${sourceTypeFilter.toLowerCase()}`,
							),
				onRemove: () => setSourceTypeFilter(undefined),
			});
		}
		if (!projectId && projectFilter) {
			const project = projects.find((p: any) => p.id === projectFilter);
			chips.push({
				key: "project",
				label: project?.name ?? t("finance.expenses.project"),
				onRemove: () => setProjectFilter(undefined),
			});
		}
		if (statusFilter) {
			chips.push({
				key: "status",
				label: t(
					`finance.transactions.status.${statusFilter.toLowerCase()}`,
				),
				onRemove: () => setStatusFilter(undefined),
			});
		}
		if (accountFilter) {
			const account = accounts.find((a: any) => a.id === accountFilter);
			chips.push({
				key: "account",
				label: account?.name ?? t("finance.expenses.account"),
				onRemove: () => setAccountFilter(undefined),
			});
		}
		return chips;
	}, [
		datePreset,
		customFrom,
		customTo,
		categoryFilter,
		sourceTypeFilter,
		projectFilter,
		statusFilter,
		accountFilter,
		projects,
		accounts,
		projectId,
		locale,
		t,
	]);

	const hasActiveFilters = filterChips.length > 0 || !!searchInput;

	const handleExport = () => {
		downloadCsv(
			`expenses-${new Date().toISOString().slice(0, 10)}.csv`,
			[
				t("finance.expenses.expenseNo"),
				t("finance.expenses.date"),
				t("finance.expenses.type"),
				t("finance.expenses.category"),
				t("finance.expenses.description"),
				t("finance.expenses.account"),
				t("finance.expenses.project"),
				t("finance.expenses.amount"),
				t("finance.expenses.paymentStatusLabel"),
			],
			items.map((item: any) => {
				const statusKey = getPaymentStatusKey(item);
				return [
					item.refNo,
					formatDate(new Date(item.date)),
					getTypeLabel(item),
					getCategoryLabel(item),
					item.description || item.contractName || "",
					item.sourceAccount?.name ?? "",
					item.project?.name ?? "",
					Number(item.amount ?? 0),
					statusKey
						? t(`finance.expenses.paymentStatus.${statusKey}`)
						: "",
				];
			}),
		);
	};

	// عناصر الفلترة المشتركة (تُستخدم في التولبار وورقة الجوال)
	const categorySelect = (widthClass: string) => (
		<Select
			value={categoryFilter || "all"}
			onValueChange={(value: any) =>
				setCategoryFilter(value === "all" ? undefined : value)
			}
		>
			<SelectTrigger className={`${widthClass} rounded-xl`}>
				<SelectValue
					placeholder={t("finance.expenses.filterByCategory")}
				/>
			</SelectTrigger>
			<SelectContent className="rounded-xl">
				<SelectItem value="all">
					{t("finance.expenses.allCategories")}
				</SelectItem>
				{ALL_CATEGORIES.map((cat) => (
					<SelectItem key={cat.id} value={cat.id}>
						{locale === "ar" ? cat.nameAr : cat.nameEn}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);

	const sourceSelect = (widthClass: string) => (
		<Select
			value={sourceTypeFilter || "all"}
			onValueChange={(value: any) =>
				setSourceTypeFilter(value === "all" ? undefined : value)
			}
		>
			<SelectTrigger className={`${widthClass} rounded-xl`}>
				<SelectValue
					placeholder={t("finance.expenses.filterBySource")}
				/>
			</SelectTrigger>
			<SelectContent className="rounded-xl">
				<SelectItem value="all">{t("common.all")}</SelectItem>
				{SOURCE_TYPES.map((type) => (
					<SelectItem key={type} value={type}>
						{t(
							`finance.expenses.sourceTypes.${type.toLowerCase()}`,
						)}
					</SelectItem>
				))}
				{canAccessPartners && (
					<SelectItem value="OWNER_DRAWING">
						{t("finance.expenses.filterOwnerDrawingsOnly")}
					</SelectItem>
				)}
			</SelectContent>
		</Select>
	);

	const projectSelect = (widthClass: string) => (
		<Select
			value={projectFilter || "all"}
			onValueChange={(value: any) =>
				setProjectFilter(value === "all" ? undefined : value)
			}
		>
			<SelectTrigger className={`${widthClass} rounded-xl`}>
				<SelectValue
					placeholder={t("finance.expenses.filterByProject")}
				/>
			</SelectTrigger>
			<SelectContent className="rounded-xl">
				<SelectItem value="all">
					{t("finance.expenses.allProjects")}
				</SelectItem>
				{projects.map((project: any) => (
					<SelectItem key={project.id} value={project.id}>
						{project.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);

	const statusSelect = (widthClass: string) => (
		<Select
			value={statusFilter || "all"}
			onValueChange={(value: any) =>
				setStatusFilter(value === "all" ? undefined : value)
			}
		>
			<SelectTrigger className={`${widthClass} rounded-xl`}>
				<SelectValue
					placeholder={t("finance.listControls.filterByStatus")}
				/>
			</SelectTrigger>
			<SelectContent className="rounded-xl">
				<SelectItem value="all">
					{t("finance.listControls.allStatuses")}
				</SelectItem>
				{STATUS_OPTIONS.map((status) => (
					<SelectItem key={status} value={status}>
						{t(
							`finance.transactions.status.${status.toLowerCase()}`,
						)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);

	const accountSelect = (widthClass: string) => (
		<Select
			value={accountFilter || "all"}
			onValueChange={(value: any) =>
				setAccountFilter(value === "all" ? undefined : value)
			}
		>
			<SelectTrigger className={`${widthClass} rounded-xl`}>
				<SelectValue
					placeholder={t("finance.listControls.filterByAccount")}
				/>
			</SelectTrigger>
			<SelectContent className="rounded-xl">
				<SelectItem value="all">
					{t("finance.listControls.allAccounts")}
				</SelectItem>
				{accounts.map((account: any) => (
					<SelectItem key={account.id} value={account.id}>
						{account.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);

	const moreFiltersCount =
		(sourceTypeFilter ? 1 : 0) +
		(statusFilter ? 1 : 0) +
		(accountFilter ? 1 : 0);

	const emptyState = (
		<EmptyState
			icon={<TrendingDown className="h-8 w-8" />}
			description={
				hasActiveFilters
					? t("finance.listControls.noFilterResults")
					: t("finance.expenses.noExpenses")
			}
		>
			{hasActiveFilters ? (
				<Button
					variant="outline"
					className="rounded-xl"
					onClick={() => {
						setSearchInput("");
						clearAllFilters();
					}}
				>
					{t("finance.listControls.clearFilters")}
				</Button>
			) : (
				!hideAddButton && (
					<Button
						className="rounded-xl"
						onClick={() => setShowAddDialog(true)}
					>
						<Plus className="me-2 h-4 w-4" />
						{t("finance.expenses.new")}
					</Button>
				)
			)}
		</EmptyState>
	);

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* الجوال: شريط إحصائيات مضغوط */}
			<CompactStatGrid
				className="sm:hidden"
				items={[
					{
						label: t("finance.expenses.totalExpenses"),
						value: <Currency amount={grandTotal} />,
						icon: TrendingDown,
						iconClassName: "text-red-600 dark:text-red-400",
						iconBgClassName: "bg-red-100 dark:bg-red-900/50",
						hint: t("finance.listControls.resultsCount", {
							count: rawItems.length,
						}),
					},
					{
						label: t("finance.expenses.directExpenses"),
						value: <Currency amount={expensesTotal} />,
						icon: Receipt,
						iconClassName: "text-orange-600 dark:text-orange-400",
						iconBgClassName: "bg-orange-100 dark:bg-orange-900/50",
						hint: t("finance.listControls.resultsCount", {
							count: expenseCount,
						}),
					},
					{
						label: t("finance.expenses.subcontractPayments"),
						value: <Currency amount={subcontractTotal} />,
						icon: Hammer,
						iconClassName: "text-sky-600 dark:text-sky-400",
						iconBgClassName: "bg-sky-100 dark:bg-sky-900/50",
						hint: t("finance.listControls.resultsCount", {
							count: subCount,
						}),
					},
					...(canAccessPartners
						? [
								{
									label: t(
										"finance.expenses.ownerDrawingsTotal",
									),
									value: (
										<Currency amount={ownerDrawingsTotal} />
									),
									icon: UserIcon,
									iconClassName:
										"text-violet-600 dark:text-violet-400",
									iconBgClassName:
										"bg-violet-100 dark:bg-violet-900/50",
									hint: t(
										"finance.listControls.resultsCount",
										{ count: drawingCount },
									),
								},
							]
						: []),
				]}
			/>

			{/* الديسكتوب: بطاقات KPI زجاجية */}
			<div
				className={`hidden gap-3 sm:grid lg:gap-4 ${
					canAccessPartners
						? "sm:grid-cols-2 lg:grid-cols-4"
						: "sm:grid-cols-3"
				}`}
			>
				<GlassStatCard
					colorScheme="red"
					icon={
						<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
					}
					title={t("finance.expenses.totalExpenses")}
					value={<Currency amount={grandTotal} />}
					subtitle={t("finance.listControls.resultsCount", {
						count: rawItems.length,
					})}
				/>
				<GlassStatCard
					colorScheme="orange"
					icon={
						<Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />
					}
					title={t("finance.expenses.directExpenses")}
					value={<Currency amount={expensesTotal} />}
					subtitle={t("finance.listControls.resultsCount", {
						count: expenseCount,
					})}
				/>
				<GlassStatCard
					colorScheme="sky"
					icon={
						<Hammer className="h-5 w-5 text-sky-600 dark:text-sky-400" />
					}
					title={t("finance.expenses.subcontractPayments")}
					value={<Currency amount={subcontractTotal} />}
					subtitle={t("finance.listControls.resultsCount", {
						count: subCount,
					})}
				/>
				{canAccessPartners && (
					<GlassStatCard
						colorScheme="violet"
						icon={
							<UserIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
						}
						title={t("finance.expenses.ownerDrawingsTotal")}
						value={<Currency amount={ownerDrawingsTotal} />}
						subtitle={t("finance.listControls.resultsCount", {
							count: drawingCount,
						})}
					/>
				)}
			</div>

			{/* الجوال: بحث + ورقة فلاتر + زر إضافة */}
			<div className="flex items-center gap-2 sm:hidden">
				<div className="relative min-w-0 flex-1">
					<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder={t("finance.expenses.searchPlaceholder")}
						value={searchInput}
						onChange={(e: any) => setSearchInput(e.target.value)}
						className="ps-10 rounded-xl"
					/>
				</div>
				<MobileFilterSheet activeCount={filterChips.length}>
					<PeriodFilter
						preset={datePreset}
						onPresetChange={setDatePreset}
						customFrom={customFrom}
						customTo={customTo}
						onCustomFromChange={setCustomFrom}
						onCustomToChange={setCustomTo}
						triggerClassName="w-full"
						stacked
					/>
					{categorySelect("w-full")}
					{sourceSelect("w-full")}
					{!projectId && projectSelect("w-full")}
					{statusSelect("w-full")}
					{accountSelect("w-full")}
				</MobileFilterSheet>
				{!hideAddButton && (
					<Button
						size="icon"
						aria-label={t("finance.expenses.new")}
						className="h-10 w-10 shrink-0 rounded-xl"
						onClick={() => setShowAddDialog(true)}
					>
						<Plus className="h-5 w-5" />
					</Button>
				)}
			</div>

			{/* الديسكتوب: تولبار الفلاتر */}
			<div className="hidden flex-wrap items-center gap-2 sm:flex">
				<div className="relative w-64">
					<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder={t("finance.expenses.searchPlaceholder")}
						value={searchInput}
						onChange={(e: any) => setSearchInput(e.target.value)}
						className="ps-10 rounded-xl"
					/>
				</div>
				<PeriodFilter
					preset={datePreset}
					onPresetChange={setDatePreset}
					customFrom={customFrom}
					customTo={customTo}
					onCustomFromChange={setCustomFrom}
					onCustomToChange={setCustomTo}
					triggerClassName="w-40"
				/>
				{categorySelect("w-44")}
				{!projectId && projectSelect("w-44")}
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="relative rounded-xl"
						>
							<SlidersHorizontal className="me-2 h-4 w-4" />
							{t("common.filters")}
							{moreFiltersCount > 0 && (
								<span className="ms-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
									{moreFiltersCount}
								</span>
							)}
						</Button>
					</PopoverTrigger>
					<PopoverContent
						align="end"
						className="w-72 space-y-3 rounded-xl"
					>
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("finance.expenses.filterBySource")}
							</p>
							{sourceSelect("w-full")}
						</div>
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("finance.listControls.filterByStatus")}
							</p>
							{statusSelect("w-full")}
						</div>
						<div className="space-y-1.5">
							<p className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("finance.listControls.filterByAccount")}
							</p>
							{accountSelect("w-full")}
						</div>
					</PopoverContent>
				</Popover>
				<div className="ms-auto flex items-center gap-2">
					<Button
						variant="outline"
						className="rounded-xl"
						onClick={handleExport}
						disabled={items.length === 0}
					>
						<Download className="me-2 h-4 w-4" />
						{t("finance.listControls.exportCsv")}
					</Button>
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
			</div>

			{/* رقاقات الفلاتر النشطة */}
			<ActiveFilterChips
				chips={filterChips}
				onClearAll={clearAllFilters}
			/>

			{/* الجوال: قائمة بطاقات */}
			<div className="space-y-2 sm:hidden">
				{isLoading ? (
					<ListTableSkeleton />
				) : items.length === 0 ? (
					<Card className="rounded-2xl">
						<CardContent className="p-0">{emptyState}</CardContent>
					</Card>
				) : (
					items.map((item: any) => (
						<Card
							key={`m-${item._type}-${item.id}`}
							className="rounded-xl transition-transform active:scale-[0.99]"
							onClick={() =>
								item._type === "expense" &&
								router.push(`${effectiveBasePath}/${item.id}`)
							}
						>
							<CardContent className="p-3">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-1.5">
											<span className="font-mono text-xs text-slate-500 dark:text-slate-400">
												{item.refNo}
											</span>
											{item._type ===
											"subcontract_payment" ? (
												<Badge className="rounded-lg border-0 bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400">
													<Hammer className="h-3 w-3 me-1" />
													{t(
														"finance.expenses.subcontractBadge",
													)}
												</Badge>
											) : item._type ===
												"owner_drawing" ? (
												<Badge className="rounded-lg border-0 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400">
													<UserIcon className="h-3 w-3 me-1" />
													{t(
														"finance.expenses.ownerDrawingBadge",
													)}
												</Badge>
											) : (
												<Badge
													className={`rounded-lg border-0 ${getCategoryColor(item.category)}`}
												>
													{getCategoryLabel(item)}
												</Badge>
											)}
										</div>
										<p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
											{item.description ||
												item.contractName ||
												getCategoryLabel(item)}
										</p>
										<p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
											<Calendar className="h-3 w-3" />
											{formatDate(new Date(item.date))}
											{item.sourceAccount?.name && (
												<>
													<span>·</span>
													<span className="truncate">
														{
															item.sourceAccount
																.name
														}
													</span>
												</>
											)}
										</p>
									</div>
									<div className="flex shrink-0 flex-col items-end gap-1">
										<span className="font-bold tabular-nums text-red-600 dark:text-red-400">
											-<Currency amount={item.amount} />
										</span>
										{getPaymentStatusBadge(item)}
										{item._type === "expense" && (
											<div
												onClick={(e: any) =>
													e.stopPropagation()
												}
											>
												<DropdownMenu>
													<DropdownMenuTrigger
														asChild
													>
														<Button
															variant="ghost"
															size="sm"
															className="h-7 w-7 p-0"
														>
															<MoreVertical className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align="end"
														className="rounded-xl"
													>
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
																setEditExpenseId(
																	item.id,
																)
															}
														>
															<Pencil className="h-4 w-4 me-2" />
															{t("common.edit")}
														</DropdownMenuItem>
														{item.status ===
															"PENDING" && (
															<DropdownMenuItem
																onClick={() =>
																	setPayExpense(
																		{
																			id: item.id,
																			expenseNo:
																				item.refNo,
																			amount: item.amount,
																			paidAmount:
																				item.paidAmount ??
																				0,
																			description:
																				item.description,
																		},
																	)
																}
																className="text-sky-600"
															>
																<CreditCard className="h-4 w-4 me-2" />
																{t(
																	"finance.expenses.pay",
																)}
															</DropdownMenuItem>
														)}
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={() =>
																setDeleteExpenseId(
																	item.id,
																)
															}
															className="text-red-600"
														>
															<Trash2 className="h-4 w-4 me-2" />
															{t("common.delete")}
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}
				{!isLoading && items.length > 0 && (
					<div className="flex items-center justify-between px-1 pt-1 text-sm">
						<span className="text-slate-500 dark:text-slate-400">
							{t("finance.listControls.resultsCount", {
								count: items.length,
							})}
						</span>
						<span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
							-<Currency amount={filteredTotal} />
						</span>
					</div>
				)}
			</div>

			{/* الديسكتوب: الجدول */}
			<Card className="hidden rounded-2xl sm:block">
				<CardContent className="p-0">
					{isLoading ? (
						<ListTableSkeleton />
					) : items.length === 0 ? (
						emptyState
					) : (
						<>
							<div
								ref={containerRef}
								className="w-full overflow-auto"
								style={
									isVirtualized
										? { maxHeight: 600 }
										: undefined
								}
							>
								<table className="w-full caption-bottom text-sm">
									<TableHeader
										className={
											isVirtualized
												? "sticky top-0 z-10 bg-background"
												: ""
										}
									>
										<TableRow>
											<TableHead>
												{t(
													"finance.expenses.expenseNo",
												)}
											</TableHead>
											<TableHead>
												<SortableColumnButton
													label={t(
														"finance.expenses.date",
													)}
													active={sortKey === "date"}
													direction={sortDir}
													onClick={() =>
														toggleSort("date")
													}
												/>
											</TableHead>
											<TableHead>
												{t("finance.expenses.type")}
											</TableHead>
											<TableHead>
												{t("finance.expenses.source")}
											</TableHead>
											<TableHead>
												{t("finance.expenses.category")}
											</TableHead>
											<TableHead>
												{t(
													"finance.expenses.description",
												)}
											</TableHead>
											<TableHead>
												{t("finance.expenses.account")}
											</TableHead>
											{!projectId && (
												<TableHead>
													{t(
														"finance.expenses.project",
													)}
												</TableHead>
											)}
											<TableHead className="text-end">
												<SortableColumnButton
													label={t(
														"finance.expenses.amount",
													)}
													active={
														sortKey === "amount"
													}
													direction={sortDir}
													onClick={() =>
														toggleSort("amount")
													}
													className="justify-end"
												/>
											</TableHead>
											<TableHead>
												{t(
													"finance.expenses.paymentStatusLabel",
												)}
											</TableHead>
											<TableHead className="w-[50px]" />
										</TableRow>
									</TableHeader>
									<TableBody>
										{isVirtualized && paddingTop > 0 && (
											<tr
												style={{ height: paddingTop }}
											/>
										)}
										{(isVirtualized
											? virtualItems.map(
													(vi: { index: number }) =>
														items[vi.index],
												)
											: items
										).map((item: any) => (
											<TableRow
												key={`${item._type}-${item.id}`}
												className={
													item._type === "expense"
														? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
														: "hover:bg-slate-50 dark:hover:bg-slate-800/50"
												}
												onClick={() =>
													item._type === "expense" &&
													router.push(
														`${effectiveBasePath}/${item.id}`,
													)
												}
											>
												<TableCell>
													<Badge
														variant="outline"
														className="rounded-lg font-mono"
													>
														{item.refNo}
													</Badge>
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-2 whitespace-nowrap text-slate-600 dark:text-slate-400">
														<Calendar className="h-4 w-4" />
														{formatDate(
															new Date(item.date),
														)}
													</div>
												</TableCell>
												<TableCell>
													{item._type ===
													"subcontract_payment" ? (
														<Badge className="rounded-lg border-0 bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-400">
															<Hammer className="h-3 w-3 me-1" />
															{t(
																"finance.expenses.subcontractBadge",
															)}
														</Badge>
													) : item._type ===
														"owner_drawing" ? (
														<div className="flex items-center gap-1">
															<Badge className="rounded-lg border-0 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400">
																<UserIcon className="h-3 w-3 me-1" />
																{t(
																	"finance.expenses.ownerDrawingBadge",
																)}
															</Badge>
															{item.hasOverdrawWarning && (
																<Badge className="rounded-lg border-0 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">
																	<AlertCircle className="h-3 w-3 me-1" />
																	{t(
																		"finance.expenses.overdrawBadge",
																	)}
																</Badge>
															)}
														</div>
													) : (
														<Badge
															variant="outline"
															className="rounded-lg"
														>
															{t(
																"finance.expenses.expenseBadge",
															)}
														</Badge>
													)}
												</TableCell>
												<TableCell>
													{item._type ===
													"expense" ? (
														<Badge
															className={`rounded-lg border-0 ${getSourceTypeColor(item.sourceType ?? "MANUAL")}`}
														>
															{getSourceTypeIcon(
																item.sourceType ??
																	"MANUAL",
															)}
															{t(
																`finance.expenses.sourceTypes.${(item.sourceType ?? "MANUAL").toLowerCase()}`,
															)}
														</Badge>
													) : (
														<span className="text-slate-400">
															-
														</span>
													)}
												</TableCell>
												<TableCell>
													<Badge
														className={`rounded-lg ${getCategoryColor(item.category)}`}
													>
														{getCategoryLabel(item)}
													</Badge>
												</TableCell>
												<TableCell className="max-w-[220px]">
													<span className="line-clamp-1">
														{item.description ||
															item.contractName ||
															"-"}
													</span>
												</TableCell>
												<TableCell>
													{item.sourceAccount ? (
														<div className="flex items-center gap-2">
															<Building className="h-4 w-4 text-slate-400" />
															<span className="text-sm">
																{
																	item
																		.sourceAccount
																		.name
																}
															</span>
														</div>
													) : (
														<span className="text-slate-400">
															-
														</span>
													)}
												</TableCell>
												{!projectId && (
													<TableCell>
														{item.project ? (
															<span className="text-sm">
																{
																	item.project
																		.name
																}
															</span>
														) : (
															<span className="text-slate-400">
																-
															</span>
														)}
													</TableCell>
												)}
												<TableCell className="text-end">
													<span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
														-
														<Currency
															amount={item.amount}
														/>
													</span>
												</TableCell>
												<TableCell>
													{getPaymentStatusBadge(
														item,
													)}
												</TableCell>
												<TableCell
													onClick={(e: any) =>
														e.stopPropagation()
													}
												>
													{item._type ===
													"expense" ? (
														<DropdownMenu>
															<DropdownMenuTrigger
																asChild
															>
																<Button
																	variant="ghost"
																	size="sm"
																	className="h-8 w-8 p-0"
																>
																	<MoreVertical className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent
																align="end"
																className="rounded-xl"
															>
																<DropdownMenuItem
																	onClick={() =>
																		router.push(
																			`${effectiveBasePath}/${item.id}`,
																		)
																	}
																>
																	<Eye className="h-4 w-4 me-2" />
																	{t(
																		"common.view",
																	)}
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() =>
																		setEditExpenseId(
																			item.id,
																		)
																	}
																>
																	<Pencil className="h-4 w-4 me-2" />
																	{t(
																		"common.edit",
																	)}
																</DropdownMenuItem>
																{item.status ===
																	"PENDING" && (
																	<>
																		<DropdownMenuSeparator />
																		<DropdownMenuItem
																			onClick={() =>
																				setPayExpense(
																					{
																						id: item.id,
																						expenseNo:
																							item.refNo,
																						amount: item.amount,
																						paidAmount:
																							item.paidAmount ??
																							0,
																						description:
																							item.description,
																					},
																				)
																			}
																			className="text-sky-600"
																		>
																			<CreditCard className="h-4 w-4 me-2" />
																			{t(
																				"finance.expenses.pay",
																			)}
																		</DropdownMenuItem>
																	</>
																)}
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	onClick={() =>
																		setDeleteExpenseId(
																			item.id,
																		)
																	}
																	className="text-red-600"
																>
																	<Trash2 className="h-4 w-4 me-2" />
																	{t(
																		"common.delete",
																	)}
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													) : null}
												</TableCell>
											</TableRow>
										))}
										{isVirtualized && paddingBottom > 0 && (
											<tr
												style={{
													height: paddingBottom,
												}}
											/>
										)}
									</TableBody>
								</table>
							</div>
							{/* شريط الملخص أسفل الجدول */}
							<div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
								<span className="text-slate-500 dark:text-slate-400">
									{t("finance.listControls.resultsCount", {
										count: items.length,
									})}
								</span>
								<span className="flex items-center gap-2">
									<span className="text-slate-500 dark:text-slate-400">
										{t(
											"finance.listControls.filteredTotal",
										)}
									</span>
									<span className="font-semibold tabular-nums text-red-600 dark:text-red-400">
										-<Currency amount={filteredTotal} />
									</span>
								</span>
							</div>
						</>
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
							onClick={() =>
								deleteExpenseId &&
								deleteMutation.mutate(deleteExpenseId)
							}
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

			{/* Edit Expense Dialog (reuses the same form, populated with existing data) */}
			<AddExpenseDialog
				open={!!editExpenseId}
				onOpenChange={(open) => !open && setEditExpenseId(null)}
				organizationId={organizationId}
				organizationSlug={organizationSlug}
				expenseId={editExpenseId}
			/>
		</div>
	);
}
