"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@ui/components/dialog";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Button } from "@ui/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@ui/components/collapsible";
import { toast } from "sonner";
import {
	Save,
	Loader2,
	Building,
	Wallet,
	ArrowRight,
	User,
	FolderOpen,
	ChevronDown,
} from "lucide-react";
import { Currency } from "../shared/Currency";

const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

interface AddPaymentDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
	organizationSlug?: string;
	defaultClientId?: string;
	/** Fixed project context — hides project selector, always sends this projectId */
	defaultProjectId?: string;
	defaultInvoiceId?: string;
	/** Pre-fills destination account (user can still change) */
	defaultDestinationAccountId?: string;
	onSuccess?: () => void;
}

export function AddPaymentDialog({
	open,
	onOpenChange,
	organizationId,
	defaultClientId,
	defaultProjectId,
	defaultInvoiceId,
	defaultDestinationAccountId,
	onSuccess,
}: AddPaymentDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();
	const [advancedOpen, setAdvancedOpen] = useState(false);

	const buildInitialState = useCallback(
		() => ({
			amount: "",
			date: new Date().toISOString().split("T")[0],
			destinationAccountId: defaultDestinationAccountId || "",
			clientId: defaultClientId || "",
			clientName: "",
			projectId: defaultProjectId || "",
			invoiceId: defaultInvoiceId || "",
			paymentMethod: "CASH" as (typeof PAYMENT_METHODS)[number],
			referenceNo: "",
			description: "",
			notes: "",
		}),
		[
			defaultClientId,
			defaultProjectId,
			defaultInvoiceId,
			defaultDestinationAccountId,
		],
	);

	const [formData, setFormData] = useState(buildInitialState);

	// Reset form whenever the dialog (re)opens so context defaults apply
	useEffect(() => {
		if (open) {
			setFormData(buildInitialState());
			setAdvancedOpen(false);
		}
	}, [open, buildInitialState]);

	// Fetch bank accounts
	const { data: accountsData } = useQuery({
		...orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
		enabled: open,
	});

	// Fetch clients
	const { data: clientsData } = useQuery({
		...orpc.finance.clients.list.queryOptions({
			input: { organizationId },
		}),
		enabled: open,
	});

	// Fetch projects
	const { data: projectsData } = useQuery({
		...orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
		enabled: open && !defaultProjectId,
	});

	// Fetch invoices (unpaid)
	const { data: invoicesData } = useQuery({
		...orpc.finance.invoices.list.queryOptions({
			input: { organizationId, status: "SENT" },
		}),
		staleTime: STALE_TIMES.INVOICES,
		enabled: open,
	});

	const accounts = accountsData?.accounts ?? [];
	const clients = clientsData?.clients ?? [];
	const projects = projectsData?.projects ?? [];
	const invoices = invoicesData?.invoices ?? [];

	const selectedAccount = accounts.find(
		(a: any) => a.id === formData.destinationAccountId,
	);
	const numericAmount = Number.parseFloat(formData.amount) || 0;

	const createMutation = useMutation({
		mutationFn: async () => {
			if (!formData.destinationAccountId) {
				throw new Error(t("finance.payments.errors.accountRequired"));
			}
			if (!formData.amount || parseFloat(formData.amount) <= 0) {
				throw new Error(t("finance.payments.errors.amountRequired"));
			}
			if (!formData.clientId && !formData.clientName) {
				throw new Error(t("finance.payments.errors.clientRequired"));
			}
			if (!formData.projectId) {
				throw new Error(t("finance.payments.errors.projectRequired"));
			}

			return orpcClient.finance.orgPayments.create({
				organizationId,
				amount: parseFloat(formData.amount),
				date: new Date(formData.date),
				destinationAccountId: formData.destinationAccountId,
				clientId: formData.clientId || undefined,
				clientName: !formData.clientId ? formData.clientName : undefined,
				projectId: formData.projectId || undefined,
				invoiceId: formData.invoiceId || undefined,
				paymentMethod: formData.paymentMethod,
				referenceNo: formData.referenceNo || undefined,
				description: formData.description || undefined,
				notes: formData.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.payments.createSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["finance", "orgPayments"],
			});
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
			queryClient.invalidateQueries({
				queryKey: orpc.projectFinance.key(),
			});
			onSuccess?.();
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.payments.createError"));
		},
	});

	const getPaymentMethodLabel = (method: string) =>
		t(`finance.payments.methods.${method.toLowerCase()}`);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="sm:max-w-2xl p-0 gap-0 rounded-none sm:rounded-2xl overflow-hidden h-[100dvh] sm:h-auto sm:max-h-[90vh] flex flex-col w-full"
				onPointerDownOutside={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}
			>
				{/* Header */}
				<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 py-3 sm:py-4 shrink-0">
					<DialogTitle className="text-sm sm:text-base font-semibold">
						{t("finance.payments.new")}
					</DialogTitle>
				</DialogHeader>

				{/* Body — scrollable */}
				<div className="p-3 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
					{/* Row 1: Amount, Date */}
					<div className="grid grid-cols-2 gap-2 sm:gap-3">
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("finance.payments.amount")} *
							</Label>
							<Input
								type="number"
								step="0.01"
								min="0"
								value={formData.amount}
								onChange={(e: any) =>
									setFormData({
										...formData,
										amount: e.target.value,
									})
								}
								placeholder="0.00"
								className="rounded-xl text-base font-semibold h-10"
								dir="ltr"
								required
							/>
						</div>
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("finance.payments.date")} *
							</Label>
							<Input
								type="date"
								value={formData.date}
								onChange={(e: any) =>
									setFormData({
										...formData,
										date: e.target.value,
									})
								}
								className="rounded-xl h-10"
								required
							/>
						</div>
					</div>

					{/* Client */}
					<div className="space-y-1">
						<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
							<User className="h-3 w-3 inline me-1" />
							{t("finance.payments.selectClient")}
						</Label>
						<Select
							value={formData.clientId || "manual"}
							onValueChange={(value: any) =>
								setFormData({
									...formData,
									clientId: value === "manual" ? "" : value,
									clientName:
										value === "manual"
											? formData.clientName
											: "",
								})
							}
						>
							<SelectTrigger className="rounded-xl h-10">
								<SelectValue
									placeholder={t(
										"finance.payments.selectClientPlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="manual">
									{t("finance.payments.manualEntry")}
								</SelectItem>
								{clients.map((client: any) => (
									<SelectItem key={client.id} value={client.id}>
										{client.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{!formData.clientId && (
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
								{t("finance.payments.clientName")} *
							</Label>
							<Input
								value={formData.clientName}
								onChange={(e: any) =>
									setFormData({
										...formData,
										clientName: e.target.value,
									})
								}
								placeholder={t(
									"finance.payments.clientNamePlaceholder",
								)}
								className="rounded-xl h-10"
							/>
						</div>
					)}

					{/* Project — required */}
					{!defaultProjectId && (
						<div className="space-y-1">
							<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
								<FolderOpen className="h-3 w-3 inline me-1" />
								{t("finance.payments.selectProject")} *
							</Label>
							<Select
								value={formData.projectId || ""}
								onValueChange={(value: any) =>
									setFormData({
										...formData,
										projectId: value,
									})
								}
							>
								<SelectTrigger className="rounded-xl h-10">
									<SelectValue
										placeholder={t(
											"finance.payments.selectProjectPlaceholder",
										)}
									/>
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{projects.map((project: any) => (
										<SelectItem
											key={project.id}
											value={project.id}
										>
											{project.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* Destination account */}
					<div className="space-y-1">
						<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
							<Building className="h-3 w-3 inline me-1" />
							{t("finance.payments.selectAccount")} *
						</Label>
						<Select
							value={formData.destinationAccountId}
							onValueChange={(value: any) =>
								setFormData({
									...formData,
									destinationAccountId: value,
								})
							}
						>
							<SelectTrigger className="rounded-xl h-10">
								<SelectValue
									placeholder={t(
										"finance.payments.selectAccountPlaceholder",
									)}
								/>
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								{accounts.map((account: any) => (
									<SelectItem
										key={account.id}
										value={account.id}
									>
										<div className="flex items-center gap-2">
											{account.accountType === "BANK" ? (
												<Building className="h-3.5 w-3.5 text-blue-500" />
											) : (
												<Wallet className="h-3.5 w-3.5 text-green-500" />
											)}
											<span>{account.name}</span>
											<span className="text-slate-400 text-xs">
												(
												<Currency
													amount={Number(
														account.balance,
													)}
												/>
												)
											</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Selected account info — payment increases balance */}
					{selectedAccount && (
						<div className="rounded-xl border border-green-200/60 bg-green-50/40 dark:border-green-800/30 dark:bg-green-950/20 px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
							<div className="flex items-center gap-2.5 min-w-0">
								<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50 shrink-0">
									{selectedAccount.accountType === "BANK" ? (
										<Building className="h-3.5 w-3.5 text-blue-600" />
									) : (
										<Wallet className="h-3.5 w-3.5 text-green-600" />
									)}
								</div>
								<div className="min-w-0">
									<p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
										{selectedAccount.name}
									</p>
									{selectedAccount.bankName && (
										<p className="text-[11px] text-slate-500 truncate">
											{selectedAccount.bankName}
										</p>
									)}
								</div>
							</div>
							<div className="flex items-center gap-2 sm:gap-3 text-sm ps-9 sm:ps-0">
								<span className="font-semibold">
									<Currency
										amount={Number(selectedAccount.balance)}
									/>
								</span>
								{numericAmount > 0 && (
									<>
										<ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
										<span className="text-green-600 font-semibold">
											<Currency
												amount={
													Number(
														selectedAccount.balance,
													) + numericAmount
												}
											/>
										</span>
									</>
								)}
							</div>
						</div>
					)}

					{/* Description */}
					<div className="space-y-1">
						<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
							{t("finance.payments.description")}
						</Label>
						<Input
							value={formData.description}
							onChange={(e: any) =>
								setFormData({
									...formData,
									description: e.target.value,
								})
							}
							placeholder={t(
								"finance.payments.descriptionPlaceholder",
							)}
							className="rounded-xl h-10"
						/>
					</div>

					{/* Advanced */}
					<Collapsible
						open={advancedOpen}
						onOpenChange={setAdvancedOpen}
					>
						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors w-full"
							>
								<ChevronDown
									className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
								/>
								{t("finance.expenses.advanced")}
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent className="space-y-3 sm:space-y-4 pt-3">
							{/* Payment method, reference */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
								<div className="space-y-1">
									<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
										{t("finance.payments.paymentMethod")}
									</Label>
									<Select
										value={formData.paymentMethod}
										onValueChange={(value: any) =>
											setFormData({
												...formData,
												paymentMethod: value as any,
											})
										}
									>
										<SelectTrigger className="rounded-xl h-10">
											<SelectValue />
										</SelectTrigger>
										<SelectContent className="rounded-xl">
											{PAYMENT_METHODS.map((method) => (
												<SelectItem
													key={method}
													value={method}
												>
													{getPaymentMethodLabel(
														method,
													)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
										{t("finance.payments.referenceNo")}
									</Label>
									<Input
										value={formData.referenceNo}
										onChange={(e: any) =>
											setFormData({
												...formData,
												referenceNo: e.target.value,
											})
										}
										placeholder={t(
											"finance.payments.referenceNoPlaceholder",
										)}
										className="rounded-xl h-10"
										dir="ltr"
									/>
								</div>
							</div>

							{/* Invoice link */}
							<div className="grid grid-cols-1 gap-2 sm:gap-3">
								<div className="space-y-1">
									<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
										{t("finance.payments.selectInvoice")}
									</Label>
									<Select
										value={formData.invoiceId || "none"}
										onValueChange={(value: any) =>
											setFormData({
												...formData,
												invoiceId:
													value === "none"
														? ""
														: value,
											})
										}
									>
										<SelectTrigger className="rounded-xl h-10">
											<SelectValue
												placeholder={t(
													"finance.payments.selectInvoicePlaceholder",
												)}
											/>
										</SelectTrigger>
										<SelectContent className="rounded-xl">
											<SelectItem value="none">
												{t("finance.payments.noInvoice")}
											</SelectItem>
											{invoices.map((invoice: any) => (
												<SelectItem
													key={invoice.id}
													value={invoice.id}
												>
													<span className="inline-flex items-center gap-1">
														{invoice.invoiceNo} -{" "}
														<Currency
															amount={Number(
																invoice.totalAmount,
															)}
														/>
													</span>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Notes */}
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("finance.payments.additionalNotes")}
								</Label>
								<Textarea
									value={formData.notes}
									onChange={(e: any) =>
										setFormData({
											...formData,
											notes: e.target.value,
										})
									}
									placeholder={t(
										"finance.payments.notesPlaceholder",
									)}
									className="rounded-xl min-h-[88px] resize-none"
									rows={3}
								/>
							</div>
						</CollapsibleContent>
					</Collapsible>
				</div>

				{/* Footer */}
				<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-3 sm:px-5 py-3 flex gap-2 sm:gap-3 shrink-0">
					<Button
						type="button"
						variant="outline"
						className="flex-1 rounded-xl h-10"
						onClick={() => onOpenChange(false)}
						disabled={createMutation.isPending}
					>
						{t("common.cancel")}
					</Button>
					<Button
						type="button"
						className="flex-1 rounded-xl h-10"
						onClick={() => createMutation.mutate()}
						disabled={createMutation.isPending}
					>
						{createMutation.isPending ? (
							<>
								<Loader2 className="h-4 w-4 me-2 animate-spin" />
								{t("common.saving")}
							</>
						) : (
							<>
								<Save className="h-4 w-4 me-2" />
								{t("finance.payments.create")}
							</>
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
