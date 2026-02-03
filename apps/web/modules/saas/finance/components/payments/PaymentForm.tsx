"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import { Save, Building, Wallet, TrendingUp, User, FileText } from "lucide-react";
import { Currency } from "../shared/Currency";

interface PaymentFormProps {
	organizationId: string;
	organizationSlug: string;
	defaultClientId?: string;
	defaultProjectId?: string;
	defaultInvoiceId?: string;
}

const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

export function PaymentForm({
	organizationId,
	organizationSlug,
	defaultClientId,
	defaultProjectId,
	defaultInvoiceId,
}: PaymentFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	// Form state
	const [formData, setFormData] = useState({
		amount: "",
		date: new Date().toISOString().split("T")[0],
		destinationAccountId: "",
		clientId: defaultClientId || "",
		clientName: "",
		projectId: defaultProjectId || "",
		invoiceId: defaultInvoiceId || "",
		paymentMethod: "CASH" as typeof PAYMENT_METHODS[number],
		referenceNo: "",
		description: "",
		notes: "",
	});

	// Fetch bank accounts
	const { data: accountsData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);

	// Fetch clients
	const { data: clientsData } = useQuery(
		orpc.finance.clients.list.queryOptions({
			input: { organizationId },
		}),
	);

	// Fetch projects
	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
	);

	// Fetch invoices (unpaid)
	const { data: invoicesData } = useQuery(
		orpc.finance.invoices.list.queryOptions({
			input: { organizationId, status: "SENT" },
		}),
	);

	const accounts = accountsData?.accounts ?? [];
	const clients = clientsData?.clients ?? [];
	const projects = projectsData?.projects ?? [];
	const invoices = invoicesData?.invoices ?? [];

	// Selected account
	const selectedAccount = accounts.find((a) => a.id === formData.destinationAccountId);
	const selectedClient = clients.find((c) => c.id === formData.clientId);

	// Create mutation
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
			queryClient.invalidateQueries({ queryKey: ["finance", "orgPayments"] });
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
			router.push(`/app/${organizationSlug}/finance/payments`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.payments.createError"));
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate();
	};

	const getPaymentMethodLabel = (method: string) => {
		return t(`finance.payments.methods.${method.toLowerCase()}`);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Basic Info */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						{t("finance.payments.basicInfo")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Amount & Date */}
					<div className="grid gap-6 sm:grid-cols-2">
						<div>
							<Label>{t("finance.payments.amount")} *</Label>
							<Input
								type="number"
								step="0.01"
								min="0"
								value={formData.amount}
								onChange={(e) =>
									setFormData({ ...formData, amount: e.target.value })
								}
								placeholder="0.00"
								className="rounded-xl mt-1"
								dir="ltr"
								required
							/>
						</div>
						<div>
							<Label>{t("finance.payments.date")} *</Label>
							<Input
								type="date"
								value={formData.date}
								onChange={(e) =>
									setFormData({ ...formData, date: e.target.value })
								}
								className="rounded-xl mt-1"
								required
							/>
						</div>
					</div>

					{/* Description */}
					<div>
						<Label>{t("finance.payments.description")}</Label>
						<Textarea
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							placeholder={t("finance.payments.descriptionPlaceholder")}
							className="rounded-xl mt-1"
							rows={2}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Client Info */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						{t("finance.payments.clientInfo")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<Label>{t("finance.payments.selectClient")}</Label>
						<Select
							value={formData.clientId || "manual"}
							onValueChange={(value) =>
								setFormData({
									...formData,
									clientId: value === "manual" ? "" : value,
									clientName: value === "manual" ? formData.clientName : ""
								})
							}
						>
							<SelectTrigger className="rounded-xl mt-1">
								<SelectValue placeholder={t("finance.payments.selectClientPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="manual">{t("finance.payments.manualEntry")}</SelectItem>
								{clients.map((client) => (
									<SelectItem key={client.id} value={client.id}>
										{client.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{!formData.clientId && (
						<div>
							<Label>{t("finance.payments.clientName")} *</Label>
							<Input
								value={formData.clientName}
								onChange={(e) =>
									setFormData({ ...formData, clientName: e.target.value })
								}
								placeholder={t("finance.payments.clientNamePlaceholder")}
								className="rounded-xl mt-1"
							/>
						</div>
					)}

					{selectedClient && (
						<div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
							<div className="flex items-center gap-2">
								<User className="h-5 w-5 text-primary" />
								<div>
									<p className="font-medium">{selectedClient.name}</p>
									{selectedClient.email && (
										<p className="text-sm text-slate-500">{selectedClient.email}</p>
									)}
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Destination Account */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Building className="h-5 w-5" />
						{t("finance.payments.destinationAccount")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<Label>{t("finance.payments.selectAccount")} *</Label>
						<Select
							value={formData.destinationAccountId}
							onValueChange={(value) =>
								setFormData({ ...formData, destinationAccountId: value })
							}
						>
							<SelectTrigger className="rounded-xl mt-1">
								<SelectValue placeholder={t("finance.payments.selectAccountPlaceholder")} />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								{accounts.map((account) => (
									<SelectItem key={account.id} value={account.id}>
										<div className="flex items-center gap-2">
											{account.accountType === "BANK" ? (
												<Building className="h-4 w-4 text-blue-500" />
											) : (
												<Wallet className="h-4 w-4 text-green-500" />
											)}
											<span>{account.name}</span>
											<span className="text-slate-400">
												(<Currency amount={Number(account.balance)} />)
											</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{selectedAccount && (
						<div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{selectedAccount.accountType === "BANK" ? (
										<Building className="h-5 w-5 text-blue-500" />
									) : (
										<Wallet className="h-5 w-5 text-green-500" />
									)}
									<div>
										<p className="font-medium">{selectedAccount.name}</p>
										{selectedAccount.bankName && (
											<p className="text-sm text-slate-500">{selectedAccount.bankName}</p>
										)}
									</div>
								</div>
								<div className="text-end">
									<p className="text-sm text-slate-500">{t("finance.banks.currentBalance")}</p>
									<p className="font-semibold text-green-600">
										<Currency amount={Number(selectedAccount.balance)} />
									</p>
									{formData.amount && (
										<p className="text-xs text-slate-500">
											{t("finance.payments.afterPayment")}:{" "}
											<Currency amount={Number(selectedAccount.balance) + parseFloat(formData.amount || "0")} />
										</p>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Payment Method */}
					<div className="grid gap-6 sm:grid-cols-2">
						<div>
							<Label>{t("finance.payments.paymentMethod")}</Label>
							<Select
								value={formData.paymentMethod}
								onValueChange={(value) =>
									setFormData({ ...formData, paymentMethod: value as any })
								}
							>
								<SelectTrigger className="rounded-xl mt-1">
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
						<div>
							<Label>{t("finance.payments.referenceNo")}</Label>
							<Input
								value={formData.referenceNo}
								onChange={(e) =>
									setFormData({ ...formData, referenceNo: e.target.value })
								}
								placeholder={t("finance.payments.referenceNoPlaceholder")}
								className="rounded-xl mt-1"
								dir="ltr"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Project & Invoice Link */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						{t("finance.payments.linkToProject")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-6 sm:grid-cols-2">
						<div>
							<Label>{t("finance.payments.selectProject")}</Label>
							<Select
								value={formData.projectId || "none"}
								onValueChange={(value) =>
									setFormData({ ...formData, projectId: value === "none" ? "" : value })
								}
							>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("finance.payments.selectProjectPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="none">{t("finance.payments.noProject")}</SelectItem>
									{projects.map((project) => (
										<SelectItem key={project.id} value={project.id}>
											{project.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("finance.payments.selectInvoice")}</Label>
							<Select
								value={formData.invoiceId || "none"}
								onValueChange={(value) =>
									setFormData({ ...formData, invoiceId: value === "none" ? "" : value })
								}
							>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("finance.payments.selectInvoicePlaceholder")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="none">{t("finance.payments.noInvoice")}</SelectItem>
									{invoices.map((invoice) => (
										<SelectItem key={invoice.id} value={invoice.id}>
											<span className="inline-flex items-center gap-1">
												{invoice.invoiceNo} - <Currency amount={Number(invoice.totalAmount)} />
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<p className="text-sm text-slate-500">
						{t("finance.payments.projectLinkHint")}
					</p>
				</CardContent>
			</Card>

			{/* Notes */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.payments.additionalNotes")}</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						value={formData.notes}
						onChange={(e) =>
							setFormData({ ...formData, notes: e.target.value })
						}
						placeholder={t("finance.payments.notesPlaceholder")}
						className="rounded-xl"
						rows={3}
					/>
				</CardContent>
			</Card>

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
					className="rounded-xl"
				>
					{createMutation.isPending ? (
						t("common.saving")
					) : (
						<>
							<Save className="h-4 w-4 me-2" />
							{t("finance.payments.create")}
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
