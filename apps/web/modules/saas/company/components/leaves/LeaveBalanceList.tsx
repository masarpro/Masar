"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@ui/components/dialog";
import { Label } from "@ui/components/label";
import { Pencil, Wallet } from "lucide-react";
import { toast } from "sonner";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
import { MobileDocList, MobileDocRow } from "@saas/shared/components/mobile/MobileDocRow";

interface LeaveBalanceListProps {
	organizationId: string;
	organizationSlug: string;
}

export function LeaveBalanceList({ organizationId, organizationSlug }: LeaveBalanceListProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [year, setYear] = useState(new Date().getFullYear());
	const [showAdjustDialog, setShowAdjustDialog] = useState(false);
	const [adjustData, setAdjustData] = useState({
		employeeId: "",
		leaveTypeId: "",
		totalDays: 0,
	});

	const { data: balances, isLoading } = useQuery(
		orpc.company.leaves.balances.list.queryOptions({
			input: { organizationId, year },
		}),
	);

	const { data: employees } = useQuery(
		orpc.company.employees.list.queryOptions({
			input: { organizationId, status: "ACTIVE", limit: 200, offset: 0 },
		}),
	);

	const { data: leaveTypes } = useQuery(
		orpc.company.leaves.types.list.queryOptions({
			input: { organizationId },
		}),
	);

	const adjustMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.leaves.balances.adjust({
				organizationId,
				year,
				...adjustData,
			});
		},
		onSuccess: () => {
			toast.success(t("company.leaves.balances.adjustSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.leaves.balances.list.queryOptions({ input: { organizationId } }).queryKey });
			setShowAdjustDialog(false);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const currentYear = new Date().getFullYear();
	const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

	return (
		<div className="space-y-6">
			{/* الجوال: ورقة فلاتر + زر تعديل مضغوط في صف واحد */}
			<div className="flex items-center justify-between gap-2 sm:hidden">
				<MobileFilterSheet activeCount={year !== currentYear ? 1 : 0}>
					<Select value={String(year)} onValueChange={(v: any) => setYear(Number(v))}>
						<SelectTrigger className="w-full rounded-xl">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							{yearOptions.map((y) => (
								<SelectItem key={y} value={String(y)}>{y}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</MobileFilterSheet>
				<Button
					size="icon"
					aria-label={t("company.leaves.balances.adjust")}
					onClick={() => setShowAdjustDialog(true)}
					className="h-10 w-10 shrink-0 rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Pencil className="h-4 w-4" />
				</Button>
			</div>

			{/* Header (الديسكتوب كما هو) */}
			<div className="hidden gap-4 sm:flex sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<Select value={String(year)} onValueChange={(v: any) => setYear(Number(v))}>
						<SelectTrigger className="w-[140px] rounded-lg border border-input bg-card">
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							{yearOptions.map((y) => (
								<SelectItem key={y} value={String(y)}>{y}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button
					onClick={() => setShowAdjustDialog(true)}
					className="rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
				>
					<Pencil className="ms-2 h-4 w-4" />
					{t("company.leaves.balances.adjust")}
				</Button>
			</div>

			{/* الجوال: صفوف مستندات بسطرين بدل الجدول متعدد الأعمدة */}
			{(balances?.balances?.length ?? 0) > 0 && (
				<MobileDocList className="sm:hidden">
					{balances?.balances?.map((bal: any) => (
						<MobileDocRow
							key={bal.id}
							title={bal.employee.name}
							subtitle={
								<>
									{bal.employee.employeeNo && (
										<>
											<span dir="ltr" className="whitespace-nowrap">
												{bal.employee.employeeNo}
											</span>
											{" · "}
										</>
									)}
									{bal.leaveType.name}
								</>
							}
							amount={`${bal.usedDays} / ${bal.totalDays} ${t("company.leaves.days")}`}
							badge={
								<Badge className={`border-0 text-[10px] px-2 py-0.5 ${
									bal.remainingDays <= 3
										? "bg-destructive/15 text-destructive"
										: "bg-success/15 text-success"
								}`}>
									{bal.remainingDays} {t("company.leaves.days")}
								</Badge>
							}
						/>
					))}
				</MobileDocList>
			)}

			{/* Table */}
			<div className="hidden sm:block bg-card border-2 rounded-2xl overflow-x-auto">
				<Table className="table-fixed w-full min-w-[640px]">
					<TableHeader>
						<TableRow className="border-b-2 hover:bg-transparent">
							<TableHead className="text-end text-muted-foreground">{t("company.leaves.balances.employee")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.leaves.balances.leaveType")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.leaves.balances.total")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.leaves.balances.used")}</TableHead>
							<TableHead className="text-end text-muted-foreground">{t("company.leaves.balances.remaining")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i} className="border-b-2">
									{[...Array(5)].map((_, j) => (
										<TableCell key={j}>
											<div className="h-4 animate-pulse rounded bg-muted" />
										</TableCell>
									))}
								</TableRow>
							))
						) : balances?.balances?.length ? (
							balances.balances.map((bal: any, index: any) => (
								<TableRow
									key={bal.id}
									className="border-b-2 hover:bg-accent transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
								>
									<TableCell className="text-end">
										<div>
											<p className="font-medium text-card-foreground">{bal.employee.name}</p>
											{bal.employee.employeeNo && <p className="text-xs text-muted-foreground">{bal.employee.employeeNo}</p>}
										</div>
									</TableCell>
									<TableCell className="text-end">
										<div className="flex items-center gap-2">
											{bal.leaveType.color && (
												<div className="w-3 h-3 rounded-full" style={{ backgroundColor: bal.leaveType.color }} />
											)}
											<span className="text-sm text-card-foreground">{bal.leaveType.name}</span>
										</div>
									</TableCell>
									<TableCell className="text-end text-sm font-semibold text-card-foreground">
										{bal.totalDays} {t("company.leaves.days")}
									</TableCell>
									<TableCell className="text-end text-sm text-muted-foreground">
										{bal.usedDays} {t("company.leaves.days")}
									</TableCell>
									<TableCell className="text-end">
										<Badge className={`border-0 text-[10px] px-2 py-0.5 ${
											bal.remainingDays <= 3
												? "bg-destructive/15 text-destructive"
												: "bg-success/15 text-success"
										}`}>
											{bal.remainingDays} {t("company.leaves.days")}
										</Badge>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-16">
									<div className="flex flex-col items-center">
										<div className="mb-4 rounded-2xl bg-muted p-5">
											<Wallet className="h-10 w-10 text-muted-foreground dark:text-muted-foreground" />
										</div>
										<p className="text-sm text-muted-foreground">
											{t("company.leaves.balances.noBalances")}
										</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Adjust Dialog */}
			<Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
				<DialogContent className="rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("company.leaves.balances.adjustTitle")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>{t("company.leaves.balances.employee")}</Label>
							<Select value={adjustData.employeeId} onValueChange={(v: any) => setAdjustData((p) => ({ ...p, employeeId: v }))}>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("company.leaves.requests.selectEmployee")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{employees?.employees?.map((emp: any) => (
										<SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("company.leaves.balances.leaveType")}</Label>
							<Select value={adjustData.leaveTypeId} onValueChange={(v: any) => setAdjustData((p) => ({ ...p, leaveTypeId: v }))}>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("company.leaves.requests.selectLeaveType")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{(leaveTypes as Array<{ id: string; name: string }> | undefined)?.map((lt) => (
										<SelectItem key={lt.id} value={lt.id}>{lt.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("company.leaves.balances.totalDays")}</Label>
							<Input
								type="number"
								className="rounded-xl mt-1"
								min={0}
								value={adjustData.totalDays}
								onChange={(e: any) => setAdjustData((p) => ({ ...p, totalDays: Number(e.target.value) }))}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" className="rounded-xl" onClick={() => setShowAdjustDialog(false)}>
							{t("common.cancel")}
						</Button>
						<Button
							className="rounded-xl"
							onClick={() => adjustMutation.mutate()}
							disabled={!adjustData.employeeId || !adjustData.leaveTypeId || adjustMutation.isPending}
						>
							{t("common.save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
