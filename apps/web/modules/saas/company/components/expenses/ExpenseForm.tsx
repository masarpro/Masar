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
import { Receipt, FileText } from "lucide-react";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
	"RENT", "UTILITIES", "COMMUNICATIONS", "INSURANCE", "LICENSES",
	"SUBSCRIPTIONS", "MAINTENANCE", "BANK_FEES", "MARKETING",
	"TRANSPORT", "HOSPITALITY", "OTHER",
] as const;

const RECURRENCE_TYPES = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL", "ONE_TIME"] as const;

const formSchema = z.object({
	name: z.string().min(1, "اسم المصروف مطلوب"),
	category: z.enum(EXPENSE_CATEGORIES),
	description: z.string().optional(),
	amount: z.coerce.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
	recurrence: z.enum(RECURRENCE_TYPES),
	vendor: z.string().optional(),
	contractNumber: z.string().optional(),
	startDate: z.string().min(1, "تاريخ البداية مطلوب"),
	endDate: z.string().optional(),
	reminderDays: z.coerce.number().min(0).optional(),
	notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ExpenseFormProps {
	organizationId: string;
	organizationSlug: string;
	expenseId?: string;
}

export function ExpenseForm({ organizationId, organizationSlug, expenseId }: ExpenseFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const isEditing = !!expenseId;

	const { data: existingExpense } = useQuery({
		...orpc.company.expenses.getById.queryOptions({
			input: { organizationId, id: expenseId! },
		}),
		enabled: isEditing,
	});

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			category: "RENT",
			description: "",
			amount: 0,
			recurrence: "MONTHLY",
			vendor: "",
			contractNumber: "",
			startDate: new Date().toISOString().split("T")[0],
			endDate: "",
			reminderDays: 5,
			notes: "",
		},
		values: existingExpense
			? {
					name: existingExpense.name,
					category: existingExpense.category as typeof EXPENSE_CATEGORIES[number],
					description: existingExpense.description ?? "",
					amount: Number(existingExpense.amount),
					recurrence: existingExpense.recurrence as typeof RECURRENCE_TYPES[number],
					vendor: existingExpense.vendor ?? "",
					contractNumber: existingExpense.contractNumber ?? "",
					startDate: new Date(existingExpense.startDate).toISOString().split("T")[0],
					endDate: existingExpense.endDate ? new Date(existingExpense.endDate).toISOString().split("T")[0] : "",
					reminderDays: existingExpense.reminderDays,
					notes: existingExpense.notes ?? "",
				}
			: undefined,
	});

	const createMutation = useMutation({
		mutationFn: async (data: FormValues) => {
			return orpcClient.company.expenses.create({
				organizationId,
				...data,
				startDate: new Date(data.startDate),
				endDate: data.endDate ? new Date(data.endDate) : undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("company.expenses.createSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.expenses.list.queryOptions({ input: { organizationId } }).queryKey });
			router.push(`/app/${organizationSlug}/company/expenses`);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.expenses.createError"));
		},
	});

	const updateMutation = useMutation({
		mutationFn: async (data: FormValues) => {
			return orpcClient.company.expenses.update({
				organizationId,
				id: expenseId!,
				...data,
				startDate: new Date(data.startDate),
				endDate: data.endDate ? new Date(data.endDate) : null,
			});
		},
		onSuccess: () => {
			toast.success(t("company.expenses.updateSuccess"));
			queryClient.invalidateQueries({ queryKey: orpc.company.expenses.list.queryOptions({ input: { organizationId } }).queryKey });
			router.push(`/app/${organizationSlug}/company/expenses/${expenseId}`);
		},
		onError: (error: Error) => {
			toast.error(error.message || t("company.expenses.updateError"));
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
							<Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						</div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{t("company.expenses.basicInfo")}
						</h3>
					</div>
					<div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
						<FormField control={form.control} name="name" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.expenses.name")}</FormLabel>
								<FormControl><Input className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="category" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.expenses.category")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
									<SelectContent className="rounded-xl">
										{EXPENSE_CATEGORIES.map((cat) => (
											<SelectItem key={cat} value={cat}>{t(`company.expenses.categories.${cat}`)}</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="amount" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.expenses.amount")}</FormLabel>
								<FormControl><Input type="number" step="0.01" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="recurrence" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.expenses.recurrence")}</FormLabel>
								<Select onValueChange={field.onChange} value={field.value}>
									<FormControl><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger></FormControl>
									<SelectContent className="rounded-xl">
										{RECURRENCE_TYPES.map((r) => (
											<SelectItem key={r} value={r}>{t(`company.expenses.recurrences.${r}`)}</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="vendor" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.expenses.vendor")}</FormLabel>
								<FormControl><Input className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="contractNumber" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.expenses.contractNumber")}</FormLabel>
								<FormControl><Input className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="startDate" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.expenses.startDate")}</FormLabel>
								<FormControl><Input type="date" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="endDate" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.expenses.endDate")}</FormLabel>
								<FormControl><Input type="date" className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="reminderDays" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.expenses.reminderDays")}</FormLabel>
								<FormControl><Input type="number" min={0} className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
					</div>
				</div>

				{/* Description & Notes */}
				<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 overflow-hidden">
					<div className="flex items-center gap-3 p-5 border-b border-white/10 dark:border-slate-700/30">
						<div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
							<FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" />
						</div>
						<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
							{t("company.expenses.description")}
						</h3>
					</div>
					<div className="p-5 space-y-4">
						<FormField control={form.control} name="description" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.expenses.description")}</FormLabel>
								<FormControl><Textarea rows={2} className="rounded-xl" {...field} /></FormControl>
								<FormMessage />
							</FormItem>
						)} />
						<FormField control={form.control} name="notes" render={({ field }) => (
							<FormItem>
								<FormLabel>{t("company.common.notes")}</FormLabel>
								<FormControl><Textarea rows={2} className="rounded-xl" {...field} /></FormControl>
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
					<Button type="button" variant="outline" className="rounded-xl" onClick={() => router.back()}>
						{t("company.common.cancel")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
