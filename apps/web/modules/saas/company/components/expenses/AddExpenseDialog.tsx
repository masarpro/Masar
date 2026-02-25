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

interface AddExpenseDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
}

const EXPENSE_CATEGORIES = [
	"RENT", "UTILITIES", "COMMUNICATIONS", "INSURANCE", "LICENSES",
	"SUBSCRIPTIONS", "MAINTENANCE", "BANK_FEES", "MARKETING",
	"TRANSPORT", "HOSPITALITY", "OTHER",
] as const;

const RECURRENCE_TYPES = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "ONE_TIME"] as const;

export function AddExpenseDialog({
	open,
	onOpenChange,
	organizationId,
}: AddExpenseDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState({
		name: "",
		category: "RENT" as (typeof EXPENSE_CATEGORIES)[number],
		amount: "",
		recurrence: "MONTHLY" as (typeof RECURRENCE_TYPES)[number],
		vendor: "",
		contractNumber: "",
		startDate: new Date().toISOString().split("T")[0],
		endDate: "",
		reminderDays: "5",
		description: "",
		notes: "",
	});

	const createMutation = useMutation({
		mutationFn: async () => {
			if (!formData.name.trim()) {
				throw new Error("اسم المصروف مطلوب");
			}
			if (!formData.amount || parseFloat(formData.amount) <= 0) {
				throw new Error("المبلغ يجب أن يكون أكبر من صفر");
			}
			return orpcClient.company.expenses.create({
				organizationId,
				name: formData.name,
				category: formData.category,
				amount: parseFloat(formData.amount),
				recurrence: formData.recurrence,
				vendor: formData.vendor || undefined,
				contractNumber: formData.contractNumber || undefined,
				startDate: new Date(formData.startDate),
				endDate: formData.endDate ? new Date(formData.endDate) : undefined,
				reminderDays: parseInt(formData.reminderDays) || 5,
				description: formData.description || undefined,
				notes: formData.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("company.expenses.createSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.expenses.list.queryOptions({ input: { organizationId } }).queryKey });
			queryClient.invalidateQueries({ queryKey: orpc.company.expenses.getSummary.queryOptions({ input: { organizationId } }).queryKey });
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(error.message || t("company.expenses.createError"));
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
						{t("company.expenses.addExpense")}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="p-5 space-y-4">
						{/* Row 1: Name, Category, Amount */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.expenses.name")} *
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
									{t("company.expenses.category")} *
								</Label>
								<Select
									value={formData.category}
									onValueChange={(value) => setFormData({ ...formData, category: value as any })}
								>
									<SelectTrigger className="rounded-xl h-10">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl max-h-[250px]">
										{EXPENSE_CATEGORIES.map((cat) => (
											<SelectItem key={cat} value={cat}>
												{t(`company.expenses.categories.${cat}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.expenses.amount")} *
								</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.amount}
									onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
									placeholder="0.00"
									className="rounded-xl h-10"
									required
								/>
							</div>
						</div>

						{/* Row 2: Recurrence, Vendor, Contract Number */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.expenses.recurrence")} *
								</Label>
								<Select
									value={formData.recurrence}
									onValueChange={(value) => setFormData({ ...formData, recurrence: value as any })}
								>
									<SelectTrigger className="rounded-xl h-10">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										{RECURRENCE_TYPES.map((r) => (
											<SelectItem key={r} value={r}>
												{t(`company.expenses.recurrences.${r}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.expenses.vendor")}
								</Label>
								<Input
									value={formData.vendor}
									onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.expenses.contractNumber")}
								</Label>
								<Input
									value={formData.contractNumber}
									onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
						</div>

						{/* Row 3: Start Date, End Date, Reminder Days */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.expenses.startDate")} *
								</Label>
								<Input
									type="date"
									value={formData.startDate}
									onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
									className="rounded-xl h-10"
									required
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.expenses.endDate")}
								</Label>
								<Input
									type="date"
									value={formData.endDate}
									onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.expenses.reminderDays")}
								</Label>
								<Input
									type="number"
									min="0"
									value={formData.reminderDays}
									onChange={(e) => setFormData({ ...formData, reminderDays: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
						</div>

						{/* Row 4: Description, Notes */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.expenses.description")}
								</Label>
								<Input
									value={formData.description}
									onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
									{t("company.expenses.addExpense")}
								</>
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
