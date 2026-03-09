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
		<div className="space-y-6" dir="rtl">
			{/* Header */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-3">
					<Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
						<SelectTrigger className="w-[140px] rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
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
					className="rounded-xl bg-slate-900 text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
				>
					<Pencil className="ms-2 h-4 w-4" />
					{t("company.leaves.balances.adjust")}
				</Button>
			</div>

			{/* Table */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<Table className="table-fixed w-full">
					<TableHeader>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-transparent">
							<TableHead className="text-right text-slate-500 dark:text-slate-400">{t("company.leaves.balances.employee")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400">{t("company.leaves.balances.leaveType")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400">{t("company.leaves.balances.total")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400">{t("company.leaves.balances.used")}</TableHead>
							<TableHead className="text-right text-slate-500 dark:text-slate-400">{t("company.leaves.balances.remaining")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							[...Array(5)].map((_, i) => (
								<TableRow key={i} className="border-white/10 dark:border-slate-700/30">
									{[...Array(5)].map((_, j) => (
										<TableCell key={j}>
											<div className="h-4 animate-pulse rounded bg-muted" />
										</TableCell>
									))}
								</TableRow>
							))
						) : balances?.balances?.length ? (
							balances.balances.map((bal, index) => (
								<TableRow
									key={bal.id}
									className="border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
									style={{ animationDelay: `${index * 30}ms` }}
								>
									<TableCell className="text-right">
										<div>
											<p className="font-medium text-slate-900 dark:text-slate-100">{bal.employee.name}</p>
											{bal.employee.employeeNo && <p className="text-xs text-slate-400">{bal.employee.employeeNo}</p>}
										</div>
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center gap-2">
											{bal.leaveType.color && (
												<div className="w-3 h-3 rounded-full" style={{ backgroundColor: bal.leaveType.color }} />
											)}
											<span className="text-sm text-slate-700 dark:text-slate-300">{bal.leaveType.name}</span>
										</div>
									</TableCell>
									<TableCell className="text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
										{bal.totalDays} {t("company.leaves.days")}
									</TableCell>
									<TableCell className="text-right text-sm text-slate-600 dark:text-slate-300">
										{bal.usedDays} {t("company.leaves.days")}
									</TableCell>
									<TableCell className="text-right">
										<Badge className={`border-0 text-[10px] px-2 py-0.5 ${
											bal.remainingDays <= 3
												? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
												: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
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
										<div className="mb-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 backdrop-blur-xl p-5">
											<Wallet className="h-10 w-10 text-slate-400 dark:text-slate-500" />
										</div>
										<p className="text-sm text-slate-500 dark:text-slate-400">
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
				<DialogContent className="rounded-2xl" dir="rtl">
					<DialogHeader>
						<DialogTitle>{t("company.leaves.balances.adjustTitle")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>{t("company.leaves.balances.employee")}</Label>
							<Select value={adjustData.employeeId} onValueChange={(v) => setAdjustData((p) => ({ ...p, employeeId: v }))}>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("company.leaves.requests.selectEmployee")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{employees?.employees?.map((emp) => (
										<SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("company.leaves.balances.leaveType")}</Label>
							<Select value={adjustData.leaveTypeId} onValueChange={(v) => setAdjustData((p) => ({ ...p, leaveTypeId: v }))}>
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
								onChange={(e) => setAdjustData((p) => ({ ...p, totalDays: Number(e.target.value) }))}
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
