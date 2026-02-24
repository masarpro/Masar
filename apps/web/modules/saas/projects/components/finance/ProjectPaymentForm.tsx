"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Badge } from "@ui/components/badge";
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
	TrendingUp,
	Loader2,
	Banknote,
	ArrowRight,
} from "lucide-react";

interface ProjectPaymentFormProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
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
	return new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

export function ProjectPaymentForm({
	organizationId,
	organizationSlug,
	projectId,
	redirectPath,
}: ProjectPaymentFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const urlTermId = searchParams.get("termId");

	// Fetch payment terms progress to get term info
	const { data: termsData, isLoading: termsLoading } = useQuery(
		orpc.projectContract.getPaymentTermsProgress.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	// Selected term ID: from URL or auto-select nextIncompleteTermId
	const [selectedTermId, setSelectedTermId] = useState<string | null>(urlTermId);
	const [autoSelected, setAutoSelected] = useState(false);

	// Auto-select next incomplete term when no URL param
	if (termsData && !selectedTermId && !autoSelected) {
		if (termsData.nextIncompleteTermId) {
			setSelectedTermId(termsData.nextIncompleteTermId);
		}
		setAutoSelected(true);
	}

	// Find the selected term
	const selectedTerm = useMemo(() => {
		if (!termsData || !selectedTermId) return null;
		return termsData.terms.find((t) => t.id === selectedTermId) ?? null;
	}, [termsData, selectedTermId]);

	// Form state - pre-fill amount from remaining
	const [formData, setFormData] = useState({
		amount: "",
		date: new Date().toISOString().split("T")[0],
		destinationAccountId: "",
		clientName: "",
		paymentMethod: "CASH" as (typeof PAYMENT_METHODS)[number],
		referenceNo: "",
		description: "",
		notes: "",
	});

	// Auto-fill amount when term data loads
	const [amountFilled, setAmountFilled] = useState(false);
	if (selectedTerm && !amountFilled && !formData.amount) {
		setFormData((prev) => ({
			...prev,
			amount: selectedTerm.remainingAmount.toString(),
			clientName: termsData?.clientName ?? "",
		}));
		setAmountFilled(true);
	}

	// Handle term change from selector
	const handleTermChange = (newTermId: string) => {
		setSelectedTermId(newTermId);
		const newTerm = termsData?.terms.find((t) => t.id === newTermId);
		if (newTerm) {
			setFormData((prev) => ({
				...prev,
				amount: newTerm.remainingAmount.toString(),
			}));
		}
	};

	// Fetch bank accounts
	const { data: accountsData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);

	const accounts = accountsData?.accounts ?? [];
	const selectedAccount = accounts.find(
		(a) => a.id === formData.destinationAccountId,
	);

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async () => {
			if (!formData.destinationAccountId) {
				throw new Error(
					t("finance.payments.errors.accountRequired"),
				);
			}
			if (!formData.amount || parseFloat(formData.amount) <= 0) {
				throw new Error(
					t("finance.payments.errors.amountRequired"),
				);
			}

			return orpcClient.finance.orgPayments.create({
				organizationId,
				amount: parseFloat(formData.amount),
				date: new Date(formData.date),
				destinationAccountId: formData.destinationAccountId,
				clientName: formData.clientName || undefined,
				projectId,
				contractTermId: selectedTermId || undefined,
				paymentMethod: formData.paymentMethod,
				referenceNo: formData.referenceNo || undefined,
				description: formData.description || undefined,
				notes: formData.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("projectPayments.createSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["finance"],
			});
			queryClient.invalidateQueries({
				queryKey:
					orpc.projectContract.getPaymentTermsProgress.queryOptions({
						input: { organizationId, projectId },
					}).queryKey,
			});
			router.push(redirectPath);
		},
		onError: (error: any) => {
			toast.error(
				error.message || t("projectPayments.createError"),
			);
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate();
	};

	if (termsLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Terms Overview Strip + Selector */}
			{termsData && termsData.terms.length > 0 && (
				<div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-700/30 dark:bg-slate-900/50">
					{/* Compact terms overview strip */}
					<div className="flex gap-1.5 overflow-x-auto border-b border-slate-200/50 p-3 dark:border-slate-700/30">
						{termsData.terms.map((term) => {
							const isActive = term.id === selectedTermId;
							const progressColor = term.isComplete
								? "bg-emerald-500"
								: term.id === termsData.nextIncompleteTermId
									? "bg-blue-500"
									: "bg-slate-300 dark:bg-slate-600";
							return (
								<button
									key={term.id}
									type="button"
									onClick={() => handleTermChange(term.id)}
									className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
										isActive
											? "bg-blue-100 text-blue-700 ring-1 ring-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-700"
											: "bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
									}`}
								>
									<div className={`h-2 w-2 rounded-full ${progressColor}`} />
									<span className="font-medium">
										{t(`projects.createProject.termTypes.${term.type}`)}
									</span>
									<span className="font-mono text-[10px] text-slate-400">
										{term.progressPercent.toFixed(0)}%
									</span>
								</button>
							);
						})}
					</div>

					{/* Term selector dropdown */}
					<div className="p-3">
						<Label className="mb-1.5 block text-xs font-medium text-slate-500">
							{t("projectPayments.payingForPhase")}
						</Label>
						<Select
							value={selectedTermId ?? ""}
							onValueChange={handleTermChange}
						>
							<SelectTrigger className="rounded-xl">
								<SelectValue placeholder={t("projectPayments.payingForPhase")} />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								{termsData.terms
									.filter((term) => !term.isComplete)
									.map((term) => (
										<SelectItem key={term.id} value={term.id}>
											<div className="flex items-center gap-2">
												<span>
													{t(`projects.createProject.termTypes.${term.type}`)}
												</span>
												{term.label && (
													<span className="text-slate-400">
														- {term.label}
													</span>
												)}
												<span className="font-mono text-xs text-slate-400">
													({formatCurrency(term.remainingAmount)} ر.س {t("projectPayments.remaining")})
												</span>
											</div>
										</SelectItem>
									))}
							</SelectContent>
						</Select>
					</div>
				</div>
			)}

			{/* Term Info Card */}
			{selectedTerm && (
				<div className="overflow-hidden rounded-2xl border border-blue-200/50 bg-blue-50/50 dark:border-blue-800/30 dark:bg-blue-950/20">
					<div className="p-5">
						<div className="mb-3 flex items-center gap-3">
							<div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/50">
								<Banknote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<h3 className="text-base font-medium text-blue-900 dark:text-blue-100">
									{t("projectPayments.payingForPhase")}
								</h3>
								<div className="mt-1 flex items-center gap-2">
									<Badge
										variant="outline"
										className="rounded-lg border-blue-200 bg-blue-50 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
									>
										{t(
											`projects.createProject.termTypes.${selectedTerm.type}`,
										)}
									</Badge>
									{selectedTerm.label && (
										<span className="text-sm text-slate-600 dark:text-slate-400">
											{selectedTerm.label}
										</span>
									)}
								</div>
							</div>
						</div>
						<div className="grid grid-cols-3 gap-3">
							<div className="rounded-xl bg-white/60 p-3 dark:bg-slate-900/30">
								<p className="text-xs text-slate-500">
									{t("projectPayments.required")}
								</p>
								<p className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
									{formatCurrency(selectedTerm.amount)}{" "}
									ر.س
								</p>
							</div>
							<div className="rounded-xl bg-white/60 p-3 dark:bg-slate-900/30">
								<p className="text-xs text-slate-500">
									{t("projectPayments.alreadyPaid")}
								</p>
								<p className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-300">
									{formatCurrency(
										selectedTerm.paidAmount,
									)}{" "}
									ر.س
								</p>
							</div>
							<div className="rounded-xl bg-blue-100/60 p-3 dark:bg-blue-900/30">
								<p className="text-xs text-slate-500">
									{t("projectPayments.remaining")}
								</p>
								<p className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">
									{formatCurrency(
										selectedTerm.remainingAmount,
									)}{" "}
									ر.س
								</p>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Amount & Date */}
			<div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-700/30 dark:bg-slate-900/50">
				<div className="border-b border-slate-200/50 p-5 dark:border-slate-700/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-900/50">
							<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						<h3 className="text-base font-medium text-slate-900 dark:text-slate-100">
							{t("projectPayments.paymentDetails")}
						</h3>
					</div>
				</div>
				<div className="space-y-5 p-5">
					<div className="grid gap-5 sm:grid-cols-2">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("finance.payments.amount")} *
							</Label>
							<div className="relative">
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.amount}
									onChange={(e) =>
										setFormData({
											...formData,
											amount: e.target.value,
										})
									}
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
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("finance.payments.date")} *
							</Label>
							<Input
								type="date"
								value={formData.date}
								onChange={(e) =>
									setFormData({
										...formData,
										date: e.target.value,
									})
								}
								className="rounded-xl"
								required
							/>
						</div>
					</div>

					{/* Client Name */}
					<div className="space-y-2">
						<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
							{t("finance.payments.clientName")}
						</Label>
						<Input
							value={formData.clientName}
							onChange={(e) =>
								setFormData({
									...formData,
									clientName: e.target.value,
								})
							}
							placeholder={t(
								"finance.payments.clientNamePlaceholder",
							)}
							className="rounded-xl"
						/>
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
							{t("finance.payments.description")}
						</Label>
						<Textarea
							value={formData.description}
							onChange={(e) =>
								setFormData({
									...formData,
									description: e.target.value,
								})
							}
							placeholder={t(
								"finance.payments.descriptionPlaceholder",
							)}
							className="rounded-xl"
							rows={2}
						/>
					</div>
				</div>
			</div>

			{/* Destination Account */}
			<div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-700/30 dark:bg-slate-900/50">
				<div className="border-b border-slate-200/50 p-5 dark:border-slate-700/30">
					<div className="flex items-center gap-3">
						<div className="rounded-xl bg-blue-100 p-2.5 dark:bg-blue-900/50">
							<Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<h3 className="text-base font-medium text-slate-900 dark:text-slate-100">
							{t("finance.payments.destinationAccount")}
						</h3>
					</div>
				</div>
				<div className="space-y-5 p-5">
					<div className="space-y-2">
						<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
							{t("finance.payments.selectAccount")} *
						</Label>
						<Select
							value={formData.destinationAccountId}
							onValueChange={(value) =>
								setFormData({
									...formData,
									destinationAccountId: value,
								})
							}
						>
							<SelectTrigger className="rounded-xl">
								<SelectValue
									placeholder={t(
										"finance.payments.selectAccountPlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								{accounts.map((account) => (
									<SelectItem
										key={account.id}
										value={account.id}
									>
										<div className="flex items-center gap-2">
											{account.accountType ===
											"BANK" ? (
												<Building className="h-4 w-4 text-blue-500" />
											) : (
												<Wallet className="h-4 w-4 text-green-500" />
											)}
											<span>{account.name}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{selectedAccount && (
						<div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{selectedAccount.accountType ===
									"BANK" ? (
										<Building className="h-5 w-5 text-blue-500" />
									) : (
										<Wallet className="h-5 w-5 text-green-500" />
									)}
									<div>
										<p className="font-medium">
											{selectedAccount.name}
										</p>
										{selectedAccount.bankName && (
											<p className="text-sm text-slate-500">
												{selectedAccount.bankName}
											</p>
										)}
									</div>
								</div>
								<div className="text-left">
									<p className="text-sm text-slate-500">
										{t(
											"finance.banks.currentBalance",
										)}
									</p>
									<p className="font-mono font-semibold text-green-600">
										{formatCurrency(
											Number(
												selectedAccount.balance,
											),
										)}{" "}
										ر.س
									</p>
									{formData.amount && (
										<p className="flex items-center gap-1 text-xs text-slate-500">
											<ArrowRight className="h-3 w-3" />
											{formatCurrency(
												Number(
													selectedAccount.balance,
												) +
													parseFloat(
														formData.amount ||
															"0",
													),
											)}{" "}
											ر.س
										</p>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Payment Method & Reference */}
					<div className="grid gap-5 sm:grid-cols-2">
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("finance.payments.paymentMethod")}
							</Label>
							<Select
								value={formData.paymentMethod}
								onValueChange={(value) =>
									setFormData({
										...formData,
										paymentMethod: value as any,
									})
								}
							>
								<SelectTrigger className="rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{PAYMENT_METHODS.map((method) => (
										<SelectItem
											key={method}
											value={method}
										>
											{t(
												`finance.payments.methods.${method.toLowerCase()}`,
											)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
								{t("finance.payments.referenceNo")}
							</Label>
							<Input
								value={formData.referenceNo}
								onChange={(e) =>
									setFormData({
										...formData,
										referenceNo: e.target.value,
									})
								}
								placeholder={t(
									"finance.payments.referenceNoPlaceholder",
								)}
								className="rounded-xl"
								dir="ltr"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Notes */}
			<div className="overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-700/30 dark:bg-slate-900/50">
				<div className="p-5">
					<div className="space-y-2">
						<Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
							{t("finance.payments.additionalNotes")}
						</Label>
						<Textarea
							value={formData.notes}
							onChange={(e) =>
								setFormData({
									...formData,
									notes: e.target.value,
								})
							}
							placeholder={t(
								"finance.payments.notesPlaceholder",
							)}
							className="rounded-xl"
							rows={3}
						/>
					</div>
				</div>
			</div>

			{/* Actions */}
			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.back()}
					className="rounded-xl"
				>
					{t("common.cancel")}
				</Button>
				<Button
					type="submit"
					disabled={createMutation.isPending}
					className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
				>
					{createMutation.isPending ? (
						<>
							<Loader2 className="ml-2 h-4 w-4 animate-spin" />
							{t("common.saving")}
						</>
					) : (
						<>
							<Save className="ml-2 h-4 w-4" />
							{t("projectPayments.createPayment")}
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
