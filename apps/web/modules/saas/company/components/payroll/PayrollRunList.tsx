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
import { statusToneClasses } from "@ui/components/status-chip";
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
import { Plus, CalendarRange, Banknote, FileText, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { CompactStatGrid } from "@saas/shared/components/mobile/CompactStatGrid";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
import { MobileDocList, MobileDocRow } from "@saas/shared/components/mobile/MobileDocRow";
import { Currency } from "../../../finance/components/shared/Currency";

interface PayrollRunListProps {
	organizationId: string;
	organizationSlug: string;
}

const PAYROLL_STATUSES = ["DRAFT", "APPROVED", "PAID", "CANCELLED"] as const;

export function PayrollRunList({ organizationId, organizationSlug }: PayrollRunListProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [showCreateDialog, setShowCreateDialog] = useState(false);
	const [createMonth, setCreateMonth] = useState<number>(new Date().getMonth() + 1);
	const [createYear, setCreateYear] = useState<number>(new Date().getFullYear());

	const { data, isLoading } = useQuery(
		orpc.company.payroll.list.queryOptions({
			input: {
				organizationId,
				status: statusFilter !== "all" ? (statusFilter as typeof PAYROLL_STATUSES[number]) : undefined,
			},
		}),
	);

	const runs = data?.runs ?? [];
	const latestRun = runs.length > 0 ? runs[0] : null;

	const currentMonthRun = runs.find((r: any) => {
		const now = new Date();
		return r.month === now.getMonth() + 1 && r.year === now.getFullYear();
	});

	const createMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.payroll.create({
				organizationId,
				month: createMonth,
				year: createYear,
			});
		},
		onSuccess: (result) => {
			toast.success(t("company.payroll.createSuccess"));
			queryClient.invalidateQueries({
				queryKey: orpc.company.payroll.list.queryOptions({ input: { organizationId } }).queryKey,
			});
			setShowCreateDialog(false);
			if (result?.id) {
				router.push(`/app/${organizationSlug}/company/payroll/${result.id}`);
			}
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.payroll.createError"));
		},
	});

	const getStatusBadge = (status: string) => {
		const labelKey = status.toLowerCase() as "draft" | "approved" | "paid" | "cancelled";
		return (
			<Badge className={`border-0 text-[10px] px-2 py-0.5 ${statusToneClasses(status)}`}>
				{t(`company.payroll.${labelKey}`)}
			</Badge>
		);
	};

	const getRunNo = (run: { year: number; month: number }) =>
		`PAY-${run.year}-${String(run.month).padStart(2, "0")}`;

	return (
		<div className="space-y-6">
			{/* الجوال: شريط إحصائيات مضغوط */}
			<CompactStatGrid
				className="sm:hidden"
				items={[
					{
						label: t("company.payroll.totalRuns"),
						value: runs.length,
						icon: FileText,
						iconClassName: "text-chart-4",
						iconBgClassName: "bg-chart-4/15",
					},
					{
						label: t("company.payroll.currentMonthStatus"),
						value: currentMonthRun
							? getStatusBadge(currentMonthRun.status)
							: t("company.payroll.noRuns"),
						icon: CalendarRange,
						iconClassName: "text-chart-4",
						iconBgClassName: "bg-chart-4/15",
					},
					{
						label: t("company.payroll.totalSalaries"),
						value: <Currency amount={Number(latestRun?.totalNetSalary ?? 0)} />,
						icon: Banknote,
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
						{t("company.payroll.totalRuns")}
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
						{t("company.payroll.currentMonthStatus")}
					</p>
					<div className="mt-1">
						{currentMonthRun ? (
							getStatusBadge(currentMonthRun.status)
						) : (
							<span className="text-sm text-muted-foreground">{t("company.payroll.noRuns")}</span>
						)}
					</div>
				</div>

				<div className="bg-card border-2 rounded-2xl p-4">
					<div className="flex items-center justify-between mb-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Banknote className="h-5 w-5 text-chart-4" />
						</div>
					</div>
					<p className="text-xs font-medium text-muted-foreground mb-1">
						{t("company.payroll.totalSalaries")}
					</p>
					<p className="text-xl font-bold text-chart-4">
						{latestRun ? (
							<Currency amount={Number(latestRun.totalNetSalary)} />
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
							<SelectValue placeholder={t("company.payroll.status")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							{PAYROLL_STATUSES.map((status) => (
								<SelectItem key={status} value={status}>
									{t(`company.payroll.${status.toLowerCase()}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</MobileFilterSheet>
				<Button
					size="icon"
					aria-label={t("company.payroll.createRun")}
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
							<SelectValue placeholder={t("company.payroll.status")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("company.common.all")}</SelectItem>
							{PAYROLL_STATUSES.map((status) => (
								<SelectItem key={status} value={status}>
									{t(`company.payroll.${status.toLowerCase()}`)}
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
					{t("company.payroll.createRun")}
				</Button>
			</div>

			{/* الجوال: صفوف مستندات بسطرين بدل الجدول متعدد الأعمدة */}
			{runs.length > 0 && (
				<MobileDocList className="sm:hidden">
					{runs.map((run: any) => (
						<MobileDocRow
							key={run.id}
							href={`/app/${organizationSlug}/company/payroll/${run.id}`}
							title={
								<span dir="ltr" className="whitespace-nowrap">
									{getRunNo(run)}
								</span>
							}
							subtitle={`${run.month} / ${run.year}`}
							amount={<Currency amount={Number(run.totalNetSalary)} />}
							badge={getStatusBadge(run.status)}
						/>
					))}
				</MobileDocList>
			)}

			{/* Table - Glass Morphism */}
			<div className="hidden sm:block bg-card border-2 rounded-2xl overflow-x-auto">
				<Table className="table-fixed w-full min-w-[760px]">
					<TableHeader>
						<TableRow className="border-b-2 hover:bg-transparent">
							<TableHead className="text-end text-muted-foreground w-[20%]">{t("company.payroll.runNo")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[20%]">{t("company.payroll.month")} / {t("company.payroll.year")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[15%]">{t("company.payroll.employeeCount")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[20%]">{t("company.payroll.totalSalaries")}</TableHead>
							<TableHead className="text-end text-muted-foreground w-[15%]">{t("company.payroll.status")}</TableHead>
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
									onClick={() => router.push(`/app/${organizationSlug}/company/payroll/${run.id}`)}
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
										{run.employeeCount ?? 0}
									</TableCell>
									<TableCell className="text-end font-semibold text-card-foreground">
										<Currency amount={Number(run.totalNetSalary)} />
									</TableCell>
									<TableCell className="text-end">
										{getStatusBadge(run.status)}
									</TableCell>
									<TableCell className="text-end">
										<Button
											variant="ghost"
											size="icon"
											className="rounded-lg hover:bg-accent"
											aria-label={t("company.payroll.viewDetails")}
											onClick={(e: any) => {
												e.stopPropagation();
												router.push(`/app/${organizationSlug}/company/payroll/${run.id}`);
											}}
										>
											<FileText className="h-4 w-4 text-muted-foreground" />
										</Button>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-16">
									<div className="flex flex-col items-center">
										<div className="mb-4 rounded-2xl bg-muted p-5">
											<FileText className="h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
										</div>
										<p className="text-sm text-muted-foreground">
											{t("company.payroll.noRuns")}
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Create Payroll Run Dialog */}
			{showCreateDialog && (
				<Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
					<DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl">
						<DialogHeader className="bg-card border-b-2 px-5 py-4">
							<DialogTitle className="text-base font-semibold text-end">
								{t("company.payroll.createRun")}
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
											{t("company.payroll.month")} *
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
											{t("company.payroll.year")} *
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
											<Save className="h-4 w-4 me-2" />
											{t("company.payroll.createRun")}
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
