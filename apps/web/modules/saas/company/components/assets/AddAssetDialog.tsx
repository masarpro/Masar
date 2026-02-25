"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@ui/components/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

interface AddAssetDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
}

const ASSET_CATEGORIES = [
	"HEAVY_EQUIPMENT", "LIGHT_EQUIPMENT", "VEHICLES", "TOOLS",
	"IT_EQUIPMENT", "FURNITURE", "SAFETY_EQUIPMENT", "SURVEYING", "OTHER",
] as const;

const ASSET_TYPES = ["OWNED", "RENTED", "LEASED"] as const;

export function AddAssetDialog({
	open,
	onOpenChange,
	organizationId,
}: AddAssetDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState({
		name: "",
		category: "HEAVY_EQUIPMENT" as (typeof ASSET_CATEGORIES)[number],
		type: "OWNED" as (typeof ASSET_TYPES)[number],
		brand: "",
		model: "",
		serialNumber: "",
		year: "",
		purchasePrice: "",
		monthlyRent: "",
		currentValue: "",
		purchaseDate: "",
		warrantyExpiry: "",
		insuranceExpiry: "",
		notes: "",
	});

	const createMutation = useMutation({
		mutationFn: async () => {
			if (!formData.name.trim()) {
				throw new Error("اسم الأصل مطلوب");
			}
			return orpcClient.company.assets.create({
				organizationId,
				name: formData.name,
				category: formData.category,
				type: formData.type,
				brand: formData.brand || undefined,
				model: formData.model || undefined,
				serialNumber: formData.serialNumber || undefined,
				year: formData.year ? Number(formData.year) : undefined,
				purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
				monthlyRent: formData.monthlyRent ? parseFloat(formData.monthlyRent) : undefined,
				currentValue: formData.currentValue ? parseFloat(formData.currentValue) : undefined,
				purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
				warrantyExpiry: formData.warrantyExpiry ? new Date(formData.warrantyExpiry) : undefined,
				insuranceExpiry: formData.insuranceExpiry ? new Date(formData.insuranceExpiry) : undefined,
				notes: formData.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("company.assets.createSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.assets.list.queryOptions({ input: { organizationId } }).queryKey });
			queryClient.invalidateQueries({ queryKey: orpc.company.assets.getSummary.queryOptions({ input: { organizationId } }).queryKey });
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(error.message || t("company.assets.createError"));
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createMutation.mutate();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent dir="rtl" className="sm:max-w-4xl p-0 gap-0 rounded-2xl overflow-hidden">
				{/* Header */}
				<DialogHeader className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
					<DialogTitle className="text-base font-semibold text-right">
						{t("company.assets.addAsset")}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="p-5 space-y-4">
						{/* Row 1: Name, Category, Type */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.name")} *
								</Label>
								<Input
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className="rounded-xl h-10"
									required
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.category")} *
								</Label>
								<Select
									value={formData.category}
									onValueChange={(value) => setFormData({ ...formData, category: value as any })}
								>
									<SelectTrigger className="rounded-xl h-10">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl max-h-[250px]">
										{ASSET_CATEGORIES.map((cat) => (
											<SelectItem key={cat} value={cat}>
												{t(`company.assets.categories.${cat}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.type")} *
								</Label>
								<Select
									value={formData.type}
									onValueChange={(value) => setFormData({ ...formData, type: value as any })}
								>
									<SelectTrigger className="rounded-xl h-10">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										{ASSET_TYPES.map((t2) => (
											<SelectItem key={t2} value={t2}>
												{t(`company.assets.types.${t2}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Row 2: Brand, Model, Serial Number */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.brand")}
								</Label>
								<Input
									value={formData.brand}
									onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.model")}
								</Label>
								<Input
									value={formData.model}
									onChange={(e) => setFormData({ ...formData, model: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.serialNumber")}
								</Label>
								<Input
									value={formData.serialNumber}
									onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
						</div>

						{/* Row 3: Year, Purchase Price, Monthly Rent */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.year")}
								</Label>
								<Input
									type="number"
									value={formData.year}
									onChange={(e) => setFormData({ ...formData, year: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.purchasePrice")}
								</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.purchasePrice}
									onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
									placeholder="0.00"
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.monthlyRent")}
								</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.monthlyRent}
									onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
									placeholder="0.00"
									className="rounded-xl h-10"
								/>
							</div>
						</div>

						{/* Row 4: Current Value, Purchase Date, Warranty Expiry */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.currentValue")}
								</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.currentValue}
									onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
									placeholder="0.00"
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.purchaseDate")}
								</Label>
								<Input
									type="date"
									value={formData.purchaseDate}
									onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.warrantyExpiry")}
								</Label>
								<Input
									type="date"
									value={formData.warrantyExpiry}
									onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
						</div>

						{/* Row 5: Insurance Expiry, Notes */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.assets.insuranceExpiry")}
								</Label>
								<Input
									type="date"
									value={formData.insuranceExpiry}
									onChange={(e) => setFormData({ ...formData, insuranceExpiry: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.common.notes")}
								</Label>
								<Input
									value={formData.notes}
									onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
						</div>
					</div>

					{/* Footer Actions */}
					<div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex gap-3">
						<Button
							type="button"
							variant="outline"
							className="flex-1 rounded-xl h-10"
							onClick={() => onOpenChange(false)}
							disabled={createMutation.isPending}
						>
							{t("company.common.cancel")}
						</Button>
						<Button
							type="submit"
							className="flex-1 rounded-xl h-10"
							disabled={createMutation.isPending}
						>
							{createMutation.isPending ? (
								<>
									<Loader2 className="h-4 w-4 me-2 animate-spin" />
									{t("company.common.saving")}
								</>
							) : (
								<>
									<Save className="h-4 w-4 me-2" />
									{t("company.assets.addAsset")}
								</>
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
