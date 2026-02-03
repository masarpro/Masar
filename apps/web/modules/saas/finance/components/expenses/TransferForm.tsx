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
import { Save, Building, Wallet, ArrowRight, ArrowLeftRight } from "lucide-react";
import { Currency } from "../shared/Currency";

interface TransferFormProps {
	organizationId: string;
	organizationSlug: string;
}

export function TransferForm({
	organizationId,
	organizationSlug,
}: TransferFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	// Form state
	const [formData, setFormData] = useState({
		amount: "",
		date: new Date().toISOString().split("T")[0],
		fromAccountId: "",
		toAccountId: "",
		description: "",
		notes: "",
		referenceNo: "",
	});

	// Fetch bank accounts
	const { data: accountsData } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
	);

	const accounts = accountsData?.accounts ?? [];

	// Selected accounts
	const fromAccount = accounts.find((a) => a.id === formData.fromAccountId);
	const toAccount = accounts.find((a) => a.id === formData.toAccountId);

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async () => {
			if (!formData.fromAccountId) {
				throw new Error(t("finance.transfers.errors.fromAccountRequired"));
			}
			if (!formData.toAccountId) {
				throw new Error(t("finance.transfers.errors.toAccountRequired"));
			}
			if (formData.fromAccountId === formData.toAccountId) {
				throw new Error(t("finance.transfers.errors.sameAccount"));
			}
			if (!formData.amount || parseFloat(formData.amount) <= 0) {
				throw new Error(t("finance.transfers.errors.amountRequired"));
			}

			return orpcClient.finance.transfers.create({
				organizationId,
				amount: parseFloat(formData.amount),
				date: new Date(formData.date),
				fromAccountId: formData.fromAccountId,
				toAccountId: formData.toAccountId,
				description: formData.description || undefined,
				notes: formData.notes || undefined,
				referenceNo: formData.referenceNo || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.transfers.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "transfers"] });
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
			router.push(`/app/${organizationSlug}/finance/banks`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.transfers.createError"));
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate();
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Transfer Details */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ArrowLeftRight className="h-5 w-5" />
						{t("finance.transfers.details")}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Amount & Date */}
					<div className="grid gap-6 sm:grid-cols-2">
						<div>
							<Label>{t("finance.transfers.amount")} *</Label>
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
							<Label>{t("finance.transfers.date")} *</Label>
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
						<Label>{t("finance.transfers.description")}</Label>
						<Input
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							placeholder={t("finance.transfers.descriptionPlaceholder")}
							className="rounded-xl mt-1"
						/>
					</div>

					{/* Reference No */}
					<div>
						<Label>{t("finance.transfers.referenceNo")}</Label>
						<Input
							value={formData.referenceNo}
							onChange={(e) =>
								setFormData({ ...formData, referenceNo: e.target.value })
							}
							placeholder={t("finance.transfers.referenceNoPlaceholder")}
							className="rounded-xl mt-1"
							dir="ltr"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Source Account */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.transfers.fromAccount")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Select
						value={formData.fromAccountId}
						onValueChange={(value) =>
							setFormData({ ...formData, fromAccountId: value })
						}
					>
						<SelectTrigger className="rounded-xl">
							<SelectValue placeholder={t("finance.transfers.selectFromAccount")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							{accounts
								.filter((a) => a.id !== formData.toAccountId)
								.map((account) => (
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

					{fromAccount && (
						<div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{fromAccount.accountType === "BANK" ? (
										<Building className="h-5 w-5 text-blue-500" />
									) : (
										<Wallet className="h-5 w-5 text-green-500" />
									)}
									<div>
										<p className="font-medium">{fromAccount.name}</p>
										{fromAccount.bankName && (
											<p className="text-sm text-slate-500">{fromAccount.bankName}</p>
										)}
									</div>
								</div>
								<div className="text-end">
									<p className="text-sm text-slate-500">{t("finance.banks.currentBalance")}</p>
									<p className="font-semibold text-red-600">
										<Currency amount={Number(fromAccount.balance)} />
									</p>
									{formData.amount && (
										<p className="text-xs text-slate-500">
											{t("finance.transfers.afterTransfer")}:{" "}
											<Currency amount={Number(fromAccount.balance) - parseFloat(formData.amount || "0")} />
										</p>
									)}
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Arrow */}
			<div className="flex justify-center">
				<div className="p-3 bg-primary/10 rounded-full">
					<ArrowRight className="h-6 w-6 text-primary" />
				</div>
			</div>

			{/* Destination Account */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.transfers.toAccount")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<Select
						value={formData.toAccountId}
						onValueChange={(value) =>
							setFormData({ ...formData, toAccountId: value })
						}
					>
						<SelectTrigger className="rounded-xl">
							<SelectValue placeholder={t("finance.transfers.selectToAccount")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							{accounts
								.filter((a) => a.id !== formData.fromAccountId)
								.map((account) => (
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

					{toAccount && (
						<div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{toAccount.accountType === "BANK" ? (
										<Building className="h-5 w-5 text-blue-500" />
									) : (
										<Wallet className="h-5 w-5 text-green-500" />
									)}
									<div>
										<p className="font-medium">{toAccount.name}</p>
										{toAccount.bankName && (
											<p className="text-sm text-slate-500">{toAccount.bankName}</p>
										)}
									</div>
								</div>
								<div className="text-end">
									<p className="text-sm text-slate-500">{t("finance.banks.currentBalance")}</p>
									<p className="font-semibold text-green-600">
										<Currency amount={Number(toAccount.balance)} />
									</p>
									{formData.amount && (
										<p className="text-xs text-slate-500">
											{t("finance.transfers.afterTransfer")}:{" "}
											<Currency amount={Number(toAccount.balance) + parseFloat(formData.amount || "0")} />
										</p>
									)}
								</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Notes */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.transfers.notes")}</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						value={formData.notes}
						onChange={(e) =>
							setFormData({ ...formData, notes: e.target.value })
						}
						placeholder={t("finance.transfers.notesPlaceholder")}
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
							<ArrowLeftRight className="h-4 w-4 me-2" />
							{t("finance.transfers.create")}
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
