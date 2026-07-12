"use client";

import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { formatDate } from "@shared/lib/formatters";
import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
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
import { statusToneClasses } from "@ui/components/status-chip";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Building,
	Calendar,
	CalendarDays,
	CheckCircle2,
	Download,
	Eye,
	FolderKanban,
	Hash,
	MoreVertical,
	Pencil,
	Printer,
	Search,
	SlidersHorizontal,
	Trash2,
	TrendingUp,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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

interface PaymentsListProps {
	organizationId: string;
	organizationSlug: string;
	projectId?: string;
	basePath?: string;
}

type SortKey = "date" | "amount";

const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

const STATUS_OPTIONS = ["PENDING", "COMPLETED", "CANCELLED"] as const;

export function PaymentsList({
	organizationId,
	organizationSlug,
	projectId,
	basePath: customBasePath,
}: PaymentsListProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	// State — الفلاتر
	const [searchInput, setSearchInput] = useState("");
	const searchQuery = useDebouncedValue(searchInput, 300);
	const [projectFilter, setProjectFilter] = useState<string | undefined>(
		undefined,
	);
	const [methodFilter, setMethodFilter] = useState<string | undefined>(
		undefined,
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
	const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

	const effectiveBasePath =
		customBasePath || `/app/${organizationSlug}/finance/payments`;

	const dateRange = useMemo(
		() => resolveDateRange(datePreset, customFrom, customTo),
		[datePreset, customFrom, customTo],
	);

	// Fetch payments
	const { data, isLoading } = useQuery(
		orpc.finance.orgPayments.list.queryOptions({
			input: {
				organizationId,
				query: searchQuery || undefined,
				projectId: projectId ?? projectFilter,
				status: statusFilter as any,
				destinationAccountId: accountFilter,
				dateFrom: dateRange.from,
				dateTo: dateRange.to,
				limit: 200,
			},
		}),
	);

	// Fetch projects for filter
	const { data: projectsData } = useQuery({
		...orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
		enabled: !projectId,
	});

	// Fetch accounts for filter
	const { data: banksData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);

	const rawPayments = data?.payments ?? [];
	const totalPayments = Number(data?.totalAmount ?? 0);
	const projects = projectsData?.projects ?? [];
	const accounts = banksData?.accounts ?? [];

	// فلترة طريقة الدفع تتم على الواجهة — الـ API لا يدعمها
	const payments = useMemo(() => {
		let list = rawPayments;
		if (methodFilter) {
			list = list.filter((p: any) => p.paymentMethod === methodFilter);
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
	}, [rawPayments, methodFilter, sortKey, sortDir]);

	const filteredTotal = useMemo(
		() =>
			payments.reduce(
				(sum: number, p: any) => sum + Number(p.amount ?? 0),
				0,
			),
		[payments],
	);

	// مؤشرات محسوبة من النتائج الحالية
	const monthTotal = useMemo(() => {
		const now = new Date();
		const start = new Date(now.getFullYear(), now.getMonth(), 1);
		return rawPayments
			.filter((p: any) => new Date(p.date) >= start)
			.reduce((sum: number, p: any) => sum + Number(p.amount ?? 0), 0);
	}, [rawPayments]);

	const completedTotal = useMemo(
		() =>
			rawPayments
				.filter((p: any) => p.status === "COMPLETED")
				.reduce(
					(sum: number, p: any) => sum + Number(p.amount ?? 0),
					0,
				),
		[rawPayments],
	);

	const paymentsCount = data?.total ?? rawPayments.length;

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.orgPayments.delete({
				organizationId,
				id,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.payments.deleteSuccess"));
			setDeletePaymentId(null);
			queryClient.invalidateQueries({
				queryKey: orpc.finance.orgPayments.key(),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.finance.banks.key(),
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.payments.deleteError"));
		},
	});

	const getPaymentMethodLabel = (method: string) => {
		return t(`finance.payments.methods.${method.toLowerCase()}`);
	};

	const getPaymentMethodColor = (method: string) => {
		const colors: Record<string, string> = {
			CASH: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400",
			BANK_TRANSFER:
				"bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4",
			CHEQUE: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
			CREDIT_CARD:
				"bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
		};
		return (
			colors[method] ||
			"bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
		);
	};

	const getStatusColor = (status: string) => statusToneClasses(status);

	const toggleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortDir((dir) => (dir === "desc" ? "asc" : "desc"));
		} else {
			setSortKey(key);
			setSortDir("desc");
		}
	};

	const clearAllFilters = () => {
		if (!projectId) setProjectFilter(undefined);
		setMethodFilter(undefined);
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
		if (!projectId && projectFilter) {
			const project = projects.find((p: any) => p.id === projectFilter);
			chips.push({
				key: "project",
				label: project?.name ?? t("finance.payments.project"),
				onRemove: () => setProjectFilter(undefined),
			});
		}
		if (methodFilter) {
			chips.push({
				key: "method",
				label: getPaymentMethodLabel(methodFilter),
				onRemove: () => setMethodFilter(undefined),
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
				label: account?.name ?? t("finance.payments.account"),
				onRemove: () => setAccountFilter(undefined),
			});
		}
		return chips;
	}, [
		datePreset,
		customFrom,
		customTo,
		projectFilter,
		methodFilter,
		statusFilter,
		accountFilter,
		projects,
		accounts,
		projectId,
		t,
	]);

	const hasActiveFilters = filterChips.length > 0 || !!searchInput;

	const handleExport = () => {
		downloadCsv(
			`payments-${new Date().toISOString().slice(0, 10)}.csv`,
			[
				t("finance.payments.paymentNo"),
				t("finance.payments.date"),
				t("finance.payments.client"),
				t("finance.payments.project"),
				t("finance.payments.method"),
				t("finance.payments.account"),
				t("finance.payments.status"),
				t("finance.payments.amount"),
			],
			payments.map((p: any) => [
				p.paymentNo,
				formatDate(new Date(p.date)),
				p.client?.name || p.clientName || "",
				p.project?.name ?? "",
				getPaymentMethodLabel(p.paymentMethod),
				p.destinationAccount?.name ?? "",
				t(`finance.transactions.status.${p.status.toLowerCase()}`),
				Number(p.amount ?? 0),
			]),
		);
	};

	// عناصر الفلترة المشتركة (التولبار + ورقة الجوال)
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

	const methodSelect = (widthClass: string) => (
		<Select
			value={methodFilter || "all"}
			onValueChange={(value: any) =>
				setMethodFilter(value === "all" ? undefined : value)
			}
		>
			<SelectTrigger className={`${widthClass} rounded-xl`}>
				<SelectValue
					placeholder={t("finance.listControls.filterByMethod")}
				/>
			</SelectTrigger>
			<SelectContent className="rounded-xl">
				<SelectItem value="all">
					{t("finance.listControls.allMethods")}
				</SelectItem>
				{PAYMENT_METHODS.map((method) => (
					<SelectItem key={method} value={method}>
						{getPaymentMethodLabel(method)}
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
		(methodFilter ? 1 : 0) +
		(statusFilter ? 1 : 0) +
		(accountFilter ? 1 : 0);

	const emptyState = (
		<EmptyState
			icon={<TrendingUp className="h-8 w-8" />}
			description={
				hasActiveFilters
					? t("finance.listControls.noFilterResults")
					: t("finance.payments.noPayments")
			}
		>
			{hasActiveFilters && (
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
			)}
		</EmptyState>
	);

	const paymentActionsMenu = (payment: any) => {
		const isProjectPayment = payment._source === "project";
		const projectPaymentPath = payment.project?.id
			? `/app/${organizationSlug}/projects/${payment.project.id}/finance/claims`
			: null;
		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
						<MoreVertical className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="rounded-xl">
					{isProjectPayment ? (
						projectPaymentPath && (
							<DropdownMenuItem
								onClick={() => router.push(projectPaymentPath)}
							>
								<FolderKanban className="h-4 w-4 me-2" />
								{t("finance.payments.viewInProject")}
							</DropdownMenuItem>
						)
					) : (
						<>
							<DropdownMenuItem
								onClick={() =>
									router.push(
										`${effectiveBasePath}/${payment.id}`,
									)
								}
							>
								<Eye className="h-4 w-4 me-2" />
								{t("common.view")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() =>
									router.push(
										`${effectiveBasePath}/${payment.id}/receipt`,
									)
								}
							>
								<Printer className="h-4 w-4 me-2" />
								{t("finance.payments.printReceipt")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() =>
									router.push(
										`${effectiveBasePath}/${payment.id}`,
									)
								}
							>
								<Pencil className="h-4 w-4 me-2" />
								{t("common.edit")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => setDeletePaymentId(payment.id)}
								className="text-red-600"
							>
								<Trash2 className="h-4 w-4 me-2" />
								{t("common.delete")}
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		);
	};

	const openPayment = (payment: any) => {
		if (payment._source === "project") {
			if (payment.project?.id) {
				router.push(
					`/app/${organizationSlug}/projects/${payment.project.id}/finance/claims`,
				);
			}
			return;
		}
		router.push(`${effectiveBasePath}/${payment.id}`);
	};

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* الجوال: شريط إحصائيات مضغوط */}
			<CompactStatGrid
				className="sm:hidden"
				items={[
					{
						label: t("finance.payments.totalPayments"),
						value: <Currency amount={totalPayments} />,
						icon: TrendingUp,
						iconClassName: "text-green-600 dark:text-green-400",
						iconBgClassName: "bg-green-100 dark:bg-green-900/50",
					},
					{
						label: t("finance.payments.paymentsCount"),
						value: paymentsCount,
						icon: Hash,
						iconClassName: "text-chart-4 dark:text-chart-4",
						iconBgClassName: "bg-chart-4/15 dark:bg-chart-4/20",
					},
					{
						label: t("finance.payments.monthTotal"),
						value: <Currency amount={monthTotal} />,
						icon: CalendarDays,
						iconClassName: "text-chart-4 dark:text-chart-4",
						iconBgClassName: "bg-chart-4/15 dark:bg-chart-4/20",
					},
					{
						label: t("finance.payments.completedTotal"),
						value: <Currency amount={completedTotal} />,
						icon: CheckCircle2,
						iconClassName: "text-emerald-600 dark:text-emerald-400",
						iconBgClassName:
							"bg-emerald-100 dark:bg-emerald-900/50",
					},
				]}
			/>

			{/* الديسكتوب: بطاقات KPI زجاجية */}
			<div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
				<GlassStatCard
					colorScheme="green"
					icon={
						<TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
					}
					title={t("finance.payments.totalPayments")}
					value={<Currency amount={totalPayments} />}
					subtitle={t("finance.listControls.resultsCount", {
						count: paymentsCount,
					})}
				/>
				<GlassStatCard
					colorScheme="blue"
					icon={
						<Hash className="h-5 w-5 text-chart-4 dark:text-chart-4" />
					}
					title={t("finance.payments.paymentsCount")}
					value={paymentsCount}
				/>
				<GlassStatCard
					colorScheme="sky"
					icon={
						<CalendarDays className="h-5 w-5 text-chart-4 dark:text-chart-4" />
					}
					title={t("finance.payments.monthTotal")}
					value={<Currency amount={monthTotal} />}
				/>
				<GlassStatCard
					colorScheme="green"
					icon={
						<CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
					}
					title={t("finance.payments.completedTotal")}
					value={<Currency amount={completedTotal} />}
				/>
			</div>

			{/* الجوال: بحث + ورقة فلاتر */}
			<div className="flex items-center gap-2 sm:hidden">
				<div className="relative min-w-0 flex-1">
					<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder={t("finance.payments.searchPlaceholder")}
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
					{!projectId && projectSelect("w-full")}
					{methodSelect("w-full")}
					{statusSelect("w-full")}
					{accountSelect("w-full")}
				</MobileFilterSheet>
			</div>

			{/* الديسكتوب: تولبار الفلاتر */}
			<div className="hidden flex-wrap items-center gap-2 sm:flex">
				<div className="relative w-64">
					<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<Input
						placeholder={t("finance.payments.searchPlaceholder")}
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
								{t("finance.listControls.filterByMethod")}
							</p>
							{methodSelect("w-full")}
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
				<div className="ms-auto">
					<Button
						variant="outline"
						className="rounded-xl"
						onClick={handleExport}
						disabled={payments.length === 0}
					>
						<Download className="me-2 h-4 w-4" />
						{t("finance.listControls.exportCsv")}
					</Button>
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
				) : payments.length === 0 ? (
					<Card className="rounded-2xl">
						<CardContent className="p-0">{emptyState}</CardContent>
					</Card>
				) : (
					payments.map((payment: any) => (
						<Card
							key={`m-${payment._source ?? "org"}-${payment.id}`}
							className="rounded-xl transition-transform active:scale-[0.99]"
							onClick={() => openPayment(payment)}
						>
							<CardContent className="p-3">
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-1.5">
											<span className="font-mono text-xs text-slate-500 dark:text-slate-400">
												{payment.paymentNo}
											</span>
											{payment._source === "project" && (
												<Badge className="rounded-lg border-0 bg-chart-4/15 px-1.5 py-0 text-[10px] text-chart-4 dark:bg-chart-4/20 dark:text-chart-4">
													<FolderKanban className="h-3 w-3 me-1" />
													{t(
														"finance.payments.projectPayment",
													)}
												</Badge>
											)}
											<Badge
												className={`rounded-lg border-0 px-1.5 py-0 text-[10px] ${getPaymentMethodColor(payment.paymentMethod)}`}
											>
												{getPaymentMethodLabel(
													payment.paymentMethod,
												)}
											</Badge>
										</div>
										<p className="mt-1 flex items-center gap-1 truncate text-sm font-medium text-slate-900 dark:text-slate-100">
											<User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
											{payment.client?.name ||
												payment.clientName ||
												payment.project?.name ||
												"-"}
										</p>
										<p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
											<Calendar className="h-3 w-3" />
											{formatDate(new Date(payment.date))}
											{payment.destinationAccount
												?.name && (
												<>
													<span>·</span>
													<span className="truncate">
														{
															payment
																.destinationAccount
																.name
														}
													</span>
												</>
											)}
										</p>
									</div>
									<div className="flex shrink-0 flex-col items-end gap-1">
										<span className="font-bold tabular-nums text-green-600 dark:text-green-400">
											+
											<Currency
												amount={Number(payment.amount)}
											/>
										</span>
										<Badge
											className={`rounded-lg ${getStatusColor(payment.status)}`}
										>
											{t(
												`finance.transactions.status.${payment.status.toLowerCase()}`,
											)}
										</Badge>
										<div
											onClick={(e: any) =>
												e.stopPropagation()
											}
										>
											{paymentActionsMenu(payment)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}
				{!isLoading && payments.length > 0 && (
					<div className="flex items-center justify-between px-1 pt-1 text-sm">
						<span className="text-slate-500 dark:text-slate-400">
							{t("finance.listControls.resultsCount", {
								count: payments.length,
							})}
						</span>
						<span className="font-semibold tabular-nums text-green-600 dark:text-green-400">
							+<Currency amount={filteredTotal} />
						</span>
					</div>
				)}
			</div>

			{/* الديسكتوب: الجدول */}
			<Card className="hidden rounded-2xl sm:block">
				<CardContent className="p-0">
					{isLoading ? (
						<ListTableSkeleton />
					) : payments.length === 0 ? (
						emptyState
					) : (
						<>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{t("finance.payments.paymentNo")}
										</TableHead>
										<TableHead>
											<SortableColumnButton
												label={t(
													"finance.payments.date",
												)}
												active={sortKey === "date"}
												direction={sortDir}
												onClick={() =>
													toggleSort("date")
												}
											/>
										</TableHead>
										<TableHead>
											{t("finance.payments.client")}
										</TableHead>
										{!projectId && (
											<TableHead>
												{t("finance.payments.project")}
											</TableHead>
										)}
										<TableHead>
											{t("finance.payments.method")}
										</TableHead>
										<TableHead>
											{t("finance.payments.account")}
										</TableHead>
										<TableHead>
											{t("finance.payments.status")}
										</TableHead>
										<TableHead className="text-end">
											<SortableColumnButton
												label={t(
													"finance.payments.amount",
												)}
												active={sortKey === "amount"}
												direction={sortDir}
												onClick={() =>
													toggleSort("amount")
												}
												className="justify-end"
											/>
										</TableHead>
										<TableHead className="w-[50px]" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{payments.map((payment: any) => (
										<TableRow
											key={`${payment._source ?? "org"}-${payment.id}`}
											className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
											onClick={() => openPayment(payment)}
										>
											<TableCell>
												<div className="flex items-center gap-2">
													<Badge
														variant="outline"
														className="rounded-lg font-mono"
													>
														{payment.paymentNo}
													</Badge>
													{payment._source ===
														"project" && (
														<Badge className="rounded-lg bg-chart-4/15 px-1.5 py-0 text-[10px] text-chart-4 dark:bg-chart-4/20 dark:text-chart-4">
															<FolderKanban className="h-3 w-3 me-1" />
															{t(
																"finance.payments.projectPayment",
															)}
														</Badge>
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2 whitespace-nowrap text-slate-600 dark:text-slate-400">
													<Calendar className="h-4 w-4" />
													{formatDate(
														new Date(payment.date),
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<User className="h-4 w-4 text-slate-400" />
													<span>
														{payment.client?.name ||
															payment.clientName || (
																<span className="text-slate-400">
																	-
																</span>
															)}
													</span>
												</div>
											</TableCell>
											{!projectId && (
												<TableCell>
													{payment.project?.name || (
														<span className="text-slate-400">
															-
														</span>
													)}
												</TableCell>
											)}
											<TableCell>
												<Badge
													className={`rounded-lg ${getPaymentMethodColor(payment.paymentMethod)}`}
												>
													{getPaymentMethodLabel(
														payment.paymentMethod,
													)}
												</Badge>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<Building className="h-4 w-4 text-slate-400" />
													<span className="text-sm">
														{payment
															.destinationAccount
															?.name || (
															<span className="text-slate-400">
																-
															</span>
														)}
													</span>
												</div>
											</TableCell>
											<TableCell>
												<Badge
													className={`rounded-lg ${getStatusColor(payment.status)}`}
												>
													{t(
														`finance.transactions.status.${payment.status.toLowerCase()}`,
													)}
												</Badge>
											</TableCell>
											<TableCell className="text-end">
												<span className="font-semibold tabular-nums text-green-600 dark:text-green-400">
													+
													<Currency
														amount={Number(
															payment.amount,
														)}
													/>
												</span>
											</TableCell>
											<TableCell
												onClick={(e: any) =>
													e.stopPropagation()
												}
											>
												{paymentActionsMenu(payment)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							{/* شريط الملخص أسفل الجدول */}
							<div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm dark:border-slate-800">
								<span className="text-slate-500 dark:text-slate-400">
									{t("finance.listControls.resultsCount", {
										count: payments.length,
									})}
								</span>
								<span className="flex items-center gap-2">
									<span className="text-slate-500 dark:text-slate-400">
										{t(
											"finance.listControls.filteredTotal",
										)}
									</span>
									<span className="font-semibold tabular-nums text-green-600 dark:text-green-400">
										+<Currency amount={filteredTotal} />
									</span>
								</span>
							</div>
						</>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation */}
			<AlertDialog
				open={!!deletePaymentId}
				onOpenChange={() => setDeletePaymentId(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.payments.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.payments.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								deletePaymentId &&
								deleteMutation.mutate(deletePaymentId)
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
		</div>
	);
}
