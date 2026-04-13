"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@ui/components/card";
import { Badge } from "@ui/components/badge";
import { Skeleton } from "@ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
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
	DialogFooter,
} from "@ui/components/dialog";
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
import { toast } from "sonner";
import {
	ArrowRight,
	ArrowLeft,
	UserRound,
	Percent,
	CreditCard,
	Phone,
	Mail,
	FileText,
	Hash,
	Ban,
	Landmark,
	TrendingUp,
	TrendingDown,
	Wallet,
	AlertTriangle,
	Plus,
	Pencil,
	Save,
	Loader2,
	BarChart3,
	FolderOpen,
} from "lucide-react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// Types — matching the exact API response shapes (no `any`)
// ---------------------------------------------------------------------------

interface OwnerSummaryData {
	ownerId: string;
	ownerName: string;
	ownerNameEn: string | null;
	ownershipPercent: number;
	currentYearProfit: number;
	expectedShareOfProfit: number;
	totalDrawings: number;
	balance: number;
	drawingsByMonth: Array<{ month: number; total: number }>;
	drawingsByProject: Array<{
		projectId: string | null;
		projectName: string;
		total: number;
		count: number;
	}>;
}

interface CapitalContribution {
	id: string;
	contributionNo: string;
	date: string | Date;
	amount: number;
	type: "INITIAL" | "ADDITIONAL" | "IN_KIND";
	status: string;
	bankAccount: { id: string; name: string } | null;
	description: string | null;
	notes: string | null;
	cancelledAt: string | Date | null;
	cancelReason: string | null;
}

interface CapitalByOwnerData {
	ownerId: string;
	totalContributions: number;
	contributions: CapitalContribution[];
}

interface DrawingItem {
	id: string;
	drawingNo: string;
	date: string | Date;
	amount: number;
	type: string;
	status: string;
	projectId: string | null;
	project: { id: string; name: string } | null;
	bankAccount: { id: string; name: string } | null;
	owner: { id: string; name: string } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

function InfoRow({
	label,
	value,
}: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex items-start justify-between gap-2">
			<span className="text-muted-foreground">{label}</span>
			<span className="font-medium text-end">{value}</span>
		</div>
	);
}

const CONTRIBUTION_TYPE_COLORS: Record<string, string> = {
	INITIAL: "border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/30",
	ADDITIONAL: "border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-300 dark:bg-green-900/30",
	IN_KIND: "border-purple-300 text-purple-700 bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:bg-purple-900/30",
};

const DRAWING_TYPE_COLORS: Record<string, string> = {
	COMPANY_LEVEL: "border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/30",
	PROJECT_SPECIFIC: "border-purple-300 text-purple-700 bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:bg-purple-900/30",
};

