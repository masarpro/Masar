"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Users, Banknote, FileText } from "lucide-react";
import { toast } from "sonner";

const EMPLOYEE_TYPES = [
	"PROJECT_MANAGER", "SITE_ENGINEER", "SUPERVISOR", "ACCOUNTANT",
	"ADMIN", "DRIVER", "TECHNICIAN", "LABORER", "SECURITY", "OTHER",
] as const;

const formSchema = z.object({
	name: z.string().min(1, "اسم الموظف مطلوب"),
	employeeNo: z.string().optional(),
	type: z.enum(EMPLOYEE_TYPES),
	phone: z.string().optional(),
	email: z.string().email("بريد إلكتروني غير صحيح").optional().or(z.literal("")),
	nationalId: z.string().optional(),
	salaryType: z.enum(["MONTHLY", "DAILY"]),
	baseSalary: z.coerce.number().min(0),
	housingAllowance: z.coerce.number().min(0),
	transportAllowance: z.coerce.number().min(0),
	otherAllowances: z.coerce.number().min(0),
	gosiSubscription: z.coerce.number().min(0),
	joinDate: z.string().min(1, "تاريخ الالتحاق مطلوب"),
	notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EmployeeFormProps {
	organizationId: string;
	organizationSlug: string;
	employeeId?: string;
}

export function EmployeeForm({ organizationId, organizationSlug, employeeId }: EmployeeFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const isEditing = !!employeeId;

	const { data: existingEmployee } = useQuery({
		...orpc.company.employees.getById.queryOptions({
			input: { organizationId, id: employeeId! },
		}),
		enabled: isEditing,
	});

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			employeeNo: "",
			type: "SITE_ENGINEER",
			phone: "",
			email: "",
			nationalId: "",
			salaryType: "MONTHLY",
			baseSalary: 0,
			housingAllowance: 0,
			transportAllowance: 0,
			otherAllowances: 0,
			gosiSubscription: 0,
			joinDate: new Date().toISOString().split("T")[0],
			notes: "",
		},
		values: existingEmployee
			? {
					name: existingEmployee.name,
					employeeNo: existingEmployee.employeeNo ?? "",
					type: existingEmployee.type as typeof EMPLOYEE_TYPES[number],
					phone: existingEmployee.phone ?? "",
					email: existingEmployee.email ?? "",
					nationalId: existingEmployee.nationalId ?? "",
					salaryType: existingEmployee.salaryType as "MONTHLY" | "DAILY",
					baseSalary: Number(existingEmployee.baseSalary),
					housingAllowance: Number(existingEmployee.housingAllowance),
					transportAllowance: Number(existingEmployee.transportAllowance),
					otherAllowances: Number(existingEmployee.otherAllowances),
					gosiSubscription: Number(existingEmployee.gosiSubscription),
					joinDate: new Date(existingEmployee.joinDate).toISOString().split("T")[0],
					notes: existingEmployee.notes ?? "",
				}
			: undefined,
	});

	const createMutation = useMutation({
		mutationFn: async (data: FormValues) => {
			return orpcClient.company.employees.create({
				organizationId,
				...data,
				joinDate: new Date(data.joinDate),
			});
		},
		onSuccess: () => {
			toast.success(t("company.employees.createSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.employees.list.queryOptions({ input: { organizationId } }).queryKey });
			router.push(`/app/${organizationSlug}/company/employees`);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.employees.createError"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: FormValues) => {
			return orpcClient.company.employees.update({
				organizationId,
				id: employeeId!,
				...data,
				joinDate: new Date(data.joinDate),
			});
		},
		onSuccess: () => {
			toast.success(t("company.employees.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.employees.list.queryOptions({ input: { organizationId } }).queryKey });
			router.push(`/app/${organizationSlug}/company/employees/${employeeId}`);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.employees.updateError"));
		},
	});

	const onSubmit = (data: FormValues) => {
		if (isEditing) {
			updateMutation.mutate(data);
		} else {
			createMutation.mutate(data);
		}
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
				{/* Basic Info */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
					<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
						<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
							<Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{t("company.employees.basicInfo")}
						</h3>
					</div>
					<div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
						<FormField control={form.control} name="name" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.name")}</FormLabel>
								<FormControl><Input className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="employeeNo" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.employeeNo")}</FormLabel>
								<FormControl><Input className="rounded-xl bg-slate-50 dark:bg-slate-800/50" readOnly disabled {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="type" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.type")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
									<SelectContent className="rounded-xl">
										{EMPLOYEE_TYPES.map((type) => (
											<SelectItem key={type} value={type}>{t(`company.employees.types.${type}`)}</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="joinDate" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.joinDate")}</FormLabel>
								<FormControl><Input type="date" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="phone" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.phone")}</FormLabel>
								<FormControl><Input className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="email" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.email")}</FormLabel>
								<FormControl><Input type="email" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="nationalId" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.nationalId")}</FormLabel>
								<FormControl><Input className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
					</div>
				</div>

				{/* Financial Info */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
					<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
						<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
							<Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{t("company.employees.financialInfo")}
						</h3>
					</div>
					<div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<FormField control={form.control} name="salaryType" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.salaryType")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
									<SelectContent className="rounded-xl">
										<SelectItem value="MONTHLY">{t("company.employees.monthly")}</SelectItem>
										<SelectItem value="DAILY">{t("company.employees.daily")}</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="baseSalary" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.baseSalary")}</FormLabel>
								<FormControl><Input type="number" step="0.01" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="housingAllowance" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.housingAllowance")}</FormLabel>
								<FormControl><Input type="number" step="0.01" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="transportAllowance" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.transportAllowance")}</FormLabel>
								<FormControl><Input type="number" step="0.01" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="otherAllowances" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.otherAllowances")}</FormLabel>
								<FormControl><Input type="number" step="0.01" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="gosiSubscription" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.employees.gosiSubscription")}</FormLabel>
								<FormControl><Input type="number" step="0.01" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
					</div>
				</div>

				{/* Notes */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
					<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
						<div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
							<FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
						</div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{t("company.common.notes")}
						</h3>
					</div>
					<div className="p-5">
						<FormField control={form.control} name="notes" render={({ field }) => (
							<FormItem>
								<FormControl><Textarea rows={3} className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
					</div>
				</div>

				<div className="flex gap-3">
					<Button
						type="submit"
						disabled={isPending}
						className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
					>
						{isPending
							? t("company.common.saving")
							: isEditing
								? t("company.common.update")
								: t("company.common.create")}
					</Button>
					<Button
						type="button"
						variant="outline"
						className="rounded-xl"
						onClick={() => router.back()}
					>
						{t("company.common.cancel")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
