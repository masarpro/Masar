"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import { Loader2, Building, Wallet, CreditCard, ArrowRight } from "lucide-react";
import { Currency } from "../shared/Currency";

interface PayExpenseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	expense: {
		id: string;
		expenseNo: string;
		amount: number | string;
		paidAmount: number | string;
		description?: string | null;
	} | null;
	organizationId: string;
}

const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

export function PayExpenseDialog({
	open,
	onOpenChange,
	expense,
	organizationId,
}: PayExpenseDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const totalAmount = Number(expense?.amount ?? 0);
	const paidAmount = Number(expense?.paidAmount ?? 0);
	const remaining = totalAmount - paidAmount;

	// Form state
	const [sourceAccountId, setSourceAccountId] = useState("");
	const [amount, setAmount] = useState("");
	const [paymentMethod, setPaymentMethod] = useState<(typeof PAYMENT_METHODS)[number]>("BANK_TRANSFER");
	const [referenceNo, setReferenceNo] = useState("");

	// Reset form when dialog opens with a new expense
	useEffect(() => {
		if (open && expense) {
			const rem = Number(expense.amount) - Number(expense.paidAmount);
			setAmount(rem > 0 ? rem.toString() : "");
			setSourceAccountId("");
			setPaymentMethod("BANK_TRANSFER");
			setReferenceNo("");
		}
	}, [open, expense]);

	// Fetch active bank accounts
	const { data: accountsData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);

	const accounts = accountsData?.accounts ?? [];
	const selectedAccount = accounts.find((a) => a.id === sourceAccountId);
	const numericAmount = Number.parseFloat(amount) || 0;

	// Pay mutation
	const payMutation = useMutation({
		mutationFn: async () => {
			if (!expense) throw new Error("No expense selected");
			if (!sourceAccountId) {
				throw new Error(t("finance.expenses.errors.accountRequired"));
			}
			if (!amount || numericAmount <= 0) {
				throw new Error(t("finance.expenses.errors.amountRequired"));
			}
			if (numericAmount > remaining) {
				throw new Error(t("finance.expenses.errors.amountExceedsRemaining"));
			}

			return orpcClient.finance.expenses.pay({
				organizationId,
				id: expense.id,
				sourceAccountId,
				amount: numericAmount,
				paymentMethod,
				referenceNo: referenceNo || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.expenses.paySuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "expenses"] });
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.expenses.payError"));
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		payMutation.mutate();
	};

	const getPaymentMethodLabel = (method: string) => {
		return t(`finance.payments.methods.${method.toLowerCase()}`);
	};

	if (!expense) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent dir="rtl" className="sm:max-w-lg p-0 gap-0 rounded-2xl overflow-hidden">
				{/* Header */}
				<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
					<DialogTitle className="text-base font-semibold text-right">
						{t("finance.expenses.payExpense")}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="p-5 space-y-4">
						{/* Expense Info */}
						<div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2">
							<div className="flex items-center justify-between">
								<span className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.expenses.expenseNo")}
								</span>
								<span className="text-sm font-semibold font-mono">
									{expense.expenseNo}
								</span>
							</div>
							{expense.description && (
								<div className="flex items-center justify-between">
									<span className="text-sm text-slate-500 dark:text-slate-400">
										{t("finance.expenses.description")}
									</span>
									<span className="text-sm line-clamp-1 max-w-[60%] text-end">
										{expense.description}
									</span>
								</div>
							)}
							<div className="flex items-center justify-between">
								<span className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.expenses.totalAmount")}
								</span>
								<span className="text-sm font-semibold">
									<Currency amount={totalAmount} />
								</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.expenses.alreadyPaid")}
								</span>
								<span className="text-sm font-semibold text-green-600 dark:text-green-400">
									<Currency amount={paidAmount} />
								</span>
							</div>
							<div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
								<span className="text-sm font-medium text-slate-700 dark:text-slate-300">
									{t("finance.expenses.remaining")}
								</span>
								<span className="text-base font-bold text-red-600 dark:text-red-400">
									<Currency amount={remaining} />
								</span>
							</div>
						</div>

						{/* Source Account */}
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("finance.expenses.selectAccount")} *
							</Label>
							<Select
								value={sourceAccountId}
								onValueChange={setSourceAccountId}
							>
								<SelectTrigger className="rounded-xl h-10">
									<SelectValue
										placeholder={t("finance.expenses.selectAccountPlaceholder")}
									/>
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{accounts.map((account) => (
										<SelectItem key={account.id} value={account.id}>
											<div className="flex items-center gap-2">
												{account.accountType === "BANK" ? (
													<Building className="h-3.5 w-3.5 text-blue-500" />
												) : (
													<Wallet className="h-3.5 w-3.5 text-green-500" />
												)}
												<span>{account.name}</span>
												<span className="text-slate-400 text-xs">
													(<Currency amount={Number(account.balance)} />)
												</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Selected account balance preview */}
						{selectedAccount && (
							<div className="rounded-xl border border-blue-200/60 bg-blue-50/40 dark:border-blue-800/30 dark:bg-blue-950/20 px-4 py-2.5 flex items-center justify-between">
								<div className="flex items-center gap-2.5">
									<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
										{selectedAccount.accountType === "BANK" ? (
											<Building className="h-3.5 w-3.5 text-blue-600" />
										) : (
											<Wallet className="h-3.5 w-3.5 text-green-600" />
										)}
									</div>
									<div>
										<p className="text-sm font-medium text-slate-900 dark:text-slate-100">
											{selectedAccount.name}
										</p>
										{selectedAccount.bankName && (
											<p className="text-[11px] text-slate-500">
												{selectedAccount.bankName}
											</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-3 text-sm">
									<span className="font-semibold">
										<Currency amount={Number(selectedAccount.balance)} />
									</span>
									{numericAmount > 0 && (
										<>
											<ArrowRight className="h-3.5 w-3.5 text-slate-400" />
											<span className="text-red-500 font-semibold">
												<Currency
													amount={Number(selectedAccount.balance) - numericAmount}
												/>
											</span>
										</>
									)}
								</div>
							</div>
						)}

						{/* Payment Amount */}
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("finance.expenses.paymentAmount")} *
							</Label>
							<Input
								type="number"
								step="0.01"
								min="0.01"
								max={remaining}
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								placeholder="0.00"
								className="rounded-xl h-10 text-base font-semibold"
								dir="ltr"
								required
							/>
							{numericAmount > 0 && numericAmount < remaining && (
								<p className="text-xs text-amber-600 dark:text-amber-400">
									{t("finance.expenses.partialPaymentNote")}
								</p>
							)}
						</div>

						{/* Payment Method & Reference */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.paymentMethod")}
								</Label>
								<Select
									value={paymentMethod}
									onValueChange={(value) =>
										setPaymentMethod(value as (typeof PAYMENT_METHODS)[number])
									}
								>
									<SelectTrigger className="rounded-xl h-10">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										{PAYMENT_METHODS.map((method) => (
											<SelectItem key={method} value={method}>
												{getPaymentMethodLabel(method)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.expenses.referenceNo")}
								</Label>
								<Input
									value={referenceNo}
									onChange={(e) => setReferenceNo(e.target.value)}
									placeholder={t("finance.expenses.referenceNoPlaceholder")}
									className="rounded-xl h-10"
									dir="ltr"
								/>
							</div>
						</div>
					</div>

					{/* Footer Actions */}
					<DialogFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex gap-3">
						<Button
							type="button"
							variant="outline"
							className="flex-1 rounded-xl h-10"
							onClick={() => onOpenChange(false)}
							disabled={payMutation.isPending}
						>
							{t("common.cancel")}
						</Button>
						<Button
							type="submit"
							className="flex-1 rounded-xl h-10"
							disabled={payMutation.isPending}
						>
							{payMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 me-2 animate-spin" />
									{t("common.saving")}
								</>
							) : (
								<>
									<CreditCard className="h-4 w-4 me-2" />
									{t("finance.expenses.payNow")}
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
