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
import { Badge } from "@ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@ui/components/card";
import { Tabs, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { toast } from "sonner";
import {
	Building,
	Wallet,
	Save,
	Trash2,
	Star,
	Pencil,
	ArrowLeftRight,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { Currency } from "../shared/Currency";

interface BankDetailProps {
	organizationId: string;
	organizationSlug: string;
	bankId: string;
}

export function BankDetail({
	organizationId,
	organizationSlug,
	bankId,
}: BankDetailProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const [isEditing, setIsEditing] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	// Fetch account details
	const { data: account, isLoading } = useQuery(
		orpc.finance.banks.getById.queryOptions({
			input: { organizationId, id: bankId },
		}),
	);

	// Form state
	const [formData, setFormData] = useState({
		name: "",
		accountType: "BANK" as "BANK" | "CASH_BOX",
		bankName: "",
		accountNumber: "",
		iban: "",
		currency: "SAR",
		notes: "",
	});

	// Initialize form when account loads
	if (account && !formData.name && !isEditing) {
		setFormData({
			name: account.name,
			accountType: account.accountType,
			bankName: account.bankName ?? "",
			accountNumber: account.accountNumber ?? "",
			iban: account.iban ?? "",
			currency: account.currency,
			notes: account.notes ?? "",
		});
	}

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.banks.update({
				organizationId,
				id: bankId,
				name: formData.name,
				accountType: formData.accountType,
				bankName: formData.bankName || undefined,
				accountNumber: formData.accountNumber || undefined,
				iban: formData.iban || undefined,
				currency: formData.currency,
				notes: formData.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.banks.updateSuccess"));
			setIsEditing(false);
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.banks.updateError"));
		},
	});

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.banks.delete({
				organizationId,
				id: bankId,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.banks.deleteSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
			router.push(`/app/${organizationSlug}/finance/banks`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.banks.deleteError"));
		},
	});

	// Set default mutation
	const setDefaultMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.banks.setDefault({
				organizationId,
				id: bankId,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.banks.setDefaultSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.banks.setDefaultError"));
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateMutation.mutate();
	};

	const handleCancelEdit = () => {
		if (account) {
			setFormData({
				name: account.name,
				accountType: account.accountType,
				bankName: account.bankName ?? "",
				accountNumber: account.accountNumber ?? "",
				iban: account.iban ?? "",
				currency: account.currency,
				notes: account.notes ?? "",
			});
		}
		setIsEditing(false);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (!account) {
		return (
			<div className="text-center py-20">
				<Building className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
				<p className="text-slate-500 dark:text-slate-400">
					{t("finance.banks.notFound")}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Account Summary Card */}
			<Card className="rounded-2xl">
				<CardContent className="p-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="flex items-center gap-4">
							<div className={`p-3 rounded-xl ${
								account.accountType === "BANK"
									? "bg-blue-100 dark:bg-blue-900/50"
									: "bg-green-100 dark:bg-green-900/50"
							}`}>
								{account.accountType === "BANK" ? (
									<Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
								) : (
									<Wallet className="h-8 w-8 text-green-600 dark:text-green-400" />
								)}
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
										{account.name}
									</h2>
									{account.isDefault && (
										<Star className="h-4 w-4 text-amber-500 fill-amber-500" />
									)}
								</div>
								<div className="flex items-center gap-2 mt-1">
									<Badge
										variant={account.accountType === "BANK" ? "secondary" : "outline"}
										className="rounded-lg"
									>
										{account.accountType === "BANK"
											? t("finance.banks.types.bank")
											: t("finance.banks.types.cashBox")}
									</Badge>
									{account.bankName && (
										<span className="text-sm text-slate-500">{account.bankName}</span>
									)}
								</div>
							</div>
						</div>
						<div className="text-end">
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("finance.banks.currentBalance")}
							</p>
							<p className={`text-2xl font-bold ${
								Number(account.balance) >= 0
									? "text-green-600 dark:text-green-400"
									: "text-red-600 dark:text-red-400"
							}`}>
								<Currency amount={Number(account.balance)} />
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Quick Actions */}
			<div className="grid gap-4 md:grid-cols-3">
				<Button
					variant="outline"
					className="h-auto py-4 rounded-xl justify-start"
					onClick={() => router.push(`/app/${organizationSlug}/finance/expenses/new?sourceAccountId=${bankId}`)}
				>
					<TrendingDown className="h-5 w-5 me-3 text-red-500" />
					<div className="text-start">
						<div className="font-medium">{t("finance.expenses.create")}</div>
						<div className="text-xs text-slate-500">{t("finance.banks.recordExpense")}</div>
					</div>
				</Button>
				<Button
					variant="outline"
					className="h-auto py-4 rounded-xl justify-start"
					onClick={() => router.push(`/app/${organizationSlug}/finance/payments/new?destinationAccountId=${bankId}`)}
				>
					<TrendingUp className="h-5 w-5 me-3 text-green-500" />
					<div className="text-start">
						<div className="font-medium">{t("finance.payments.create")}</div>
						<div className="text-xs text-slate-500">{t("finance.banks.recordPayment")}</div>
					</div>
				</Button>
				<Button
					variant="outline"
					className="h-auto py-4 rounded-xl justify-start"
					onClick={() => router.push(`/app/${organizationSlug}/finance/expenses/transfer`)}
				>
					<ArrowLeftRight className="h-5 w-5 me-3 text-blue-500" />
					<div className="text-start">
						<div className="font-medium">{t("finance.banks.transfer")}</div>
						<div className="text-xs text-slate-500">{t("finance.banks.transferBetweenAccounts")}</div>
					</div>
				</Button>
			</div>

			{/* Account Details */}
			<Card className="rounded-2xl">
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>{t("finance.banks.accountInfo")}</CardTitle>
						<CardDescription>{t("finance.banks.accountInfoDescription")}</CardDescription>
					</div>
					{!isEditing && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => setIsEditing(true)}
							className="rounded-xl"
						>
							<Pencil className="h-4 w-4 me-2" />
							{t("common.edit")}
						</Button>
					)}
				</CardHeader>
				<CardContent>
					{isEditing ? (
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* نوع الحساب */}
							<div>
								<Label className="mb-2 block">{t("finance.banks.accountType")}</Label>
								<Tabs
									value={formData.accountType}
									onValueChange={(value) =>
										setFormData({
											...formData,
											accountType: value as "BANK" | "CASH_BOX",
										})
									}
									className="w-full"
								>
									<TabsList className="grid w-full grid-cols-2 rounded-xl max-w-md">
										<TabsTrigger value="BANK" className="rounded-xl">
											<Building className="h-4 w-4 me-2" />
											{t("finance.banks.types.bank")}
										</TabsTrigger>
										<TabsTrigger value="CASH_BOX" className="rounded-xl">
											<Wallet className="h-4 w-4 me-2" />
											{t("finance.banks.types.cashBox")}
										</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>

							{/* اسم الحساب */}
							<div>
								<Label>{t("finance.banks.accountName")} *</Label>
								<Input
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									required
									className="rounded-xl mt-1 max-w-md"
								/>
							</div>

							{/* حقول البنك */}
							{formData.accountType === "BANK" && (
								<>
									<div className="grid gap-6 sm:grid-cols-2">
										<div>
											<Label>{t("finance.banks.bankName")}</Label>
											<Input
												value={formData.bankName}
												onChange={(e) =>
													setFormData({ ...formData, bankName: e.target.value })
												}
												className="rounded-xl mt-1"
											/>
										</div>
										<div>
											<Label>{t("finance.banks.accountNumber")}</Label>
											<Input
												value={formData.accountNumber}
												onChange={(e) =>
													setFormData({ ...formData, accountNumber: e.target.value })
												}
												className="rounded-xl mt-1"
												dir="ltr"
											/>
										</div>
									</div>
									<div>
										<Label>{t("finance.banks.iban")}</Label>
										<Input
											value={formData.iban}
											onChange={(e) =>
												setFormData({ ...formData, iban: e.target.value })
											}
											className="rounded-xl mt-1 max-w-md font-mono"
											dir="ltr"
										/>
									</div>
								</>
							)}

							{/* ملاحظات */}
							<div>
								<Label>{t("finance.banks.notes")}</Label>
								<Textarea
									value={formData.notes}
									onChange={(e) =>
										setFormData({ ...formData, notes: e.target.value })
									}
									className="rounded-xl mt-1"
									rows={3}
								/>
							</div>

							{/* Actions */}
							<div className="flex justify-end gap-3">
								<Button
									type="button"
									variant="outline"
									onClick={handleCancelEdit}
									className="rounded-xl"
								>
									{t("common.cancel")}
								</Button>
								<Button
									type="submit"
									disabled={updateMutation.isPending}
									className="rounded-xl"
								>
									{updateMutation.isPending ? (
										t("common.saving")
									) : (
										<>
											<Save className="h-4 w-4 me-2" />
											{t("common.save")}
										</>
									)}
								</Button>
							</div>
						</form>
					) : (
						<div className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div>
									<Label className="text-slate-500">{t("finance.banks.accountName")}</Label>
									<p className="font-medium">{account.name}</p>
								</div>
								<div>
									<Label className="text-slate-500">{t("finance.banks.accountType")}</Label>
									<p className="font-medium">
										{account.accountType === "BANK"
											? t("finance.banks.types.bank")
											: t("finance.banks.types.cashBox")}
									</p>
								</div>
								{account.bankName && (
									<div>
										<Label className="text-slate-500">{t("finance.banks.bankName")}</Label>
										<p className="font-medium">{account.bankName}</p>
									</div>
								)}
								{account.accountNumber && (
									<div>
										<Label className="text-slate-500">{t("finance.banks.accountNumber")}</Label>
										<p className="font-medium font-mono">{account.accountNumber}</p>
									</div>
								)}
								{account.iban && (
									<div className="sm:col-span-2">
										<Label className="text-slate-500">{t("finance.banks.iban")}</Label>
										<p className="font-medium font-mono">{account.iban}</p>
									</div>
								)}
								{account.notes && (
									<div className="sm:col-span-2">
										<Label className="text-slate-500">{t("finance.banks.notes")}</Label>
										<p className="whitespace-pre-wrap">{account.notes}</p>
									</div>
								)}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Danger Zone */}
			<Card className="rounded-2xl border-red-200 dark:border-red-900">
				<CardHeader>
					<CardTitle className="text-red-600">{t("common.dangerZone")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="font-medium">{t("finance.banks.setAsDefault")}</p>
							<p className="text-sm text-slate-500">
								{t("finance.banks.setAsDefaultDescription")}
							</p>
						</div>
						<Button
							variant="outline"
							onClick={() => setDefaultMutation.mutate()}
							disabled={account.isDefault || setDefaultMutation.isPending}
							className="rounded-xl"
						>
							<Star className="h-4 w-4 me-2" />
							{account.isDefault
								? t("finance.banks.alreadyDefault")
								: t("finance.banks.setAsDefault")}
						</Button>
					</div>
					<div className="border-t pt-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">{t("finance.banks.deleteAccount")}</p>
								<p className="text-sm text-slate-500">
									{t("finance.banks.deleteAccountDescription")}
								</p>
							</div>
							<Button
								variant="error"
								onClick={() => setDeleteDialogOpen(true)}
								className="rounded-xl"
							>
								<Trash2 className="h-4 w-4 me-2" />
								{t("common.delete")}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Delete Confirmation */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("finance.banks.deleteTitle")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.banks.deleteDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteMutation.mutate()}
							disabled={deleteMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
