"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrencySuffixed } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { DetailPageSkeleton } from "@saas/shared/components/skeletons";
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
			queryClient.invalidateQueries({ queryKey: orpc.finance.key() });
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
		return <DetailPageSkeleton />;
	}

	if (!expense) return null;

	const formatCurrency = (amount: number | string) =>
		formatCurrencySuffixed(Number(amount), t("common.sar"), 0);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-bold text-card-foreground">{expense.name}</h2>
					<div className="flex items-center gap-2 mt-1">
						<Badge className="bg-chart-4/15 text-chart-4 border-0 text-[10px] px-2 py-0.5">
							{t(`company.expenses.categories.${expense.category}`)}
						</Badge>
						<Badge className={`border-0 text-[10px] px-2 py-0.5 ${expense.isActive ? "bg-chart-4/15 text-chart-4" : "bg-muted text-muted-foreground"}`}>
							{expense.isActive ? t("company.common.active") : t("company.common.inactive")}
						</Badge>
					</div>
				</div>
				<Button
					variant="outline"
					className="rounded-lg"
					onClick={() => router.push(`/app/${organizationSlug}/company/expenses/${expenseId}/edit`)}
				>
					<Pencil className="ms-2 h-4 w-4" />
					{t("company.common.edit")}
				</Button>
			</div>

			{/* Info Card */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center gap-3 p-5 border-b-2">
					<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<Receipt className="h-5 w-5 text-chart-4" />
					</div>
					<h3 className="text-sm font-semibold text-card-foreground">
						{t("company.expenses.basicInfo")}
					</h3>
				</div>
				<div className="p-5">
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
						<div>
							<p className="text-xs text-muted-foreground">{t("company.expenses.amount")}</p>
							<p className="text-lg font-bold text-chart-4">{formatCurrency(Number(expense.amount))}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">{t("company.expenses.recurrence")}</p>
							<p className="font-medium text-card-foreground">{t(`company.expenses.recurrences.${expense.recurrence}`)}</p>
						</div>
						{expense.vendor && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.expenses.vendor")}</p>
								<p className="font-medium text-card-foreground">{expense.vendor}</p>
							</div>
						)}
						{expense.contractNumber && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.expenses.contractNumber")}</p>
								<p className="font-medium text-card-foreground">{expense.contractNumber}</p>
							</div>
						)}
						<div>
							<p className="text-xs text-muted-foreground">{t("company.expenses.startDate")}</p>
							<p className="font-medium text-card-foreground">{new Date(expense.startDate).toLocaleDateString("ar-SA")}</p>
						</div>
						{expense.endDate && (
							<div>
								<p className="text-xs text-muted-foreground">{t("company.expenses.endDate")}</p>
								<p className="font-medium text-card-foreground">{new Date(expense.endDate).toLocaleDateString("ar-SA")}</p>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Payments */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center justify-between p-5 border-b-2">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Banknote className="h-5 w-5 text-chart-4" />
						</div>
						<h3 className="text-sm font-semibold text-card-foreground">
							{t("company.expenses.paymentHistory")}
						</h3>
					</div>
					<Button
						size="sm"
						variant="outline"
						className="rounded-lg"
						onClick={() => generatePaymentsMutation.mutate()}
						disabled={generatePaymentsMutation.isPending}
					>
						<RefreshCw className="ms-1 h-4 w-4" />
						{t("company.expenses.generatePayments")}
					</Button>
				</div>
				<Table>
					<TableHeader>
						<TableRow className="border-b-2 hover:bg-transparent">
							<TableHead className="text-muted-foreground">{t("company.expenses.period")}</TableHead>
							<TableHead className="text-muted-foreground">{t("company.expenses.amount")}</TableHead>
							<TableHead className="text-muted-foreground">{t("company.expenses.dueDate")}</TableHead>
							<TableHead className="text-muted-foreground">{t("company.expenses.paymentStatus")}</TableHead>
							<TableHead className="text-muted-foreground">{t("company.common.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{expense.payments?.length ? (
							expense.payments.map((payment: any) => (
								<TableRow key={payment.id} className="border-b-2 hover:bg-accent">
									<TableCell className="text-card-foreground">
										{new Date(payment.periodStart).toLocaleDateString("ar-SA")} -{" "}
										{new Date(payment.periodEnd).toLocaleDateString("ar-SA")}
									</TableCell>
									<TableCell className="font-semibold text-card-foreground">{formatCurrency(Number(payment.amount))}</TableCell>
									<TableCell className="text-card-foreground">{new Date(payment.dueDate).toLocaleDateString("ar-SA")}</TableCell>
									<TableCell>
										{payment.isPaid ? (
											<Badge className="bg-chart-4/15 text-chart-4 border-0 text-[10px] px-2 py-0.5">
												{t("company.expenses.paid")}
											</Badge>
										) : (
											<Badge className="bg-destructive/15 text-destructive border-0 text-[10px] px-2 py-0.5">
												{t("company.expenses.unpaid")}
											</Badge>
										)}
									</TableCell>
									<TableCell>
										{!payment.isPaid ? (
											<Button
												size="sm"
												variant="ghost"
												className="rounded-xl hover:bg-chart-4/15"
												onClick={() => setMarkPaidPaymentId(payment.id)}
											>
												<CheckCircle className="ms-1 h-4 w-4 text-chart-4" />
												{t("company.expenses.markPaid")}
											</Button>
										) : payment.financeExpenseId ? (
											<Button
												size="sm"
												variant="ghost"
												className="rounded-xl hover:bg-chart-4/15"
												onClick={() => router.push(`/app/${organizationSlug}/finance/expenses/${payment.financeExpenseId}`)}
											>
												<ExternalLink className="ms-1 h-4 w-4 text-chart-4" />
												{t("company.expenses.viewInFinance")}
											</Button>
										) : null}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
									{t("company.expenses.noPayments")}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Allocations */}
			<div className="bg-card border-2 rounded-2xl overflow-hidden">
				<div className="flex items-center justify-between p-5 border-b-2">
					<div className="flex items-center gap-3">
						<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
							<Briefcase className="h-5 w-5 text-chart-4" />
						</div>
						<h3 className="text-sm font-semibold text-card-foreground">
							{t("company.expenses.projectAllocations")}
						</h3>
					</div>
					<Button
						size="sm"
						variant="outline"
						className="rounded-lg"
						onClick={() => setShowAllocationForm(!showAllocationForm)}
					>
						<Plus className="ms-1 h-4 w-4" />
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
							{expense.allocations.map((allocation: any) => (
								<div key={allocation.id} className="flex items-center justify-between rounded-xl border-2 bg-muted/50 p-3">
									<div>
										<p className="font-medium text-card-foreground">{allocation.project.name}</p>
										<p className="text-sm text-muted-foreground">
											{Number(allocation.percentage)}% = {formatCurrency(Number(expense.amount) * Number(allocation.percentage) / 100)}
										</p>
									</div>
								</div>
							))}
						</div>
					) : (
						<p className="text-center text-sm text-muted-foreground py-4">
							{t("company.expenses.noAllocations")}
						</p>
					)}
				</div>
			</div>

			{/* Mark Paid Dialog - select bank account */}
			<Dialog open={!!markPaidPaymentId} onOpenChange={(open: any) => { if (!open) { setMarkPaidPaymentId(null); setSelectedBankAccountId(""); } }}>
				<DialogContent className="rounded-2xl">
					<DialogHeader>
						<DialogTitle className="text-end">{t("company.expenses.selectBankAccount")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div>
							<Label>{t("company.expenses.bankAccount")} *</Label>
							<Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("company.expenses.selectBankAccountPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{bankAccounts.map((account: any) => (
										<SelectItem key={account.id} value={account.id}>
											<div className="flex items-center gap-2">
												<Building className="h-4 w-4 text-chart-4" />
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
		<div className="mb-4 space-y-3 rounded-xl border-2 bg-muted/50 p-3">
			{allocations.map((a, i) => (
				<div key={i} className="flex items-end gap-3">
					<div className="flex-1">
						<Select value={a.projectId} onValueChange={(v: any) => updateRow(i, "projectId", v)}>
							<SelectTrigger className="rounded-lg border border-input bg-card">
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
							onChange={(e: any) => updateRow(i, "percentage", e.target.value)}
							className="rounded-lg border border-input bg-card"
						/>
					</div>
					<Button size="icon" variant="ghost" className="rounded-xl hover:bg-destructive/10" aria-label={t("company.expenses.deleteItem")} onClick={() => removeRow(i)}>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</div>
			))}

			<div className="flex items-center justify-between pt-2">
				<div className="flex gap-2">
					<Button size="sm" variant="outline" className="rounded-xl" onClick={addRow}>
						<Plus className="ms-1 h-4 w-4" /> {t("company.common.add")}
					</Button>
					<Button
						size="sm"
						className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
						onClick={() => onSave(allocations.filter((a) => a.projectId).map((a) => ({ projectId: a.projectId, percentage: Number(a.percentage) })))}
						disabled={isPending || total > 100}
					>
						{t("company.common.save")}
					</Button>
				</div>
				<span className={`text-sm font-medium ${total > 100 ? "text-destructive" : "text-muted-foreground"}`}>
					{t("company.expenses.totalAllocation")}: {total}%
				</span>
			</div>
		</div>
	);
}
