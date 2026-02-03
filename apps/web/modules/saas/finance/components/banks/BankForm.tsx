"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Tabs, TabsList, TabsTrigger } from "@ui/components/tabs";
import { Switch } from "@ui/components/switch";
import { toast } from "sonner";
import { Building, Wallet, Save, ArrowRight } from "lucide-react";

interface BankFormProps {
	organizationId: string;
	organizationSlug: string;
	initialData?: {
		id: string;
		name: string;
		accountType: "BANK" | "CASH_BOX";
		bankName?: string | null;
		accountNumber?: string | null;
		iban?: string | null;
		balance: number;
		currency: string;
		isDefault: boolean;
		notes?: string | null;
	};
}

export function BankForm({
	organizationId,
	organizationSlug,
	initialData,
}: BankFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const isEdit = !!initialData;

	// Form state
	const [formData, setFormData] = useState({
		name: initialData?.name ?? "",
		accountType: initialData?.accountType ?? "BANK" as "BANK" | "CASH_BOX",
		bankName: initialData?.bankName ?? "",
		accountNumber: initialData?.accountNumber ?? "",
		iban: initialData?.iban ?? "",
		balance: initialData?.balance ?? 0,
		currency: initialData?.currency ?? "SAR",
		isDefault: initialData?.isDefault ?? false,
		notes: initialData?.notes ?? "",
	});

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.banks.create({
				organizationId,
				name: formData.name,
				accountType: formData.accountType,
				bankName: formData.bankName || undefined,
				accountNumber: formData.accountNumber || undefined,
				iban: formData.iban || undefined,
				balance: formData.balance,
				currency: formData.currency,
				isDefault: formData.isDefault,
				notes: formData.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.banks.createSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
			router.push(`/app/${organizationSlug}/finance/banks`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.banks.createError"));
		},
	});

	// Update mutation
	const updateMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.banks.update({
				organizationId,
				id: initialData!.id,
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
			queryClient.invalidateQueries({ queryKey: ["finance", "banks"] });
			router.push(`/app/${organizationSlug}/finance/banks`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.banks.updateError"));
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (isEdit) {
			updateMutation.mutate();
		} else {
			createMutation.mutate();
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.banks.accountInfo")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
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
							placeholder={
								formData.accountType === "BANK"
									? t("finance.banks.bankAccountNamePlaceholder")
									: t("finance.banks.cashBoxNamePlaceholder")
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
										placeholder={t("finance.banks.bankNamePlaceholder")}
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
										placeholder={t("finance.banks.accountNumberPlaceholder")}
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
									placeholder="SA00 0000 0000 0000 0000 0000"
									className="rounded-xl mt-1 max-w-md font-mono"
									dir="ltr"
								/>
							</div>
						</>
					)}

					{/* الرصيد الافتتاحي (فقط للإنشاء) */}
					{!isEdit && (
						<div>
							<Label>{t("finance.banks.openingBalance")}</Label>
							<Input
								type="number"
								step="0.01"
								value={formData.balance}
								onChange={(e) =>
									setFormData({
										...formData,
										balance: parseFloat(e.target.value) || 0,
									})
								}
								placeholder="0.00"
								className="rounded-xl mt-1 max-w-xs"
								dir="ltr"
							/>
							<p className="text-sm text-slate-500 mt-1">
								{t("finance.banks.openingBalanceHint")}
							</p>
						</div>
					)}

					{/* حساب افتراضي */}
					{!isEdit && (
						<div className="flex items-center gap-3">
							<Switch
								checked={formData.isDefault}
								onCheckedChange={(checked) =>
									setFormData({ ...formData, isDefault: checked })
								}
							/>
							<Label>{t("finance.banks.setAsDefault")}</Label>
						</div>
					)}

					{/* ملاحظات */}
					<div>
						<Label>{t("finance.banks.notes")}</Label>
						<Textarea
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
							placeholder={t("finance.banks.notesPlaceholder")}
							className="rounded-xl mt-1"
							rows={3}
						/>
					</div>
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
					disabled={isPending}
					className="rounded-xl"
				>
					{isPending ? (
						t("common.saving")
					) : (
						<>
							<Save className="h-4 w-4 me-2" />
							{isEdit ? t("common.save") : t("finance.banks.addAccount")}
						</>
					)}
				</Button>
			</div>
		</form>
	);
}
