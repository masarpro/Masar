"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Badge } from "@ui/components/badge";
import { Input } from "@ui/components/input";
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
import { Pencil, CheckCircle, Plus, Trash2, RefreshCw, Receipt, Banknote, Briefcase, Building, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Label } from "@ui/components/label";

interface ExpenseDetailProps {
	organizationId: string;
	organizationSlug: string;
	expenseId: string;
}

export function ExpenseDetail({ organizationId, organizationSlug, expenseId }: ExpenseDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [showAllocationForm, setShowAllocationForm] = useState(false);
	const [markPaidPaymentId, setMarkPaidPaymentId] = useState<string | null>(null);
	const [selectedBankAccountId, setSelectedBankAccountId] = useState("");

	const queryKey = orpc.company.expenses.getById.queryOptions({ input: { organizationId, id: expenseId } }).queryKey;

	const { data: expense, isLoading } = useQuery(
		orpc.company.expenses.getById.queryOptions({
			input: { organizationId, id: expenseId },
		}),
	);

	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId, status: "ACTIVE" },
		}),
	);

	const projectsList = projectsData?.projects;

	// Fetch bank accounts for payment
	const { data: accountsData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);
	const bankAccounts = accountsData?.accounts ?? [];

	const markPaidMutation = useMutation({
		mutationFn: async ({ paymentId, bankAccountId }: { paymentId: string; bankAccountId: string }) => {
			return orpcClient.company.expenses.payments.markPaid({
				organizationId,
				id: paymentId,
				bankAccountId,
			});
		},
		onSuccess: () => {
			toast.success(t("company.expenses.paymentMarkedPaid"));
			queryClient.invalidateQueries({ queryKey });
			queryClient.invalidateQueries({ queryKey: ["finance"] });
			setMarkPaidPaymentId(null);
			setSelectedBankAccountId("");
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const generatePaymentsMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.company.expenses.payments.generateMonthly({
				organizationId,
				expenseId,
				monthsAhead: 3,
			});
		},
		onSuccess: () => {
			toast.success(t("company.expenses.paymentsGenerated"));
			queryClient.invalidateQueries({ queryKey });
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const setAllocationsMutation = useMutation({
		mutationFn: async (allocations: Array<{ projectId: string; percentage: number }>) => {
			return orpcClient.company.expenses.allocations.set({
				organizationId,
				expenseId,
				allocations,
			});
		},
		onSuccess: () => {
			toast.success(t("company.expenses.allocationsUpdated"));
			queryClient.invalidateQueries({ queryKey });
			setShowAllocationForm(false);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	if (isLoading) {
		return (
			<div className="space-y-6" dir="rtl">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-6">
						<div className="h-24 animate-pulse rounded bg-muted" />
					</div>
				))}
			</div>
		);
	}

	if (!expense) return null;

	const formatCurrency = (amount: number | string) =>
		new Intl.NumberFormat("ar-SA").format(Number(amount)) + " ر.س";

	return (
		<div className="space-y-6" dir="rtl">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{expense.name}</h2>
					<div className="flex items-center gap-2 mt-1">
						<Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-0 text-[10px] px-2 py-0.5">
							{t(`company.expenses.categories.${expense.category}`)}
						</Badge>
						<Badge className={`border-0 text-[10px] px-2 py-0.5 ${expense.isActive ? "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400" : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"}`}>
							{expense.isActive ? t("company.common.active") : t("company.common.inactive")}
						</Badge>
					</div>
				</div>
				<Button
					variant="outline"
					className="rounded-xl border-white/20 dark:border-slate-700/30"
					onClick={() => router.push(`/app/${organizationSlug}/company/expenses/${expenseId}/edit`)}
				>
					<Pencil className="ml-2 h-4 w-4" />
					{t("company.common.edit")}
				</Button>
			</div>

			{/* Info Card */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
						<Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</div>
					<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
						{t("company.expenses.basicInfo")}
					</h3>
				</div>
				<div className="p-5">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.expenses.amount")}</p>
							<p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(expense.amount)}</p>
						</div>
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.expenses.recurrence")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{t(`company.expenses.recurrences.${expense.recurrence}`)}</p>
						</div>
						{expense.vendor && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.expenses.vendor")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{expense.vendor}</p>
							</div>
						)}
						{expense.contractNumber && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.expenses.contractNumber")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{expense.contractNumber}</p>
							</div>
						)}
						<div>
							<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.expenses.startDate")}</p>
							<p className="font-medium text-slate-900 dark:text-slate-100">{new Date(expense.startDate).toLocaleDateString("ar-SA")}</p>
						</div>
						{expense.endDate && (
							<div>
								<p className="text-xs text-slate-500 dark:text-slate-400">{t("company.expenses.endDate")}</p>
								<p className="font-medium text-slate-900 dark:text-slate-100">{new Date(expense.endDate).toLocaleDateString("ar-SA")}</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Payments */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center justify-between p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
							<Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{t("company.expenses.paymentHistory")}
						</h3>
					</div>
					<Button
						size="sm"
						variant="outline"
						className="rounded-xl border-white/20 dark:border-slate-700/30"
						onClick={() => generatePaymentsMutation.mutate()}
						disabled={generatePaymentsMutation.isPending}
					>
						<RefreshCw className="ml-1 h-4 w-4" />
						{t("company.expenses.generatePayments")}
					</Button>
				</div>
				<Table>
					<TableHeader>
						<TableRow className="border-white/10 dark:border-slate-700/30 hover:bg-transparent">
							<TableHead className="text-slate-500 dark:text-slate-400">{t("company.expenses.period")}</TableHead>
							<TableHead className="text-slate-500 dark:text-slate-400">{t("company.expenses.amount")}</TableHead>
							<TableHead className="text-slate-500 dark:text-slate-400">{t("company.expenses.dueDate")}</TableHead>
							<TableHead className="text-slate-500 dark:text-slate-400">{t("company.expenses.paymentStatus")}</TableHead>
							<TableHead className="text-slate-500 dark:text-slate-400">{t("company.common.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{expense.payments?.length ? (
							expense.payments.map((payment) => (
								<TableRow key={payment.id} className="border-white/10 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
									<TableCell className="text-slate-700 dark:text-slate-300">
										{new Date(payment.periodStart).toLocaleDateString("ar-SA")} -{" "}
										{new Date(payment.periodEnd).toLocaleDateString("ar-SA")}
									</TableCell>
									<TableCell className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(payment.amount)}</TableCell>
									<TableCell className="text-slate-700 dark:text-slate-300">{new Date(payment.dueDate).toLocaleDateString("ar-SA")}</TableCell>
									<TableCell>
										{payment.isPaid ? (
											<Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-0 text-[10px] px-2 py-0.5">
												{t("company.expenses.paid")}
											</Badge>
										) : (
											<Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-0 text-[10px] px-2 py-0.5">
												{t("company.expenses.unpaid")}
											</Badge>
										)}
									</TableCell>
									<TableCell>
										{!payment.isPaid ? (
											<Button
												size="sm"
												variant="ghost"
												className="rounded-xl hover:bg-teal-50 dark:hover:bg-teal-900/20"
												onClick={() => setMarkPaidPaymentId(payment.id)}
											>
												<CheckCircle className="ml-1 h-4 w-4 text-teal-600" />
												{t("company.expenses.markPaid")}
											</Button>
										) : payment.financeExpenseId ? (
											<Button
												size="sm"
												variant="ghost"
												className="rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20"
												onClick={() => router.push(`/app/${organizationSlug}/finance/expenses/${payment.financeExpenseId}`)}
											>
												<ExternalLink className="ml-1 h-4 w-4 text-blue-600" />
												{t("company.expenses.viewInFinance")}
											</Button>
										) : null}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400">
									{t("company.expenses.noPayments")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Allocations */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
				<div className="flex items-center justify-between p-5 border-b border-white/10 dark:border-slate-700/30">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
							<Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
						</div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{t("company.expenses.projectAllocations")}
						</h3>
					</div>
					<Button
						size="sm"
						variant="outline"
						className="rounded-xl border-white/20 dark:border-slate-700/30"
						onClick={() => setShowAllocationForm(!showAllocationForm)}
					>
						<Plus className="ml-1 h-4 w-4" />
						{t("company.expenses.manageAllocations")}
					</Button>
				</div>
				<div className="p-5">
					{showAllocationForm && (
						<AllocationForm
							expense={expense}
							projects={projectsList}
							onSave={(allocations) => setAllocationsMutation.mutate(allocations)}
							isPending={setAllocationsMutation.isPending}
							t={t}
						/>
					)}

					{expense.allocations?.length ? (
						<div className="space-y-2">
							{expense.allocations.map((allocation) => (
								<div key={allocation.id} className="flex items-center justify-between rounded-xl border border-white/20 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/20 p-3">
									<div>
										<p className="font-medium text-slate-900 dark:text-slate-100">{allocation.project.name}</p>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{Number(allocation.percentage)}% = {formatCurrency(Number(expense.amount) * Number(allocation.percentage) / 100)}
										</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">
							{t("company.expenses.noAllocations")}
						</p>
					)}
				</div>
			</div>

			{/* Mark Paid Dialog - select bank account */}
			<Dialog open={!!markPaidPaymentId} onOpenChange={(open) => { if (!open) { setMarkPaidPaymentId(null); setSelectedBankAccountId(""); } }}>
				<DialogContent className="rounded-2xl" dir="rtl">
					<DialogHeader>
						<DialogTitle className="text-right">{t("company.expenses.selectBankAccount")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div>
							<Label>{t("company.expenses.bankAccount")} *</Label>
							<Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("company.expenses.selectBankAccountPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{bankAccounts.map((account) => (
										<SelectItem key={account.id} value={account.id}>
											<div className="flex items-center gap-2">
												<Building className="h-4 w-4 text-blue-500" />
												<span>{account.name}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" className="rounded-xl" onClick={() => setMarkPaidPaymentId(null)}>
							{t("common.cancel")}
						</Button>
						<Button
							className="rounded-xl"
							disabled={!selectedBankAccountId || markPaidMutation.isPending}
							onClick={() => markPaidPaymentId && markPaidMutation.mutate({ paymentId: markPaidPaymentId, bankAccountId: selectedBankAccountId })}
						>
							{markPaidMutation.isPending ? t("common.saving") : t("company.expenses.markPaid")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// Sub-component for managing allocations
function AllocationForm({
	expense,
	projects,
	onSave,
	isPending,
	t,
}: {
	expense: { allocations?: Array<{ project: { id: string }; percentage: unknown }> };
	projects: { id: string; name: string }[] | undefined;
	onSave: (allocations: Array<{ projectId: string; percentage: number }>) => void;
	isPending: boolean;
	t: (key: string) => string;
}) {
	const [allocations, setAllocations] = useState<Array<{ projectId: string; percentage: string }>>(
		expense.allocations?.map((a) => ({
			projectId: a.project.id,
			percentage: String(Number(a.percentage)),
		})) ?? [],
	);

	const addRow = () => setAllocations([...allocations, { projectId: "", percentage: "0" }]);
	const removeRow = (index: number) => setAllocations(allocations.filter((_, i) => i !== index));
	const updateRow = (index: number, field: "projectId" | "percentage", value: string) => {
		const updated = [...allocations];
		updated[index] = { ...updated[index], [field]: value };
		setAllocations(updated);
	};

	const total = allocations.reduce((sum, a) => sum + Number(a.percentage), 0);

	return (
		<div className="mb-4 space-y-3 rounded-xl border border-white/20 dark:border-slate-700/30 bg-slate-50/50 dark:bg-slate-800/20 p-3">
			{allocations.map((a, i) => (
				<div key={i} className="flex items-end gap-3">
					<div className="flex-1">
						<Select value={a.projectId} onValueChange={(v) => updateRow(i, "projectId", v)}>
							<SelectTrigger className="rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70">
								<SelectValue placeholder={t("company.employees.selectProject")} />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								{projects?.map((p) => (
									<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="w-24">
						<Input
							type="number"
							min={0}
							max={100}
							value={a.percentage}
							onChange={(e) => updateRow(i, "percentage", e.target.value)}
							className="rounded-xl border-white/20 dark:border-slate-700/30 bg-white/70 dark:bg-slate-900/70"
						/>
					</div>
					<Button size="icon" variant="ghost" className="rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeRow(i)}>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</div>
			))}

			<div className="flex items-center justify-between pt-2">
				<div className="flex gap-2">
					<Button size="sm" variant="outline" className="rounded-xl" onClick={addRow}>
						<Plus className="ml-1 h-4 w-4" /> {t("company.common.add")}
					</Button>
					<Button
						size="sm"
						className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
						onClick={() => onSave(allocations.filter((a) => a.projectId).map((a) => ({ projectId: a.projectId, percentage: Number(a.percentage) })))}
						disabled={isPending || total > 100}
					>
						{t("company.common.save")}
					</Button>
				</div>
				<span className={`text-sm font-medium ${total > 100 ? "text-destructive" : "text-slate-500 dark:text-slate-400"}`}>
					{t("company.expenses.totalAllocation")}: {total}%
				</span>
			</div>
		</div>
	);
}
