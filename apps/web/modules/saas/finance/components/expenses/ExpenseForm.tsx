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
import { Save, Building, Wallet, TrendingDown, Clock } from "lucide-react";
import { Currency } from "../shared/Currency";
import { Switch } from "@ui/components/switch";

interface ExpenseFormProps {
	organizationId: string;
	organizationSlug: string;
	defaultSourceAccountId?: string;
	defaultProjectId?: string;
	redirectPath?: string;
}

// فئات المصروفات
const EXPENSE_CATEGORIES = [
	"MATERIALS",
	"LABOR",
	"EQUIPMENT_RENTAL",
	"EQUIPMENT_PURCHASE",
	"SUBCONTRACTOR",
	"TRANSPORT",
	"SALARIES",
	"RENT",
	"UTILITIES",
	"COMMUNICATIONS",
	"INSURANCE",
	"LICENSES",
	"BANK_FEES",
	"FUEL",
	"MAINTENANCE",
	"SUPPLIES",
	"MARKETING",
	"TRAINING",
	"TRAVEL",
	"HOSPITALITY",
	"LOAN_PAYMENT",
	"TAXES",
	"ZAKAT",
	"REFUND",
	"MISC",
	"CUSTOM",
] as const;

const PAYMENT_METHODS = [
	"CASH",
	"BANK_TRANSFER",
	"CHEQUE",
	"CREDIT_CARD",
	"OTHER",
] as const;

