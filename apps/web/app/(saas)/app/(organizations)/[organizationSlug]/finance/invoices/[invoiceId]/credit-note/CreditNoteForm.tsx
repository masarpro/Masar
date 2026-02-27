"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { toast } from "sonner";
import { FileMinus, FileText, ArrowLeft } from "lucide-react";
import { Currency } from "@saas/finance/components/shared/Currency";
import { AmountSummary } from "@saas/finance/components/shared/AmountSummary";
import { StatusBadge } from "@saas/finance/components/shared/StatusBadge";
import { calculateTotals, formatDate } from "@saas/finance/lib/utils";

interface CreditNoteFormProps {
	organizationId: string;
	organizationSlug: string;
	invoiceId: string;
}

interface ReturnItem {
	originalItemId: string;
	description: string;
	maxQuantity: number;
	returnQuantity: number;
	unit: string;
	unitPrice: number;
}

export function CreditNoteForm({
	organizationId,
	organizationSlug,
	invoiceId,
}: CreditNoteFormProps) {
	const t = useTranslations();
	const router = useRouter();
	const basePath = `/app/${organizationSlug}/finance/invoices`;

	const [reason, setReason] = useState("");
	const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
	const [initialized, setInitialized] = useState(false);

	// Fetch the original invoice
	const { data: invoice, isLoading } = useQuery(
		orpc.finance.invoices.getById.queryOptions({
			input: { organizationId, id: invoiceId },
		}),
	);

	// Initialize return items from invoice data
	if (invoice && !initialized) {
		setReturnItems(
			invoice.items.map((item) => ({
				originalItemId: item.id,
				description: item.description,
				maxQuantity: item.quantity,
				returnQuantity: 0,
				unit: item.unit ?? "",
				unitPrice: item.unitPrice,
			})),
		);
		setInitialized(true);
	}

	// Calculate credit note totals from return items with quantity > 0
	const activeItems = returnItems.filter((item) => item.returnQuantity > 0);
	const totals = calculateTotals(
		activeItems.map((item) => ({
			quantity: item.returnQuantity,
			unitPrice: item.unitPrice,
		})),
		invoice?.discountPercent ?? 0,
		invoice?.vatPercent ?? 15,
	);

	// Create credit note mutation
	const createMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.invoices.createCreditNote({
				organizationId,
				id: invoiceId,
				reason,
				items: activeItems.map((item) => ({
					description: item.description,
					quantity: item.returnQuantity,
					unit: item.unit || undefined,
					unitPrice: item.unitPrice,
				})),
			});
		},
		onSuccess: (creditNote) => {
			toast.success(t("finance.invoices.creditNoteSuccess"));
			router.push(`${basePath}/${creditNote.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.creditNoteError"));
		},
	});

	const handleQuantityChange = (index: number, value: number) => {
		setReturnItems((prev) =>
			prev.map((item, i) =>
				i === index
					? {
							...item,
							returnQuantity: Math.max(0, Math.min(value, item.maxQuantity)),
						}
					: item,
			),
		);
	};

	const handleSubmit = () => {
		if (!reason.trim()) {
			toast.error(t("finance.invoices.creditNote.reason"));
			return;
		}
		if (activeItems.length === 0) {
			toast.error(t("finance.invoices.errors.itemsRequired"));
			return;
		}
		createMutation.mutate();
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-20">
				<div className="relative">
					<div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (!invoice) {
		return (
			<div className="text-center py-20">
				<p className="text-slate-500 dark:text-slate-400">
					{t("finance.invoices.notFound")}
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="flex items-center gap-3">
					<FileMinus className="h-6 w-6 text-pink-600" />
					<div>
						<h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
							{t("finance.invoices.creditNote.title")}
							{invoice && (
								<span className="text-base font-normal text-slate-500 dark:text-slate-400 ms-2">
									— {invoice.invoiceNo}
								</span>
							)}
						</h1>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							{t("finance.invoices.creditNote.subtitle")}
						</p>
					</div>
				</div>
				<Button
					variant="outline"
					onClick={() => router.push(`${basePath}/${invoiceId}`)}
					className="rounded-xl"
				>
					<ArrowLeft className="h-4 w-4 me-2" />
					{t("common.back")}
				</Button>
			</div>

			{/* Original Invoice Reference */}
			<Card className="rounded-2xl border-pink-200 dark:border-pink-800/50 bg-pink-50/50 dark:bg-pink-950/20">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-pink-900 dark:text-pink-200">
						<FileText className="h-5 w-5" />
						{t("finance.invoices.creditNote.originalInvoice")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 sm:grid-cols-4">
						<div>
							<Label className="text-sm text-pink-700 dark:text-pink-300">
								{t("finance.invoices.columns.number")}
							</Label>
							<p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">
								{invoice.invoiceNo}
							</p>
						</div>
						<div>
							<Label className="text-sm text-pink-700 dark:text-pink-300">
								{t("finance.invoices.columns.client")}
							</Label>
							<p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
								{invoice.clientName}
							</p>
						</div>
						<div>
							<Label className="text-sm text-pink-700 dark:text-pink-300">
								{t("finance.invoices.columns.amount")}
							</Label>
							<p className="font-semibold text-slate-900 dark:text-slate-100 mt-1">
								<Currency amount={invoice.totalAmount} />
							</p>
						</div>
						<div>
							<Label className="text-sm text-pink-700 dark:text-pink-300">
								{t("finance.invoices.columns.status")}
							</Label>
							<div className="mt-1">
								<StatusBadge status={invoice.status} type="invoice" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Reason */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.invoices.creditNote.reason")}</CardTitle>
				</CardHeader>
				<CardContent>
					<Textarea
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder={t("finance.invoices.creditNote.reasonPlaceholder")}
						rows={3}
						required
						className="rounded-xl"
					/>
				</CardContent>
			</Card>

			{/* Items Table with Return Quantity */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle>{t("finance.invoices.items")}</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50 dark:bg-slate-900/50">
									<TableHead className="font-medium">
										{t("finance.invoices.form.itemDescription")}
									</TableHead>
									<TableHead className="font-medium text-center">
										{t("finance.invoices.form.itemQuantity")}
									</TableHead>
									<TableHead className="font-medium text-center">
										{t("finance.invoices.creditNote.returnQuantity")}
									</TableHead>
									<TableHead className="font-medium text-center">
										{t("finance.invoices.form.itemUnit")}
									</TableHead>
									<TableHead className="font-medium text-end">
										{t("finance.invoices.form.itemUnitPrice")}
									</TableHead>
									<TableHead className="font-medium text-end">
										{t("finance.invoices.form.itemTotal")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{returnItems.map((item, index) => {
									const lineTotal = item.returnQuantity * item.unitPrice;
									const isActive = item.returnQuantity > 0;

									return (
										<TableRow
											key={item.originalItemId}
											className={
												isActive
													? "bg-pink-50/50 dark:bg-pink-950/10"
													: ""
											}
										>
											<TableCell className="font-medium">
												{item.description}
											</TableCell>
											<TableCell className="text-center text-slate-500">
												{item.maxQuantity}
											</TableCell>
											<TableCell className="text-center">
												<Input
													type="number"
													min={0}
													max={item.maxQuantity}
													step={1}
													value={item.returnQuantity}
													onChange={(e) =>
														handleQuantityChange(
															index,
															Number(e.target.value),
														)
													}
													className="w-24 mx-auto text-center rounded-xl"
												/>
											</TableCell>
											<TableCell className="text-center text-slate-500">
												{item.unit}
											</TableCell>
											<TableCell className="text-end">
												<Currency amount={item.unitPrice} />
											</TableCell>
											<TableCell className="text-end font-medium">
												{isActive ? (
													<span className="text-pink-600 dark:text-pink-400">
														<Currency amount={lineTotal} />
													</span>
												) : (
													<span className="text-slate-400">-</span>
												)}
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>

			{/* Credit Note Amount Summary */}
			{activeItems.length > 0 && (
				<div className="flex justify-end">
					<AmountSummary
						subtotal={totals.subtotal}
						discountPercent={invoice.discountPercent}
						discountAmount={totals.discountAmount}
						vatPercent={invoice.vatPercent}
						vatAmount={totals.vatAmount}
						totalAmount={totals.totalAmount}
					/>
				</div>
			)}

			{/* Submit */}
			<div className="flex justify-end gap-3">
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push(`${basePath}/${invoiceId}`)}
					className="rounded-xl"
				>
					{t("common.cancel")}
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={
						createMutation.isPending ||
						activeItems.length === 0 ||
						!reason.trim()
					}
					className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white"
				>
					<FileMinus className="h-4 w-4 me-2" />
					{createMutation.isPending
						? t("finance.invoices.creditNote.creating")
						: t("finance.invoices.creditNote.create")}
				</Button>
			</div>
		</div>
	);
}
