"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@ui/components/dialog";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Loader2 } from "lucide-react";

const editExpenseRunItemSchema = z.object({
	amount: z.coerce.number().min(0),
	notes: z.string().optional(),
});

type EditExpenseRunItemFormValues = z.infer<typeof editExpenseRunItemSchema>;

interface ExpenseRunItemForEdit {
	id: string;
	name?: string | null;
	originalAmount?: number | string | null;
	amount?: number | string | null;
	notes?: string | null;
}

interface EditExpenseRunItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: ExpenseRunItemForEdit | null;
	onSubmit: (data: EditExpenseRunItemFormValues) => void;
	isLoading: boolean;
}

export function EditExpenseRunItemDialog({
	open,
	onOpenChange,
	item,
	onSubmit,
	isLoading,
}: EditExpenseRunItemDialogProps) {
	const t = useTranslations();

	const form = useForm<EditExpenseRunItemFormValues>({
		resolver: zodResolver(editExpenseRunItemSchema),
		defaultValues: {
			amount: 0,
			notes: "",
		},
	});

	useEffect(() => {
		if (item && open) {
			form.reset({
				amount: Number(item.amount ?? 0),
				notes: item.notes ?? "",
			});
		}
	}, [item, open, form]);

	const handleSubmit = form.handleSubmit((data) => {
		onSubmit(data);
		onOpenChange(false);
	});

	if (!item) return null;

	const formatCurrency = (amount: number | string) => {
		return new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 2 }).format(Number(amount)) + " ر.س";
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent dir="rtl" className="sm:max-w-md rounded-2xl">
				<DialogHeader>
					<DialogTitle>
						{t("company.expenseRuns.editItem")} - {item.name ?? "-"}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Original Amount (read-only reference) */}
						<div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
							<p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
								{t("company.expenseRuns.originalAmount")}
							</p>
							<p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
								{formatCurrency(item.originalAmount ?? 0)}
							</p>
						</div>

						<FormField
							control={form.control}
							name="amount"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("company.expenseRuns.amount")}</FormLabel>
									<FormControl>
										<Input
											type="number"
											step="0.01"
											min={0}
											className="rounded-xl"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("company.expenseRuns.notes")}</FormLabel>
									<FormControl>
										<Textarea
											className="rounded-xl resize-none"
											rows={3}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								type="button"
								variant="outline"
								className="rounded-xl"
								onClick={() => onOpenChange(false)}
								disabled={isLoading}
							>
								{t("company.common.cancel")}
							</Button>
							<Button
								type="submit"
								className="rounded-xl bg-blue-600 hover:bg-blue-700"
								disabled={isLoading}
							>
								{isLoading ? (
									<>
										<Loader2 className="me-2 h-4 w-4 animate-spin" />
										{t("company.common.saving")}
									</>
								) : (
									t("company.common.save")
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
