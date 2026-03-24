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
import { toast } from "sonner";
import { ArrowRight, Save, Send } from "lucide-react";

interface ReceiptVoucherFormProps {
	organizationId: string;
	organizationSlug: string;
}

const formSchema = z.object({
	date: z.string().min(1),
	amount: z.coerce.number().positive(),
	receivedFrom: z.string().min(1).max(200),
	paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CREDIT_CARD", "OTHER"]),
	clientId: z.string().optional(),
	projectId: z.string().optional(),
	destinationAccountId: z.string().optional(),
	checkNumber: z.string().optional(),
	checkDate: z.string().optional(),
	checkBank: z.string().optional(),
	bankName: z.string().optional(),
	transferRef: z.string().optional(),
	description: z.string().optional(),
	notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ReceiptVoucherForm({
	organizationId,
	organizationSlug,
}: ReceiptVoucherFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [issueAfterCreate, setIssueAfterCreate] = useState(false);

	const basePath = `/app/${organizationSlug}/finance/receipt-vouchers`;

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			date: new Date().toISOString().split("T")[0],
			amount: 0,
			receivedFrom: "",
			paymentMethod: "BANK_TRANSFER",
			description: "",
			notes: "",
		},
	});

	const paymentMethod = form.watch("paymentMethod");

	// Fetch lists for selectors
	const { data: clients } = useQuery(
		orpc.finance.clients.list.queryOptions({
			input: { organizationId },
		}),
	);

	const { data: banks } = useQuery(
		orpc.finance.banks.list.queryOptions({
			input: { organizationId },
		}),
	);

	// Create mutation
	const createMutation = useMutation({
		mutationFn: async (data: FormValues) => {
			return orpcClient.finance.receipts.create({
				organizationId,
				date: data.date,
				amount: data.amount,
				receivedFrom: data.receivedFrom,
				paymentMethod: data.paymentMethod,
				clientId: data.clientId || undefined,
				projectId: data.projectId || undefined,
				destinationAccountId: data.destinationAccountId || undefined,
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
			if (issueAfterCreate) {
				try {
					await orpcClient.finance.receipts.issue({
						organizationId,
						id: voucher.id,
					});
					toast.success(t("finance.receiptVouchers.actions.issue"));
				} catch {
					toast.error(t("common.error"));
				}
			}
			queryClient.invalidateQueries({ queryKey: ["finance", "receipts"] });
			toast.success(t("finance.receiptVouchers.actions.create"));
			router.push(`${basePath}/${voucher.id}`);
		},
		onError: () => {
			toast.error(t("common.error"));
		},
	});

	const onSubmit = (data: FormValues) => {
		createMutation.mutate(data);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => router.push(basePath)}
				>
					<ArrowRight className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">{t("finance.receiptVouchers.new")}</h1>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					{/* Basic Info */}
					<Card>
						<CardHeader>
							<CardTitle>{t("finance.payments.basicInfo")}</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="date"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("finance.receiptVouchers.date")}</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("finance.receiptVouchers.amount")}</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												min="0.01"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="receivedFrom"
								render={({ field }) => (
									<FormItem className="md:col-span-2">
										<FormLabel>{t("finance.receiptVouchers.receivedFrom")}</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* Payment Method */}
					<Card>
						<CardHeader>
							<CardTitle>{t("finance.receiptVouchers.paymentMethod")}</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="paymentMethod"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("finance.receiptVouchers.paymentMethod")}</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
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
								)}
							/>
							<FormField
								control={form.control}
								name="destinationAccountId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("finance.receiptVouchers.destinationAccount")}</FormLabel>
										<Select onValueChange={field.onChange} value={field.value ?? ""}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("finance.payments.selectAccountPlaceholder")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{(banks as any)?.banks?.map((bank: any) => (
													<SelectItem key={bank.id} value={bank.id}>
														{bank.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Conditional fields for CHEQUE */}
							{paymentMethod === "CHEQUE" && (
								<>
									<FormField
										control={form.control}
										name="checkNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("finance.receiptVouchers.checkNumber")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="checkDate"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("finance.receiptVouchers.checkDate")}</FormLabel>
												<FormControl>
													<Input type="date" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="checkBank"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("finance.receiptVouchers.checkBank")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</>
							)}

							{/* Conditional fields for BANK_TRANSFER */}
							{paymentMethod === "BANK_TRANSFER" && (
								<>
									<FormField
										control={form.control}
										name="transferRef"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("finance.receiptVouchers.transferRef")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="bankName"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("finance.receiptVouchers.bankName")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</>
							)}
						</CardContent>
					</Card>

					{/* Client & Project */}
					<Card>
						<CardHeader>
							<CardTitle>{t("finance.payments.clientInfo")}</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="clientId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("finance.payments.selectClient")}</FormLabel>
										<Select onValueChange={field.onChange} value={field.value ?? ""}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder={t("finance.payments.selectClientPlaceholder")} />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{(clients as any)?.clients?.map((client: any) => (
													<SelectItem key={client.id} value={client.id}>
														{client.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* Description */}
					<Card>
						<CardContent className="grid grid-cols-1 gap-4 pt-6">
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t("finance.receiptVouchers.description")}</FormLabel>
										<FormControl>
											<Textarea rows={2} {...field} />
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
										<FormLabel>{t("finance.receiptVouchers.notes")}</FormLabel>
										<FormControl>
											<Textarea rows={2} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					{/* Actions */}
					<div className="flex gap-3">
						<Button
							type="submit"
							variant="outline"
							disabled={createMutation.isPending}
							onClick={() => setIssueAfterCreate(false)}
						>
							<Save className="me-2 h-4 w-4" />
							{t("finance.receiptVouchers.actions.saveAsDraft")}
						</Button>
						<Button
							type="submit"
							disabled={createMutation.isPending}
							onClick={() => setIssueAfterCreate(true)}
						>
							<Send className="me-2 h-4 w-4" />
							{t("finance.receiptVouchers.actions.saveAndIssue")}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
