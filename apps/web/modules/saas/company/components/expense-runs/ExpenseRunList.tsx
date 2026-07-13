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
import { EmptyState } from "@ui/components/empty-state";
import { Plus, CalendarRange, Receipt, FileText, Loader2, Send, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
import { Currency } from "../../../finance/components/shared/Currency";

interface ExpenseRunListProps {
	organizationId: string;
	organizationSlug: string;
}

const EXPENSE_RUN_STATUSES = ["DRAFT", "POSTED", "CANCELLED"] as const;

const STATUS_STYLES: Record<string, string> = {
	DRAFT: "bg-muted text-muted-foreground",
	POSTED: "bg-chart-4/15 text-chart-4",
	CANCELLED: "bg-destructive/15 text-destructive",
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

	const currentMonthRun = runs.find((r: any) => {
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
		<div className="space-y-6">
			{/* Back to Expenses */}
			<Button
				variant="ghost"
				className="rounded-lg hover:bg-accent gap-2"
				onClick={() => router.push(`/app/${organizationSlug}/company/expenses`)}
			>
				<ArrowRight className="h-4 w-4" />
				{t("company.expenses.title")}
			</Button>

			{/* الجوال: شريط إحصائيات مضغوط */}
			<CompactStatGrid
				className="sm:hidden"
				items={[
					{
						label: t("company.expenseRuns.totalRuns"),
						value: runs.length,
						icon: FileText,
						iconClassName: "text-chart-4",
						iconBgClassName: "bg-chart-4/15",
					},
					{
						label: t("company.expenseRuns.currentMonthStatus"),
						value: currentMonthRun
							? getStatusBadge(currentMonthRun.status)
							: t("company.expenseRuns.noRuns"),
						icon: CalendarRange,
						iconClassName: "text-chart-4",
						iconBgClassName: "bg-chart-4/15",
					},
					{
						label: t("company.expenseRuns.totalAmount"),
						value: <Currency amount={Number(latestRun?.totalAmount ?? 0)} />,
						icon: Receipt,
						iconClassName: "text-chart-4",
						iconBgClassName: "bg-chart-4/15",
						valueClassName: "text-chart-4",
					},
				]}
			/>

			{/* Summary Cards - Glass Morphism (الديسكتوب كما هو) */}
			<div className="hidden sm:grid sm:grid-cols-2 gap-4 lg:grid-cols-3">
				<div className="bg-card border-2 rounded-2xl p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<FileText className="h-5 w-5 text-chart-4" />
						</div>
					</div>
					<p className="text-xs font-medium text-muted-foreground mb-1">
						{t("company.expenseRuns.totalRuns")}
					</p>
					<p className="text-2xl font-bold text-chart-4">
						{runs.length}
					</p>
				</div>

				<div className="bg-card border-2 rounded-2xl p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<CalendarRange className="h-5 w-5 text-chart-4" />
						</div>
					</div>
					<p className="text-xs font-medium text-muted-foreground mb-1">
						{t("company.expenseRuns.currentMonthStatus")}
					</p>
					<div className="mt-1">
						{currentMonthRun ? (
							getStatusBadge(currentMonthRun.status)
						) : (
							<span className="text-sm text-muted-foreground">{t("company.expenseRuns.noRuns")}</span>
						)}
					</div>
				</div>

				<div className="bg-card border-2 rounded-2xl p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Receipt className="h-5 w-5 text-chart-4" />
						</div>
					</div>
					<p className="text-xs font-medium text-muted-foreground mb-1">
						{t("company.expenseRuns.totalAmount")}
					</p>
					<p className="text-xl font-bold text-chart-4">
						{latestRun ? (
							<Currency amount={Number(latestRun.totalAmount)} />
						) : (
							<Currency amount={0} />
						)}
					</p>
				</div>
			</div>

			{/* الجوال: ورقة فلاتر + زر إنشاء مضغوط في صف واحد */}
			<div className="flex items-center justify-between gap-2 sm:hidden">
				<MobileFilterSheet activeCount={statusFilter !== "all" ? 1 : 0}>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full rounded-xl">
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
				</MobileFilterSheet>
				<Button
					size="icon"
					aria-label={t("company.expenseRuns.createRun")}
					onClick={() => setShowCreateDialog(true)}
					className="h-10 w-10 shrink-0 rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Plus className="h-5 w-5" />
				</Button>
			</div>

			{/* Filter Bar (الديسكتوب كما هو) */}
			<div className="hidden gap-4 sm:flex sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[160px] rounded-lg border border-input bg-card">
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
					className="rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Plus className="ms-2 h-4 w-4" />
					{t("company.expenseRuns.createRun")}
				</Button>
			</div>

			{/* Table - Glass Morphism */}
			<div className="bg-card border-2 rounded-2xl overflow-x-auto">
				<Table className="table-fixed w-full min-w-[760px]">
					<TableHeader>
						<TableRow className="border-b-2 hover:bg-transparent">
							<TableHead className="text-end text-muted-foreground w-[20%]">{t("company.expenseRuns.runNo")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[20%]">{t("company.expenseRuns.month")} / {t("company.expenseRuns.year")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[15%]">{t("company.expenseRuns.itemCount")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[20%]">{t("company.expenseRuns.totalAmount")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[15%]">{t("company.expenseRuns.status")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[10%]">{t("company.common.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i} className="border-b-2">
									{[...Array(6)].map((_, j) => (
										<TableCell key={j}>
											<div className="h-4 animate-pulse rounded bg-muted" />
										</TableCell>
									))}
								</TableRow>
							))
						) : runs.length ? (
							runs.map((run: any, index: any) => (
								<TableRow
									key={run.id}
									className="cursor-pointer border-b-2 hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
									onClick={() => router.push(`/app/${organizationSlug}/company/expense-runs/${run.id}`)}
								>
									<TableCell className="text-end">
										<p className="font-medium text-card-foreground">
											{getRunNo(run)}
										</p>
									</TableCell>
									<TableCell className="text-end text-muted-foreground">
										{run.month} / {run.year}
									</TableCell>
									<TableCell className="text-end text-muted-foreground">
										{run.itemCount ?? 0}
									</TableCell>
									<TableCell className="text-end font-semibold text-card-foreground">
										<Currency amount={Number(run.totalAmount)} />
									</TableCell>
									<TableCell className="text-end">
										{getStatusBadge(run.status)}
									</TableCell>
									<TableCell className="text-end">
										<Button
											variant="ghost"
											size="icon"
											className="rounded-lg hover:bg-accent"
											onClick={(e: any) => {
												e.stopPropagation();
												router.push(`/app/${organizationSlug}/company/expense-runs/${run.id}`);
											}}
										>
											<FileText className="h-4 w-4 text-muted-foreground" />
										</Button>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6}>
									<EmptyState
										icon={<FileText className="h-10 w-10" />}
										description={t("company.expenseRuns.noRuns")}
									/>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Create Expense Run Dialog */}
			{showCreateDialog && (
				<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
					<DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl">
						<DialogHeader className="bg-card border-b-2 px-5 py-4">
							<DialogTitle className="text-base font-semibold text-end">
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
										<Label className="text-xs font-medium text-muted-foreground">
											{t("company.expenseRuns.month")} *
										</Label>
										<Select
											value={String(createMonth)}
											onValueChange={(value: any) => setCreateMonth(Number(value))}
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
										<Label className="text-xs font-medium text-muted-foreground">
											{t("company.expenseRuns.year")} *
										</Label>
										<Input
											type="number"
											min={2020}
											max={2100}
											value={createYear}
											onChange={(e: any) => setCreateYear(Number(e.target.value))}
											className="rounded-xl h-10"
											required
										/>
									</div>
								</div>
							</div>

							{/* Footer Actions */}
							<div className="bg-muted/50 border-t-2 px-5 py-3 flex gap-3">
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
