"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import {
	Save,
	Building,
	Wallet,
	Loader2,
	Banknote,
	ArrowRight,
} from "lucide-react";

interface SubcontractPaymentFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	subcontractId: string;
	redirectPath: string;
}

const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

export function SubcontractPaymentForm({
	organizationId,
	organizationSlug,
	projectId,
	subcontractId,
	redirectPath,
}: SubcontractPaymentFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const preSelectedTermId = searchParams.get("termId");

	// Form state
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
	const [sourceAccountId, setSourceAccountId] = useState("");
	const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
	const [referenceNo, setReferenceNo] = useState("");
	const [description, setDescription] = useState("");
	const [notes, setNotes] = useState("");
	const [selectedTermId, setSelectedTermId] = useState(
		preSelectedTermId ?? "",
	);

	// Fetch contract for context
	const { data: contract } = useQuery(
		orpc.subcontracts.get.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
	);

	// Fetch payment terms progress
	const { data: termsProgress } = useQuery({
		...orpc.subcontracts.getPaymentTermsProgress.queryOptions({
			input: { organizationId, projectId, contractId: subcontractId },
		}),
		enabled: !!contract,
	});

	// Fetch bank accounts
	const { data: bankAccounts } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId },
		}),
	);

	// Auto-fill amount from selected term
	const selectedTerm = useMemo(() => {
		if (!selectedTermId || !termsProgress) return null;
		return termsProgress.terms.find((t) => t.id === selectedTermId);
	}, [selectedTermId, termsProgress]);

	// Auto-fill remaining when term changes
	useState(() => {
		if (selectedTerm && !amount) {
			setAmount(String(selectedTerm.remainingAmount));
		}
	});

	const accounts = bankAccounts?.accounts ?? [];

	const selectedAccount = useMemo(
		() => accounts.find((a) => a.id === sourceAccountId),
		[accounts, sourceAccountId],
	);

	const numericAmount = Number.parseFloat(amount) || 0;

	const createMutation = useMutation({
		...orpc.subcontracts.createPayment.mutationOptions(),
		onSuccess: () => {
			toast.success(t("subcontracts.notifications.paymentCreated"));
			queryClient.invalidateQueries({ queryKey: ["subcontracts"] });
			queryClient.invalidateQueries({ queryKey: ["finance"] });
			router.push(redirectPath);
		},
		onError: (error) => {
			toast.error(
				error.message ||
					t("subcontracts.notifications.paymentCreateError"),
			);
		},
	});

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!amount || numericAmount <= 0) {
			toast.error(t("subcontracts.validation.amountRequired"));
			return;
		}

		createMutation.mutate({
			organizationId,
			projectId,
			contractId: subcontractId,
			termId: selectedTermId || null,
			amount: numericAmount,
			date: new Date(date),
			sourceAccountId: sourceAccountId || null,
			paymentMethod:
				(paymentMethod as (typeof PAYMENT_METHODS)[number]) || null,
			referenceNo: referenceNo || null,
			description: description || null,
			notes: notes || null,
		});
	}

	return (
		<form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
			{/* Term Selection (if terms exist) */}
			{termsProgress && termsProgress.terms.length > 0 && (
				<div className="overflow-hidden rounded-2xl border border-violet-200/50 bg-white dark:border-violet-800/30 dark:bg-slate-900/50">
					<div className="flex items-center gap-3 border-b border-violet-200/50 p-5 dark:border-violet-800/30">
						<div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-900/50">
							<Banknote className="h-5 w-5 text-violet-600 dark:text-violet-400" />
						</div>
						<h2 className="font-semibold text-violet-700 dark:text-violet-300">
							{t("subcontracts.payment.selectTerm")}
						</h2>
					</div>
					<div className="p-5">
						<Select
							value={selectedTermId || "_none"}
							onValueChange={(v) => {
								const actualValue = v === "_none" ? "" : v;
								setSelectedTermId(actualValue);
								if (actualValue) {
									const term = termsProgress.terms.find(
										(tt) => tt.id === actualValue,
									);
									if (term) {
										setAmount(
											String(
												Math.max(0, term.remainingAmount),
											),
										);
									}
								}
							}}
						>
							<SelectTrigger className="rounded-xl">
								<SelectValue
									placeholder={t(
										"subcontracts.payment.selectTermPlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="_none">
									{t("subcontracts.payment.noTerm")}
								</SelectItem>
								{termsProgress.terms
									.filter((tt) => !tt.isComplete)
									.map((tt) => (
										<SelectItem key={tt.id} value={tt.id}>
											{tt.label || tt.type} -{" "}
											{t("subcontracts.payment.remaining")}:{" "}
											{formatCurrency(tt.remainingAmount)}
										</SelectItem>
									))}
							</SelectContent>
						</Select>

						{/* Term info card */}
						{selectedTerm && (
							<div className="mt-4 rounded-xl border border-blue-200/50 bg-blue-50/50 p-4 dark:border-blue-800/30 dark:bg-blue-950/20">
								<div className="grid grid-cols-3 gap-3 text-center text-xs">
									<div>
										<p className="text-blue-500">
											{t("subcontracts.payment.required")}
										</p>
										<p className="font-semibold text-blue-700 dark:text-blue-300">
											{formatCurrency(selectedTerm.amount)}
										</p>
									</div>
									<div>
										<p className="text-emerald-500">
											{t("subcontracts.payment.alreadyPaid")}
										</p>
										<p className="font-semibold text-emerald-700 dark:text-emerald-300">
											{formatCurrency(
												selectedTerm.paidAmount,
											)}
										</p>
									</div>
									<div>
										<p className="text-amber-500">
											{t(
												"subcontracts.payment.remainingAmount",
											)}
										</p>
										<p className="font-semibold text-amber-700 dark:text-amber-300">
											{formatCurrency(
												selectedTerm.remainingAmount,
											)}
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Amount & Date */}
			<div className="overflow-hidden rounded-2xl border border-orange-200/50 bg-white dark:border-orange-800/30 dark:bg-slate-900/50">
				<div className="flex items-center gap-3 border-b border-orange-200/50 p-5 dark:border-orange-800/30">
					<div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/50">
						<Wallet className="h-5 w-5 text-orange-600 dark:text-orange-400" />
					</div>
					<h2 className="font-semibold text-orange-700 dark:text-orange-300">
						{t("subcontracts.payment.amountAndDate")}
					</h2>
				</div>
				<div className="space-y-5 p-5">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>{t("subcontracts.payment.amount")}</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									placeholder="0.00"
									className="rounded-xl pl-12"
									dir="ltr"
									required
								/>
								<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
									ر.س
								</span>
							</div>
						</div>
						<div className="space-y-2">
							<Label>{t("subcontracts.payment.date")}</Label>
							<Input
								type="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
								className="rounded-xl"
								required
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Source Account */}
			<div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-700/30 dark:bg-slate-900/50">
				<div className="flex items-center gap-3 border-b border-slate-200/50 p-5 dark:border-slate-700/30">
					<div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
						<Building className="h-5 w-5 text-slate-600 dark:text-slate-400" />
					</div>
					<h2 className="font-semibold">
						{t("subcontracts.payment.sourceAccount")}
					</h2>
				</div>
				<div className="space-y-4 p-5">
					<Select
						value={sourceAccountId}
						onValueChange={setSourceAccountId}
					>
						<SelectTrigger className="rounded-xl">
							<SelectValue
								placeholder={t(
									"subcontracts.payment.selectAccount",
								)}
							/>
						</SelectTrigger>
						<SelectContent>
							{accounts
								.filter((a) => a.isActive)
								.map((account) => (
									<SelectItem
										key={account.id}
										value={account.id}
									>
										{account.name}
										{account.bankName &&
											` - ${account.bankName}`}
									</SelectItem>
								))}
						</SelectContent>
					</Select>

					{/* Selected account info */}
					{selectedAccount && (
						<div className="rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<div className="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/50">
										<Building className="h-4 w-4 text-orange-600" />
									</div>
									<div>
										<p className="text-sm font-medium">
											{selectedAccount.name}
										</p>
										{selectedAccount.bankName && (
											<p className="text-xs text-slate-500">
												{selectedAccount.bankName}
											</p>
										)}
									</div>
								</div>
								<div className="text-end">
									<p className="text-xs text-slate-500">
										{t("subcontracts.payment.currentBalance")}
									</p>
									<p className="font-semibold text-orange-700 dark:text-orange-300">
										{formatCurrency(
											Number(selectedAccount.balance),
										)}
									</p>
									{numericAmount > 0 && (
										<div className="mt-1 flex items-center justify-end gap-1 text-xs">
											<ArrowRight className="h-3 w-3 text-slate-400" />
											<span className="text-red-500">
												{formatCurrency(
													Number(
														selectedAccount.balance,
													) - numericAmount,
												)}
											</span>
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Payment Method & Reference */}
			<div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-700/30 dark:bg-slate-900/50">
				<div className="space-y-5 p-5">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>
								{t("subcontracts.payment.paymentMethod")}
							</Label>
							<Select
								value={paymentMethod}
								onValueChange={setPaymentMethod}
							>
								<SelectTrigger className="rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PAYMENT_METHODS.map((method) => (
										<SelectItem key={method} value={method}>
											{t(
												`subcontracts.paymentMethods.${method}`,
											)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>
								{t("subcontracts.payment.referenceNo")}
							</Label>
							<Input
								value={referenceNo}
								onChange={(e) =>
									setReferenceNo(e.target.value)
								}
								className="rounded-xl"
								dir="ltr"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>
							{t("subcontracts.payment.description")}
						</Label>
						<Input
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="rounded-xl"
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("subcontracts.payment.notes")}</Label>
						<Textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							className="min-h-16 rounded-xl"
						/>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="flex gap-3">
				<Button
					type="button"
					variant="outline"
					className="flex-1 rounded-xl"
					onClick={() => router.back()}
				>
					{t("common.cancel")}
				</Button>
				<Button
					type="submit"
					className="flex-1 rounded-xl"
					disabled={createMutation.isPending}
				>
					{createMutation.isPending ? (
						<>
							<Loader2 className="me-2 h-4 w-4 animate-spin" />
							{t("common.saving")}
						</>
					) : (
						<>
							<Save className="me-2 h-4 w-4" />
							{t("subcontracts.payment.submit")}
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