const STATUS_COLORS: Record<string, string> = {
	ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
	APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
	CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const MONTH_LABELS = [
	"يناير",
	"فبراير",
	"مارس",
	"أبريل",
	"مايو",
	"يونيو",
	"يوليو",
	"أغسطس",
	"سبتمبر",
	"أكتوبر",
	"نوفمبر",
	"ديسمبر",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OwnerDetailPageProps {
	organizationId: string;
	organizationSlug: string;
	ownerId: string;
}

export function OwnerDetailPage({
	organizationId,
	organizationSlug,
	ownerId,
}: OwnerDetailPageProps) {
	const t = useTranslations("settings.owners");
	const tFinance = useTranslations("finance");
	const tCommon = useTranslations("common");
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/settings/owners`;

	const [activeTab, setActiveTab] = useState("summary");
	const [deactivateOpen, setDeactivateOpen] = useState(false);
	const [editOpen, setEditOpen] = useState(false);

	// -----------------------------------------------------------------------
	// Queries — all parallel at parent level
	// -----------------------------------------------------------------------

	const { data: owner, isLoading: ownerLoading } = useQuery(
		orpc.accounting.owners.getById.queryOptions({
			input: { organizationId, id: ownerId },
		}),
	);

	const { data: rawOwnerSummary, isLoading: summaryLoading } = useQuery({
		...orpc.accounting.ownerDrawings.ownerSummary.queryOptions({
			input: { organizationId, ownerId },
		}),
		enabled: !!owner,
	});
	const ownerSummary = rawOwnerSummary as OwnerSummaryData | undefined;

	const { data: rawCapitalData, isLoading: capitalLoading } = useQuery({
		...orpc.accounting.capitalContributions.getByOwner.queryOptions({
			input: { organizationId, ownerId },
		}),
		enabled: !!owner,
	});
	const capitalData = rawCapitalData as CapitalByOwnerData | undefined;

	// Lazy query for drawings list — only when tab 3 is active
	const { data: rawDrawingsData, isLoading: drawingsLoading } = useQuery({
		...orpc.accounting.ownerDrawings.list.queryOptions({
			input: { organizationId, ownerId },
		}),
		enabled: activeTab === "drawings",
	});
	const drawingsList = (
		rawDrawingsData as { items: DrawingItem[]; total: number } | undefined
	)?.items ?? [];

	// -----------------------------------------------------------------------
	// Deactivate mutation
	// -----------------------------------------------------------------------

	const deactivateMutation = useMutation({
		mutationFn: () =>
			orpcClient.accounting.owners.deactivate({
				organizationId,
				id: ownerId,
			}),
		onSuccess: () => {
			toast.success(t("deactivateSuccess"));
			queryClient.invalidateQueries({
				queryKey: orpc.accounting.owners.list.queryOptions({
					input: { organizationId, includeInactive: true },
				}).queryKey,
			});
			router.push(basePath);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// -----------------------------------------------------------------------
	// Derived data
	// -----------------------------------------------------------------------

	const activeContributions = useMemo(
		() =>
			capitalData?.contributions?.filter(
				(c) => c.status === "ACTIVE",
			) ?? [],
		[capitalData],
	);

	const hasMonthlyData = useMemo(
		() =>
			ownerSummary?.drawingsByMonth?.some((m) => m.total > 0) ?? false,
		[ownerSummary],
	);

	const chartData = useMemo(
		() =>
			ownerSummary?.drawingsByMonth?.map((m) => ({
				name: MONTH_LABELS[m.month - 1] ?? String(m.month),
				amount: m.total,
			})) ?? [],
		[ownerSummary],
	);

	const drawingsByProject = useMemo(
		() =>
			ownerSummary?.drawingsByProject?.filter((p) => p.total > 0) ?? [],
		[ownerSummary],
	);

	const drawingsCount = useMemo(
		() =>
			ownerSummary?.drawingsByProject?.reduce(
				(sum, p) => sum + p.count,
				0,
			) ?? 0,
		[ownerSummary],
	);

	// -----------------------------------------------------------------------
	// Loading / not found
	// -----------------------------------------------------------------------

	if (ownerLoading) {
		return (
			<div className="space-y-6">
				<Skeleton className="h-8 w-48" />
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className="h-24 rounded-xl" />
					))}
				</div>
				<Skeleton className="h-64 w-full rounded-xl" />
			</div>
		);
	}

	if (!owner) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
				<p className="text-lg">{t("noOwners")}</p>
				<Button
					variant="ghost"
					className="mt-4"
					onClick={() => router.push(basePath)}
				>
					{t("backToList")}
				</Button>
			</div>
		);
	}

	const balanceIsNegative = (ownerSummary?.balance ?? 0) < 0;

	return (
		<div className="space-y-6">
			{/* Back button */}
			<Button
				variant="ghost"
				size="sm"
				onClick={() => router.push(basePath)}
			>
				<ArrowRight className="h-4 w-4 me-1 rtl:hidden" />
				<ArrowLeft className="h-4 w-4 me-1 hidden rtl:block" />
				{t("backToList")}
			</Button>

			{/* ============================================================ */}
			{/* HEADER                                                       */}
			{/* ============================================================ */}
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-1">
					<div className="flex items-center gap-3">
						<h2 className="text-xl font-bold">{owner.name}</h2>
						{owner.nameEn && (
							<span className="text-sm text-muted-foreground">
								{owner.nameEn}
							</span>
						)}
						<Badge
							variant={
								owner.isActive ? "default" : "secondary"
							}
							className={
								owner.isActive
									? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
									: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
							}
						>
							{owner.isActive ? t("active") : t("inactive")}
						</Badge>
					</div>
					<div className="flex items-center gap-4 text-sm text-muted-foreground">
						<span className="flex items-center gap-1">
							<Percent className="h-3.5 w-3.5" />
							{Number(owner.ownershipPercent).toFixed(2)}%
						</span>
						{owner.drawingsAccount && (
							<span className="flex items-center gap-1 font-mono text-xs">
								<CreditCard className="h-3.5 w-3.5" />
								{owner.drawingsAccount.code}
							</span>
						)}
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl"
						onClick={() =>
							router.push(
								`/app/${organizationSlug}/finance/capital-contributions/new`,
							)
						}
					>
						<Plus className="h-3.5 w-3.5 me-1.5" />
						{t("dashboard.addContribution")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl"
						onClick={() =>
							router.push(
								`/app/${organizationSlug}/finance/owner-drawings/new`,
							)
						}
					>
						<Plus className="h-3.5 w-3.5 me-1.5" />
						{t("dashboard.addDrawing")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl"
						onClick={() => setEditOpen(true)}
					>
						<Pencil className="h-3.5 w-3.5 me-1.5" />
						{t("dashboard.editOwner")}
					</Button>
					{owner.isActive && (
						<Button
							variant="error"
							size="sm"
							className="rounded-xl"
							onClick={() => setDeactivateOpen(true)}
						>
							<Ban className="h-3.5 w-3.5 me-1.5" />
							{t("deactivate")}
						</Button>
					)}
				</div>
			</div>

			{/* ============================================================ */}
			{/* KPI CARDS                                                    */}
			{/* ============================================================ */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				{/* Card 1: Capital Contributed */}
				<Card className="border-blue-200 dark:border-blue-800">
					<CardContent className="pt-4">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Landmark className="h-4 w-4 text-blue-500" />
							{t("dashboard.capitalContributed")}
						</div>
						{capitalLoading ? (
							<Skeleton className="h-8 w-24 mt-1" />
						) : (
							<>
								<div className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
									{formatCurrency(
										capitalData?.totalContributions ?? 0,
									)}
								</div>
								<p className="text-xs text-muted-foreground mt-0.5">
									{t("dashboard.fromContributions", {
										count: activeContributions.length,
									})}
								</p>
							</>
						)}
					</CardContent>
				</Card>

				{/* Card 2: Profit Share YTD */}
				<Card className="border-green-200 dark:border-green-800">
					<CardContent className="pt-4">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<TrendingUp className="h-4 w-4 text-green-500" />
							{t("dashboard.profitShareYTD")}
						</div>
						{summaryLoading ? (
							<Skeleton className="h-8 w-24 mt-1" />
						) : (
							<>
								<div className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400 tabular-nums">
									{formatCurrency(
										ownerSummary?.expectedShareOfProfit ??
											0,
									)}
								</div>
								<p className="text-xs text-muted-foreground mt-0.5">
									{t("dashboard.fromNetProfit", {
										amount: formatCurrency(
											ownerSummary?.currentYearProfit ??
												0,
										),
									})}
								</p>
							</>
						)}
					</CardContent>
				</Card>

				{/* Card 3: Drawings YTD */}
				<Card className="border-red-200 dark:border-red-800">
					<CardContent className="pt-4">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<TrendingDown className="h-4 w-4 text-red-500" />
							{t("dashboard.totalDrawingsYTD")}
						</div>
						{summaryLoading ? (
							<Skeleton className="h-8 w-24 mt-1" />
						) : (
							<>
								<div className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
									{formatCurrency(
										ownerSummary?.totalDrawings ?? 0,
									)}
								</div>
								<p className="text-xs text-muted-foreground mt-0.5">
									{t("dashboard.fromDrawings", {
										count: drawingsCount,
									})}
								</p>
							</>
						)}
					</CardContent>
				</Card>

				{/* Card 4: Available Balance */}
				<Card
					className={
						balanceIsNegative
							? "border-red-300 dark:border-red-700"
							: "border-emerald-200 dark:border-emerald-800"
					}
				>
					<CardContent className="pt-4">
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Wallet className="h-4 w-4 text-emerald-500" />
							{t("dashboard.availableBalance")}
						</div>
						{summaryLoading ? (
							<Skeleton className="h-8 w-24 mt-1" />
						) : (
							<>
								<div
									className={`mt-1 text-2xl font-bold tabular-nums ${
										balanceIsNegative
											? "text-red-600 dark:text-red-400"
											: "text-emerald-600 dark:text-emerald-400"
									}`}
								>
									{formatCurrency(
										ownerSummary?.balance ?? 0,
									)}
								</div>
								<p className="text-xs mt-0.5">
									{balanceIsNegative ? (
										<span className="text-red-500 flex items-center gap-1">
											<AlertTriangle className="h-3 w-3" />
											{t("dashboard.exceedsShare")}
										</span>
									) : (
										<span className="text-emerald-500">
											{t("dashboard.availableForDrawing")}
										</span>
									)}
								</p>
							</>
						)}
					</CardContent>
				</Card>
			</div>

			{/* ============================================================ */}
			{/* TABS                                                         */}
			{/* ============================================================ */}
			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="space-y-4"
			>
				<TabsList className="rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
					<TabsTrigger value="summary" className="rounded-lg">
						<BarChart3 className="h-4 w-4 me-1.5" />
						{t("dashboard.tabs.summary")}
					</TabsTrigger>
					<TabsTrigger value="contributions" className="rounded-lg">
						<Landmark className="h-4 w-4 me-1.5" />
						{t("dashboard.tabs.contributions")}
					</TabsTrigger>
					<TabsTrigger value="drawings" className="rounded-lg">
						<TrendingDown className="h-4 w-4 me-1.5" />
						{t("dashboard.tabs.drawings")}
					</TabsTrigger>
				</TabsList>

				{/* ------ TAB 1: Summary ------ */}
				<TabsContent value="summary" className="mt-0 space-y-4">
					{/* Equity Context Card */}
					{ownerSummary && (
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<UserRound className="h-4 w-4" />
									{t("dashboard.equityContext")}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<InfoRow
									label={t("dashboard.currentYearProfit")}
									value={formatCurrency(
										ownerSummary.currentYearProfit,
									)}
								/>
								<InfoRow
									label={`× ${owner.name} (${Number(owner.ownershipPercent).toFixed(2)}%)`}
									value={formatCurrency(
										ownerSummary.expectedShareOfProfit,
									)}
								/>
								{(capitalData?.totalContributions ?? 0) >
									0 && (
									<InfoRow
										label={t(
											"dashboard.capitalContributed",
										)}
										value={formatCurrency(
											capitalData?.totalContributions ??
												0,
										)}
									/>
								)}
								<InfoRow
									label={`- ${t("dashboard.totalDrawingsYTD")}`}
									value={
										<span className="text-red-600">
											{formatCurrency(
												ownerSummary.totalDrawings,
											)}
										</span>
									}
								/>
								<div className="border-t pt-2">
									<InfoRow
										label={t(
											"dashboard.availableBalance",
										)}
										value={
											<span
												className={`font-bold ${
													balanceIsNegative
														? "text-red-600"
														: "text-green-600"
												}`}
											>
												{formatCurrency(
													ownerSummary.balance,
												)}
											</span>
										}
									/>
								</div>
								{balanceIsNegative && (
									<div className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-2">
										<AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
										<span className="text-xs text-amber-700 dark:text-amber-300">
											{t("dashboard.exceedsShare")}
										</span>
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{/* Monthly Drawings Chart */}
					{hasMonthlyData && (
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<BarChart3 className="h-4 w-4" />
									{t("dashboard.monthlyDrawings")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="h-[200px] w-full">
									<ResponsiveContainer
										width="100%"
										height="100%"
									>
										<BarChart data={chartData}>
											<CartesianGrid
												strokeDasharray="3 3"
												className="stroke-slate-200 dark:stroke-slate-700"
											/>
											<XAxis
												dataKey="name"
												tick={{
													fontSize: 11,
												}}
												className="text-slate-500"
											/>
											<YAxis
												tick={{
													fontSize: 11,
												}}
												className="text-slate-500"
											/>
											<Tooltip
												formatter={(
													value: number,
												) => [
													formatCurrency(value),
													t(
														"dashboard.totalDrawingsYTD",
													),
												]}
											/>
											<Bar
												dataKey="amount"
												fill="#ef4444"
												radius={[4, 4, 0, 0]}
											/>
										</BarChart>
									</ResponsiveContainer>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Drawings By Project */}
					{drawingsByProject.length > 0 && (
						<Card>
							<CardHeader className="pb-2">
								<CardTitle className="flex items-center gap-2 text-base">
									<FolderOpen className="h-4 w-4" />
									{t("dashboard.drawingsByProject")}
								</CardTitle>
							</CardHeader>
							<CardContent className="p-0">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="text-start">
												{tFinance(
													"ownerDrawings.project",
												)}
											</TableHead>
											<TableHead className="text-end">
												{tFinance(
													"ownerDrawings.amount",
												)}
											</TableHead>
											<TableHead className="text-end">
												{t("drawingsCount")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{drawingsByProject.map((p) => (
											<TableRow key={p.projectId ?? "general"}>
												<TableCell className="text-start">
													{p.projectName}
												</TableCell>
												<TableCell className="text-end font-medium tabular-nums">
													{formatCurrency(p.total)}
												</TableCell>
												<TableCell className="text-end tabular-nums">
													{p.count}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					)}

					{/* Owner Info Card */}
					<Card>
						<CardHeader>
							<CardTitle>{t("ownerInfo")}</CardTitle>
						</CardHeader>
						<CardContent>
							<dl className="grid gap-4 sm:grid-cols-2">
								{[
									{
										icon: Hash,
										label: t("nationalId"),
										value: owner.nationalId || "—",
									},
									{
										icon: Phone,
										label: t("phone"),
										value: owner.phone || "—",
									},
									{
										icon: Mail,
										label: t("email"),
										value: owner.email || "—",
									},
									{
										icon: FileText,
										label: t("notes"),
										value: owner.notes || "—",
									},
								].map((item) => (
									<div
										key={item.label}
										className="flex items-start gap-3"
									>
										<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
											<item.icon className="h-4 w-4 text-muted-foreground" />
										</div>
										<div className="min-w-0">
											<dt className="text-xs text-muted-foreground">
												{item.label}
											</dt>
											<dd className="text-sm font-medium break-all">
												{item.value}
											</dd>
										</div>
									</div>
								))}
							</dl>
						</CardContent>
					</Card>
				</TabsContent>

				{/* ------ TAB 2: Capital Contributions ------ */}
				<TabsContent value="contributions" className="mt-0">
					{capitalLoading ? (
						<Skeleton className="h-48 rounded-xl" />
					) : !capitalData?.contributions?.length ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
								<Landmark className="h-10 w-10 mb-3 opacity-30" />
								<p>{t("dashboard.noContributions")}</p>
								<Button
									variant="outline"
									className="mt-4 rounded-xl"
									onClick={() =>
										router.push(
											`/app/${organizationSlug}/finance/capital-contributions/new`,
										)
									}
								>
									<Plus className="h-4 w-4 me-1.5" />
									{t("dashboard.addContribution")}
								</Button>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="p-0">
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="text-start">
													{tFinance(
														"capitalContributions.contributionNo",
													)}
												</TableHead>
												<TableHead className="text-start">
													{tFinance(
														"capitalContributions.date",
													)}
												</TableHead>
												<TableHead className="text-end">
													{tFinance(
														"capitalContributions.amount",
													)}
												</TableHead>
												<TableHead className="text-start">
													{tFinance(
														"capitalContributions.type",
													)}
												</TableHead>
												<TableHead className="text-start">
													{tFinance(
														"capitalContributions.bank",
													)}
												</TableHead>
												<TableHead className="text-start">
													{tFinance(
														"capitalContributions.status",
													)}
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{capitalData.contributions.map(
												(c) => (
													<TableRow key={c.id}>
														<TableCell className="text-start font-mono text-xs">
															{c.contributionNo}
														</TableCell>
														<TableCell className="text-start">
															{new Date(
																c.date,
															).toLocaleDateString(
																"en-SA",
															)}
														</TableCell>
														<TableCell className="text-end font-medium tabular-nums">
															{formatCurrency(
																Number(
																	c.amount,
																),
															)}
														</TableCell>
														<TableCell className="text-start">
															<Badge
																variant="outline"
																className={
																	CONTRIBUTION_TYPE_COLORS[
																		c
																			.type
																	] ?? ""
																}
															>
																{tFinance(
																	`capitalContributions.types.${c.type}`,
																)}
															</Badge>
														</TableCell>
														<TableCell className="text-start">
															{c.bankAccount
																?.name ??
																"—"}
														</TableCell>
														<TableCell className="text-start">
															<Badge
																className={
																	STATUS_COLORS[
																		c
																			.status
																	] ?? ""
																}
															>
																{tFinance(
																	`capitalContributions.statuses.${c.status}`,
																)}
															</Badge>
														</TableCell>
													</TableRow>
												),
											)}
											{/* Total Row */}
											<TableRow className="border-t-2 font-semibold bg-slate-50 dark:bg-slate-800/50">
												<TableCell
													colSpan={2}
													className="text-start"
												>
													{tCommon("total")}
												</TableCell>
												<TableCell className="text-end tabular-nums">
													{formatCurrency(
														capitalData.totalContributions,
													)}
												</TableCell>
												<TableCell colSpan={3} />
											</TableRow>
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* ------ TAB 3: Drawings ------ */}
				<TabsContent value="drawings" className="mt-0">
					{drawingsLoading ? (
						<Skeleton className="h-48 rounded-xl" />
					) : drawingsList.length === 0 ? (
						<Card>
							<CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
								<TrendingDown className="h-10 w-10 mb-3 opacity-30" />
								<p>{t("dashboard.noDrawings")}</p>
								<Button
									variant="outline"
									className="mt-4 rounded-xl"
									onClick={() =>
										router.push(
											`/app/${organizationSlug}/finance/owner-drawings/new`,
										)
									}
								>
									<Plus className="h-4 w-4 me-1.5" />
									{t("dashboard.addDrawing")}
								</Button>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="p-0">
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="text-start">
													{tFinance(
														"ownerDrawings.drawingNo",
													)}
												</TableHead>
												<TableHead className="text-start">
													{tFinance(
														"ownerDrawings.date",
													)}
												</TableHead>
												<TableHead className="text-end">
													{tFinance(
														"ownerDrawings.amount",
													)}
												</TableHead>
												<TableHead className="text-start">
													{tFinance(
														"ownerDrawings.type",
													)}
												</TableHead>
												<TableHead className="text-start">
													{tFinance(
														"ownerDrawings.project",
													)}
												</TableHead>
												<TableHead className="text-start">
													{tFinance(
														"ownerDrawings.status",
													)}
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{drawingsList.map((d) => (
												<TableRow
													key={d.id}
													className="cursor-pointer hover:bg-muted/50"
													onClick={() =>
														router.push(
															`/app/${organizationSlug}/finance/owner-drawings/${d.id}`,
														)
													}
												>
													<TableCell className="text-start font-mono text-xs">
														{d.drawingNo}
													</TableCell>
													<TableCell className="text-start">
														{new Date(
															d.date,
														).toLocaleDateString(
															"en-SA",
														)}
													</TableCell>
													<TableCell className="text-end font-medium tabular-nums">
														{formatCurrency(
															Number(d.amount),
														)}
													</TableCell>
													<TableCell className="text-start">
														<Badge
															variant="outline"
															className={
																DRAWING_TYPE_COLORS[
																	d.type
																] ?? ""
															}
														>
															{tFinance(
																`ownerDrawings.${d.type === "COMPANY_LEVEL" ? "companyLevel" : "projectSpecific"}`,
															)}
														</Badge>
													</TableCell>
													<TableCell className="text-start">
														{d.project?.name ??
															"—"}
													</TableCell>
													<TableCell className="text-start">
														<Badge
															className={
																STATUS_COLORS[
																	d.status
																] ?? ""
															}
														>
															{tFinance(
																`ownerDrawings.statuses.${d.status}`,
															)}
														</Badge>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>

			{/* ============================================================ */}
			{/* EDIT OWNER DIALOG                                            */}
			{/* ============================================================ */}
			<EditOwnerDialog
				open={editOpen}
				onOpenChange={setEditOpen}
				organizationId={organizationId}
				owner={owner}
				onSuccess={() => {
					queryClient.invalidateQueries({
						queryKey: orpc.accounting.owners.getById.queryOptions({
							input: { organizationId, id: ownerId },
						}).queryKey,
					});
					queryClient.invalidateQueries({
						queryKey: orpc.accounting.owners.list.queryOptions({
							input: { organizationId, includeInactive: true },
						}).queryKey,
					});
				}}
			/>

			{/* ============================================================ */}
			{/* DEACTIVATE DIALOG                                            */}
			{/* ============================================================ */}
			<AlertDialog
				open={deactivateOpen}
				onOpenChange={setDeactivateOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("deactivateConfirm")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("deactivateDesc")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("backToList")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deactivateMutation.mutate()}
							disabled={deactivateMutation.isPending}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deactivateMutation.isPending
								? "..."
								: t("deactivate")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Edit Owner Dialog (self-contained sub-component)
// ---------------------------------------------------------------------------

interface EditOwnerDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	owner: {
		id: string;
		name: string;
		nameEn: string | null;
		ownershipPercent: number | { toFixed: (n: number) => string };
		nationalId: string | null;
		phone: string | null;
		email: string | null;
		notes: string | null;
	};
	onSuccess: () => void;
}

function EditOwnerDialog({
	open,
	onOpenChange,
	organizationId,
	owner,
	onSuccess,
}: EditOwnerDialogProps) {
	const t = useTranslations("settings.owners");

	const [formData, setFormData] = useState({
		name: owner.name,
		nameEn: owner.nameEn ?? "",
		ownershipPercent: String(Number(owner.ownershipPercent)),
		nationalId: owner.nationalId ?? "",
		phone: owner.phone ?? "",
		email: owner.email ?? "",
		notes: owner.notes ?? "",
	});

	// Reset form when dialog opens with new owner data
	const resetForm = () => {
		setFormData({
			name: owner.name,
			nameEn: owner.nameEn ?? "",
			ownershipPercent: String(Number(owner.ownershipPercent)),
			nationalId: owner.nationalId ?? "",
			phone: owner.phone ?? "",
			email: owner.email ?? "",
			notes: owner.notes ?? "",
		});
	};

	// Fetch total ownership for validation hint
	const { data: totalOwnership } = useQuery(
		orpc.accounting.owners.getTotalOwnership.queryOptions({
			input: { organizationId },
		}),
	);

	const updateMutation = useMutation({
		mutationFn: () => {
			const percent = parseFloat(formData.ownershipPercent);
			return orpcClient.accounting.owners.update({
				organizationId,
				id: owner.id,
				name: formData.name || undefined,
				nameEn: formData.nameEn || undefined,
				ownershipPercent:
					!isNaN(percent) && percent > 0 ? percent : undefined,
				nationalId: formData.nationalId || undefined,
				phone: formData.phone || undefined,
				email: formData.email || undefined,
				notes: formData.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("updateSuccess"));
			onSuccess();
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const currentTotal = Number(
		(totalOwnership as { totalPercent?: number } | undefined)
			?.totalPercent ?? 0,
	);
	const newTotal =
		currentTotal -
		Number(owner.ownershipPercent) +
		(parseFloat(formData.ownershipPercent) || 0);

	return (
		<Dialog
			open={open}
			onOpenChange={(val) => {
				if (!val) resetForm();
				onOpenChange(val);
			}}
		>
			<DialogContent className="sm:max-w-lg rounded-2xl">
				<DialogHeader>
					<DialogTitle>{t("editOwner")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label className="text-xs font-medium text-muted-foreground">
								{t("name")} *
							</Label>
							<Input
								value={formData.name}
								onChange={(e) =>
									setFormData({
										...formData,
										name: e.target.value,
									})
								}
								className="rounded-xl h-10"
								required
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs font-medium text-muted-foreground">
								{t("nameEn")}
							</Label>
							<Input
								value={formData.nameEn}
								onChange={(e) =>
									setFormData({
										...formData,
										nameEn: e.target.value,
									})
								}
								className="rounded-xl h-10"
								dir="ltr"
							/>
						</div>
					</div>
					<div className="space-y-1">
						<Label className="text-xs font-medium text-muted-foreground">
							{t("ownershipPercent")} *
						</Label>
						<Input
							type="number"
							step="0.01"
							min="0.01"
							max="100"
							value={formData.ownershipPercent}
							onChange={(e) =>
								setFormData({
									...formData,
									ownershipPercent: e.target.value,
								})
							}
							className="rounded-xl h-10"
							dir="ltr"
							required
						/>
						{newTotal > 0 && (
							<p
								className={`text-xs mt-1 ${newTotal > 100 ? "text-red-500" : "text-muted-foreground"}`}
							>
								{t("totalOwnership")}: {newTotal.toFixed(2)}%
								{newTotal > 100 && ` — ${t("ownershipExceeded")}`}
							</p>
						)}
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label className="text-xs font-medium text-muted-foreground">
								{t("nationalId")}
							</Label>
							<Input
								value={formData.nationalId}
								onChange={(e) =>
									setFormData({
										...formData,
										nationalId: e.target.value,
									})
								}
								className="rounded-xl h-10"
								dir="ltr"
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs font-medium text-muted-foreground">
								{t("phone")}
							</Label>
							<Input
								value={formData.phone}
								onChange={(e) =>
									setFormData({
										...formData,
										phone: e.target.value,
									})
								}
								className="rounded-xl h-10"
								dir="ltr"
							/>
						</div>
					</div>
					<div className="space-y-1">
						<Label className="text-xs font-medium text-muted-foreground">
							{t("email")}
						</Label>
						<Input
							type="email"
							value={formData.email}
							onChange={(e) =>
								setFormData({
									...formData,
									email: e.target.value,
								})
							}
							className="rounded-xl h-10"
							dir="ltr"
						/>
					</div>
					<div className="space-y-1">
						<Label className="text-xs font-medium text-muted-foreground">
							{t("notes")}
						</Label>
						<Textarea
							value={formData.notes}
							onChange={(e) =>
								setFormData({
									...formData,
									notes: e.target.value,
								})
							}
							className="rounded-xl resize-none"
							rows={2}
						/>
					</div>
				</div>
				<DialogFooter className="gap-2">
					<Button
						variant="outline"
						className="rounded-xl"
						onClick={() => onOpenChange(false)}
						disabled={updateMutation.isPending}
					>
						{t("backToList")}
					</Button>
					<Button
						className="rounded-xl"
						onClick={() => updateMutation.mutate()}
						disabled={updateMutation.isPending || !formData.name}
					>
						{updateMutation.isPending ? (
							<Loader2 className="h-4 w-4 me-2 animate-spin" />
						) : (
							<Save className="h-4 w-4 me-2" />
						)}
						{t("editOwner")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
