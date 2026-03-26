"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@ui/components/form";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@ui/components/select";
import { toast } from "sonner";
import { ArrowRight, Save, Send } from "lucide-react";

interface PaymentVoucherFormProps {
	organizationId: string;
	organizationSlug: string;
}

const formSchema = z.object({
	date: z.string().min(1),
	amount: z.number().positive(),
	payeeName: z.string().min(1).max(200),
	payeeType: z.enum(["SUBCONTRACTOR", "SUPPLIER", "EMPLOYEE", "OTHER"]),
	paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"]),
	projectId: z.string().optional(),
	subcontractContractId: z.string().optional(),
	sourceAccountId: z.string().optional(),
	checkNumber: z.string().optional(),
	checkDate: z.string().optional(),
	checkBank: z.string().optional(),
	bankName: z.string().optional(),
	transferRef: z.string().optional(),
	description: z.string().optional(),
	notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function PaymentVoucherForm({
	organizationId,
	organizationSlug,
}: PaymentVoucherFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [submitAfterCreate, setSubmitAfterCreate] = useState(false);

	const basePath = `/app/${organizationSlug}/finance/payment-vouchers`;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			date: new Date().toISOString().split("T")[0],
			amount: 0,
			payeeName: "",
			payeeType: "SUPPLIER",
			paymentMethod: "BANK_TRANSFER",
			description: "",
			notes: "",
		},
	});

	const paymentMethod = form.watch("paymentMethod");

	const { data: banks } = useQuery(
		orpc.finance.banks.list.queryOptions({ input: { organizationId } }),
	);

	const createMutation = useMutation({
		mutationFn: async (data: FormValues) => {
			return orpcClient.finance.disbursements.create({
				organizationId,
				date: data.date,
				amount: data.amount,
				payeeName: data.payeeName,
				payeeType: data.payeeType,
				paymentMethod: data.paymentMethod,
				projectId: data.projectId || undefined,
				subcontractContractId: data.subcontractContractId || undefined,
				sourceAccountId: data.sourceAccountId || undefined,
				checkNumber: data.checkNumber || undefined,
				checkDate: data.checkDate || undefined,
				checkBank: data.checkBank || undefined,
				bankName: data.bankName || undefined,
				transferRef: data.transferRef || undefined,
				description: data.description || undefined,
				notes: data.notes || undefined,
			});
		},
		onSuccess: async (voucher) => {
			if (submitAfterCreate) {
				try {
					await orpcClient.finance.disbursements.submit({
						organizationId,
						id: voucher.id,
					});
					toast.success(t("finance.paymentVouchers.actions.submit"));
				} catch {
					toast.error(t("common.error"));
				}
			}
			queryClient.invalidateQueries({ queryKey: ["finance", "disbursements"] });
			toast.success(t("finance.paymentVouchers.actions.create"));
			router.push(`${basePath}/${voucher.id}`);
		},
		onError: () => toast.error(t("common.error")),
	});

	const onSubmit = (data: FormValues) => createMutation.mutate(data);

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="icon" onClick={() => router.push(basePath)}>
					<ArrowRight className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">{t("finance.paymentVouchers.new")}</h1>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
					{/* Basic Info */}
					<Card>
						<CardHeader><CardTitle>{t("finance.payments.basicInfo")}</CardTitle></CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField control={form.control} name="date" render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("finance.paymentVouchers.date")}</FormLabel>
									<FormControl><Input type="date" {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<FormField control={form.control} name="amount" render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("finance.paymentVouchers.amount")}</FormLabel>
									<FormControl><Input type="number" step="0.01" min="0.01" {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<FormField control={form.control} name="payeeName" render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("finance.paymentVouchers.payeeName")}</FormLabel>
									<FormControl><Input {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<FormField control={form.control} name="payeeType" render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("finance.paymentVouchers.payeeType")}</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
										<SelectContent>
											<SelectItem value="SUBCONTRACTOR">{t("finance.paymentVouchers.payeeTypes.SUBCONTRACTOR")}</SelectItem>
											<SelectItem value="SUPPLIER">{t("finance.paymentVouchers.payeeTypes.SUPPLIER")}</SelectItem>
											<SelectItem value="EMPLOYEE">{t("finance.paymentVouchers.payeeTypes.EMPLOYEE")}</SelectItem>
											<SelectItem value="OTHER">{t("finance.paymentVouchers.payeeTypes.OTHER")}</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)} />
						</CardContent>
					</Card>

					{/* Payment Method */}
					<Card>
						<CardHeader><CardTitle>{t("finance.paymentVouchers.paymentMethod")}</CardTitle></CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField control={form.control} name="paymentMethod" render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("finance.paymentVouchers.paymentMethod")}</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
										<SelectContent>
											<SelectItem value="CASH">{t("finance.payments.methods.CASH")}</SelectItem>
											<SelectItem value="BANK_TRANSFER">{t("finance.payments.methods.BANK_TRANSFER")}</SelectItem>
											<SelectItem value="CHEQUE">{t("finance.payments.methods.CHEQUE")}</SelectItem>
											<SelectItem value="CREDIT_CARD">{t("finance.payments.methods.CREDIT_CARD")}</SelectItem>
											<SelectItem value="OTHER">{t("finance.payments.methods.OTHER")}</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)} />
							<FormField control={form.control} name="sourceAccountId" render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("finance.paymentVouchers.sourceAccount")}</FormLabel>
									<Select onValueChange={field.onChange} value={field.value ?? ""}>
										<FormControl>
											<SelectTrigger><SelectValue placeholder={t("finance.payments.selectAccountPlaceholder")} /></SelectTrigger>
										</FormControl>
										<SelectContent>
											{(banks as any)?.banks?.map((bank: any) => (
												<SelectItem key={bank.id} value={bank.id}>{bank.name}</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)} />

							{paymentMethod === "CHEQUE" && (
								<>
									<FormField control={form.control} name="checkNumber" render={({ field }: any) => (
										<FormItem>
											<FormLabel>{t("finance.paymentVouchers.checkNumber")}</FormLabel>
											<FormControl><Input {...field} /></FormControl>
											<FormMessage />
										</FormItem>
									)} />
									<FormField control={form.control} name="checkDate" render={({ field }: any) => (
										<FormItem>
											<FormLabel>{t("finance.paymentVouchers.checkDate")}</FormLabel>
											<FormControl><Input type="date" {...field} /></FormControl>
											<FormMessage />
										</FormItem>
									)} />
									<FormField control={form.control} name="checkBank" render={({ field }: any) => (
										<FormItem>
											<FormLabel>{t("finance.paymentVouchers.checkBank")}</FormLabel>
											<FormControl><Input {...field} /></FormControl>
											<FormMessage />
										</FormItem>
									)} />
								</>
							)}

							{paymentMethod === "BANK_TRANSFER" && (
								<>
									<FormField control={form.control} name="transferRef" render={({ field }: any) => (
										<FormItem>
											<FormLabel>{t("finance.paymentVouchers.transferRef")}</FormLabel>
											<FormControl><Input {...field} /></FormControl>
											<FormMessage />
										</FormItem>
									)} />
									<FormField control={form.control} name="bankName" render={({ field }: any) => (
										<FormItem>
											<FormLabel>{t("finance.paymentVouchers.bankName")}</FormLabel>
											<FormControl><Input {...field} /></FormControl>
											<FormMessage />
										</FormItem>
									)} />
								</>
							)}
						</CardContent>
					</Card>

					{/* Description */}
					<Card>
						<CardContent className="grid grid-cols-1 gap-4 pt-6">
							<FormField control={form.control} name="description" render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("finance.paymentVouchers.description")}</FormLabel>
									<FormControl><Textarea rows={2} {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
							<FormField control={form.control} name="notes" render={({ field }: any) => (
								<FormItem>
									<FormLabel>{t("finance.paymentVouchers.notes")}</FormLabel>
									<FormControl><Textarea rows={2} {...field} /></FormControl>
									<FormMessage />
								</FormItem>
							)} />
						</CardContent>
					</Card>

					{/* Actions */}
					<div className="flex gap-3">
						<Button
							type="submit"
							variant="outline"
							disabled={createMutation.isPending}
							onClick={() => setSubmitAfterCreate(false)}
						>
							<Save className="me-2 h-4 w-4" />
							{t("finance.paymentVouchers.actions.saveAsDraft")}
						</Button>
						<Button
							type="submit"
							disabled={createMutation.isPending}
							onClick={() => setSubmitAfterCreate(true)}
						>
							<Send className="me-2 h-4 w-4" />
							{t("finance.paymentVouchers.actions.saveAndSubmit")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