export function ExpenseForm({
	organizationId,
	organizationSlug,
	defaultSourceAccountId,
	defaultProjectId,
	redirectPath,
}: ExpenseFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	// Form state
	const [isObligation, setIsObligation] = useState(false);
	const [formData, setFormData] = useState({
		category: "MISC" as typeof EXPENSE_CATEGORIES[number],
		customCategory: "",
		description: "",
		amount: "",
		date: new Date().toISOString().split("T")[0],
		dueDate: "",
		sourceAccountId: defaultSourceAccountId || "",
		vendorName: "",
		vendorTaxNumber: "",
		projectId: defaultProjectId || "",
		invoiceRef: "",
		paymentMethod: "BANK_TRANSFER" as typeof PAYMENT_METHODS[number],
		referenceNo: "",
		notes: "",
	});

	// Fetch bank accounts
	const { data: accountsData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);

	// Fetch projects
	const { data: projectsData } = useQuery(
		orpc.projects.list.queryOptions({
			input: { organizationId },
		}),
	);

	const accounts = accountsData?.accounts ?? [];
	const projects = projectsData?.projects ?? [];

	// Selected account
	const selectedAccount = accounts.find((a) => a.id === formData.sourceAccountId);

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async () => {
			if (!isObligation && !formData.sourceAccountId) {
				throw new Error(t("finance.expenses.errors.accountRequired"));
			}
			if (!formData.amount || parseFloat(formData.amount) <= 0) {
				throw new Error(t("finance.expenses.errors.amountRequired"));
			}

			return orpcClient.finance.expenses.create({
				organizationId,
				category: formData.category,
				customCategory: formData.category === "CUSTOM" ? formData.customCategory : undefined,
				description: formData.description || undefined,
				amount: parseFloat(formData.amount),
				date: new Date(formData.date),
				sourceAccountId: isObligation ? undefined : formData.sourceAccountId,
				vendorName: formData.vendorName || undefined,
				vendorTaxNumber: formData.vendorTaxNumber || undefined,
				projectId: formData.projectId || undefined,
				invoiceRef: formData.invoiceRef || undefined,
				paymentMethod: formData.paymentMethod,
				referenceNo: formData.referenceNo || undefined,
				status: isObligation ? "PENDING" : undefined,
				dueDate: isObligation && formData.dueDate ? new Date(formData.dueDate) : undefined,
				notes: formData.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.expenses.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "expenses"] });
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
			queryClient.invalidateQueries({ queryKey: ["projectFinance"] });
			router.push(redirectPath || `/app/${organizationSlug}/finance/expenses`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.expenses.createError"));
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate();
	};

	const getCategoryLabel = (category: string) => {
		return t(`finance.expenses.categories.${category.toLowerCase()}`);
	};

	const getPaymentMethodLabel = (method: string) => {
		return t(`finance.payments.methods.${method.toLowerCase()}`);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Basic Info */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.expenses.basicInfo")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Category & Amount */}
					<div className="grid gap-6 sm:grid-cols-2">
						<div>
							<Label>{t("finance.expenses.category")} *</Label>
							<Select
								value={formData.category}
								onValueChange={(value) =>
									setFormData({ ...formData, category: value as any })
								}
							>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl max-h-[300px]">
									{EXPENSE_CATEGORIES.map((category) => (
										<SelectItem key={category} value={category}>
											{getCategoryLabel(category)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("finance.expenses.amount")} *</Label>
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
					</div>

					{/* Custom Category (if CUSTOM selected) */}
					{formData.category === "CUSTOM" && (
						<div>
							<Label>{t("finance.expenses.customCategory")} *</Label>
							<Input
								value={formData.customCategory}
								onChange={(e) =>
									setFormData({ ...formData, customCategory: e.target.value })
								}
								placeholder={t("finance.expenses.customCategoryPlaceholder")}
								className="rounded-xl mt-1"
								required
							/>
						</div>
					)}

					{/* Date */}
					<div>
						<Label>{t("finance.expenses.date")} *</Label>
						<Input
							type="date"
							value={formData.date}
							onChange={(e) =>
								setFormData({ ...formData, date: e.target.value })
							}
							className="rounded-xl mt-1 max-w-xs"
							required
						/>
					</div>

					{/* Obligation Toggle */}
					<div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
								<Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
							</div>
							<div>
								<p className="text-sm font-medium">{t("finance.expenses.recordObligation")}</p>
								<p className="text-xs text-slate-500">{t("finance.expenses.recordObligationHint")}</p>
							</div>
						</div>
						<Switch
							checked={isObligation}
							onCheckedChange={setIsObligation}
						/>
					</div>

					{/* Due Date (only for obligations) */}
					{isObligation && (
						<div>
							<Label>{t("finance.expenses.dueDate")}</Label>
							<Input
								type="date"
								value={formData.dueDate}
								onChange={(e) =>
									setFormData({ ...formData, dueDate: e.target.value })
								}
								className="rounded-xl mt-1 max-w-xs"
							/>
						</div>
					)}

					{/* Description */}
					<div>
						<Label>{t("finance.expenses.description")}</Label>
						<Textarea
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							placeholder={t("finance.expenses.descriptionPlaceholder")}
							className="rounded-xl mt-1"
							rows={2}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Source Account - optional for obligations */}
			<Card className={`rounded-2xl ${isObligation ? "opacity-60" : ""}`}>
				<CardHeader>
					<CardTitle>{t("finance.expenses.sourceAccount")} {!isObligation && "*"}</CardTitle>
					{isObligation && (
						<p className="text-sm text-amber-600 dark:text-amber-400">{t("finance.expenses.accountOptionalForObligation")}</p>
					)}
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<Label>{t("finance.expenses.selectAccount")} {!isObligation && "*"}</Label>
						<Select
							value={formData.sourceAccountId}
							onValueChange={(value) =>
								setFormData({ ...formData, sourceAccountId: value })
							}
						>
							<SelectTrigger className="rounded-xl mt-1">
								<SelectValue placeholder={t("finance.expenses.selectAccountPlaceholder")} />
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
						<div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{selectedAccount.accountType === "BANK" ? (
										<Building className="h-5 w-5 text-blue-500" />
									) : (
										<Wallet className="h-5 w-5 text-green-500" />
									)}
									<div>
										<p className="font-medium">{selectedAccount.name}</p>
										<p className="text-sm text-slate-500">{selectedAccount.bankName}</p>
									</div>
								</div>
								<div className="text-end">
									<p className="text-sm text-slate-500">{t("finance.banks.currentBalance")}</p>
									<p className="font-semibold">
										<Currency amount={Number(selectedAccount.balance)} />
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Payment Method */}
					<div className="grid gap-6 sm:grid-cols-2">
						<div>
							<Label>{t("finance.expenses.paymentMethod")}</Label>
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
							<Label>{t("finance.expenses.referenceNo")}</Label>
							<Input
								value={formData.referenceNo}
								onChange={(e) =>
									setFormData({ ...formData, referenceNo: e.target.value })
								}
								placeholder={t("finance.expenses.referenceNoPlaceholder")}
								className="rounded-xl mt-1"
								dir="ltr"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Vendor Info */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.expenses.vendorInfo")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid gap-6 sm:grid-cols-2">
						<div>
							<Label>{t("finance.expenses.vendorName")}</Label>
							<Input
								value={formData.vendorName}
								onChange={(e) =>
									setFormData({ ...formData, vendorName: e.target.value })
								}
								placeholder={t("finance.expenses.vendorNamePlaceholder")}
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.expenses.vendorTaxNumber")}</Label>
							<Input
								value={formData.vendorTaxNumber}
								onChange={(e) =>
									setFormData({ ...formData, vendorTaxNumber: e.target.value })
								}
								placeholder={t("finance.expenses.vendorTaxNumberPlaceholder")}
								className="rounded-xl mt-1"
								dir="ltr"
							/>
						</div>
					</div>
					<div>
						<Label>{t("finance.expenses.invoiceRef")}</Label>
						<Input
							value={formData.invoiceRef}
							onChange={(e) =>
								setFormData({ ...formData, invoiceRef: e.target.value })
							}
							placeholder={t("finance.expenses.invoiceRefPlaceholder")}
							className="rounded-xl mt-1"
							dir="ltr"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Project Link - hidden when defaultProjectId is set */}
			{!defaultProjectId && (
				<Card className="rounded-2xl">
					<CardHeader>
						<CardTitle>{t("finance.expenses.projectLink")}</CardTitle>
					</CardHeader>
					<CardContent>
						<div>
							<Label>{t("finance.expenses.selectProject")}</Label>
							<Select
								value={formData.projectId || "none"}
								onValueChange={(value) =>
									setFormData({ ...formData, projectId: value === "none" ? "" : value })
								}
							>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("finance.expenses.selectProjectPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="none">{t("finance.expenses.noProject")}</SelectItem>
									{projects.map((project) => (
										<SelectItem key={project.id} value={project.id}>
											{project.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-sm text-slate-500 mt-1">
								{t("finance.expenses.projectLinkHint")}
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Notes */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.expenses.additionalNotes")}</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						value={formData.notes}
						onChange={(e) =>
							setFormData({ ...formData, notes: e.target.value })
						}
						placeholder={t("finance.expenses.notesPlaceholder")}
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
							{t("finance.expenses.create")}
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
