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
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@ui/components/form";
import { Loader2 } from "lucide-react";

const editPayrollItemSchema = z.object({
	baseSalary: z.coerce.number().min(0),
	housingAllowance: z.coerce.number().min(0),
	transportAllowance: z.coerce.number().min(0),
	otherAllowances: z.coerce.number().min(0),
	gosiDeduction: z.coerce.number().min(0),
});

type EditPayrollItemFormValues = z.infer<typeof editPayrollItemSchema>;

interface PayrollItemForEdit {
	id: string;
	baseSalary?: number | string | null;
	housingAllowance?: number | string | null;
	transportAllowance?: number | string | null;
	otherAllowances?: number | string | null;
	gosiDeduction?: number | string | null;
	employee?: { name?: string | null; employeeNo?: string | null } | null;
}

interface EditPayrollItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	item: PayrollItemForEdit | null;
	onSubmit: (data: EditPayrollItemFormValues) => void;
	isLoading: boolean;
}

export function EditPayrollItemDialog({
	open,
	onOpenChange,
	item,
	onSubmit,
	isLoading,
}: EditPayrollItemDialogProps) {
	const t = useTranslations();

	const form = useForm<EditPayrollItemFormValues>({
		resolver: zodResolver(editPayrollItemSchema),
		defaultValues: {
			baseSalary: 0,
			housingAllowance: 0,
			transportAllowance: 0,
			otherAllowances: 0,
			gosiDeduction: 0,
		},
	});

	useEffect(() => {
		if (item && open) {
			form.reset({
				baseSalary: Number(item.baseSalary ?? 0),
				housingAllowance: Number(item.housingAllowance ?? 0),
				transportAllowance: Number(item.transportAllowance ?? 0),
				otherAllowances: Number(item.otherAllowances ?? 0),
				gosiDeduction: Number(item.gosiDeduction ?? 0),
			});
		}
	}, [item, open, form]);

	const handleSubmit = form.handleSubmit((data) => {
		onSubmit(data);
		onOpenChange(false);
	});

	if (!item) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent dir="rtl" className="sm:max-w-md rounded-2xl">
				<DialogHeader>
					<DialogTitle>
						{t("company.payroll.editItem")} - {item.employee?.name ?? item.employee?.employeeNo ?? "-"}
					</DialogTitle>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={handleSubmit} className="space-y-4">
						<FormField
							control={form.control}
							name="baseSalary"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("company.payroll.baseSalary")}</FormLabel>
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
							name="housingAllowance"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("company.payroll.housingAllowance")}</FormLabel>
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
							name="transportAllowance"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("company.payroll.transportAllowance")}</FormLabel>
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
							name="otherAllowances"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("company.payroll.otherAllowances")}</FormLabel>
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
							name="gosiDeduction"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("company.payroll.gosiDeduction")}</FormLabel>
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
