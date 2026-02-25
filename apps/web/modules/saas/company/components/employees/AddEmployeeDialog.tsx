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

interface AddEmployeeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizationId: string;
}

const EMPLOYEE_TYPES = [
	"PROJECT_MANAGER", "SITE_ENGINEER", "SUPERVISOR", "ACCOUNTANT",
	"ADMIN", "DRIVER", "TECHNICIAN", "LABORER", "SECURITY", "OTHER",
] as const;

export function AddEmployeeDialog({
	open,
	onOpenChange,
	organizationId,
}: AddEmployeeDialogProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const [formData, setFormData] = useState({
		name: "",
		type: "SITE_ENGINEER" as (typeof EMPLOYEE_TYPES)[number],
		joinDate: new Date().toISOString().split("T")[0],
		phone: "",
		email: "",
		nationalId: "",
		salaryType: "MONTHLY" as "MONTHLY" | "DAILY",
		baseSalary: "",
		housingAllowance: "",
		transportAllowance: "",
		otherAllowances: "",
		gosiSubscription: "",
		notes: "",
	});

	const createMutation = useMutation({
		mutationFn: async () => {
			if (!formData.name.trim()) {
				throw new Error("اسم الموظف مطلوب");
			}
			return orpcClient.company.employees.create({
				organizationId,
				name: formData.name,
				type: formData.type,
				joinDate: new Date(formData.joinDate),
				phone: formData.phone || undefined,
				email: formData.email || undefined,
				nationalId: formData.nationalId || undefined,
				salaryType: formData.salaryType,
				baseSalary: parseFloat(formData.baseSalary) || 0,
				housingAllowance: parseFloat(formData.housingAllowance) || 0,
				transportAllowance: parseFloat(formData.transportAllowance) || 0,
				otherAllowances: parseFloat(formData.otherAllowances) || 0,
				gosiSubscription: parseFloat(formData.gosiSubscription) || 0,
				notes: formData.notes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("company.employees.createSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.employees.list.queryOptions({ input: { organizationId } }).queryKey });
			queryClient.invalidateQueries({ queryKey: orpc.company.employees.getSummary.queryOptions({ input: { organizationId } }).queryKey });
			onOpenChange(false);
		},
		onError: (error: any) => {
			toast.error(error.message || t("company.employees.createError"));
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
						{t("company.employees.addEmployee")}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="p-5 space-y-4">
						{/* Row 1: Name, Type, Join Date */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.employees.name")} *
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
									{t("company.employees.type")} *
								</Label>
								<Select
									value={formData.type}
									onValueChange={(value) => setFormData({ ...formData, type: value as any })}
								>
									<SelectTrigger className="rounded-xl h-10">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl max-h-[250px]">
										{EMPLOYEE_TYPES.map((type) => (
											<SelectItem key={type} value={type}>
												{t(`company.employees.types.${type}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.employees.joinDate")} *
								</Label>
								<Input
									type="date"
									value={formData.joinDate}
									onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
									className="rounded-xl h-10"
									required
								/>
							</div>
						</div>

						{/* Row 2: Phone, Email, National ID */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.employees.phone")}
								</Label>
								<Input
									value={formData.phone}
									onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.employees.email")}
								</Label>
								<Input
									type="email"
									value={formData.email}
									onChange={(e) => setFormData({ ...formData, email: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.employees.nationalId")}
								</Label>
								<Input
									value={formData.nationalId}
									onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
									className="rounded-xl h-10"
								/>
							</div>
						</div>

						{/* Row 3: Salary Type, Base Salary, Housing Allowance */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.employees.salaryType")}
								</Label>
								<Select
									value={formData.salaryType}
									onValueChange={(value) => setFormData({ ...formData, salaryType: value as any })}
								>
									<SelectTrigger className="rounded-xl h-10">
										<SelectValue />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										<SelectItem value="MONTHLY">{t("company.employees.monthly")}</SelectItem>
										<SelectItem value="DAILY">{t("company.employees.daily")}</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.employees.baseSalary")}
								</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.baseSalary}
									onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
									placeholder="0.00"
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.employees.housingAllowance")}
								</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.housingAllowance}
									onChange={(e) => setFormData({ ...formData, housingAllowance: e.target.value })}
									placeholder="0.00"
									className="rounded-xl h-10"
								/>
							</div>
						</div>

						{/* Row 4: Transport, Other Allowances, GOSI */}
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.employees.transportAllowance")}
								</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.transportAllowance}
									onChange={(e) => setFormData({ ...formData, transportAllowance: e.target.value })}
									placeholder="0.00"
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.employees.otherAllowances")}
								</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.otherAllowances}
									onChange={(e) => setFormData({ ...formData, otherAllowances: e.target.value })}
									placeholder="0.00"
									className="rounded-xl h-10"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-medium text-slate-500 dark:text-slate-400">
									{t("company.employees.gosiSubscription")}
								</Label>
								<Input
									type="number"
									step="0.01"
									min="0"
									value={formData.gosiSubscription}
									onChange={(e) => setFormData({ ...formData, gosiSubscription: e.target.value })}
									placeholder="0.00"
									className="rounded-xl h-10"
								/>
							</div>
						</div>

						{/* Row 5: Notes */}
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
									{t("company.employees.addEmployee")}
								</>
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
