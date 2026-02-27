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
import { toast } from "sonner";
import {
	FileMinus,
	FileText,
	ArrowRight,
	ChevronLeft,
	Package,
	MessageSquare,
	Calculator,
} from "lucide-react";
import Link from "next/link";
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
			<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100/40 to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
				<div className="flex items-center justify-center py-20">
					<div className="relative">
						<div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
						<div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
					</div>
				</div>
			</div>
		);
	}

	if (!invoice) {
		return (
			<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100/40 to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
				<div className="text-center py-20">
					<p className="text-slate-500 dark:text-slate-400">
						{t("finance.invoices.notFound")}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100/40 to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
			{/* ─── Sticky Header ────────────────────────────────── */}
			<div className="sticky top-0 z-20 py-3 px-4 mb-6 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Link href={`${basePath}/${invoiceId}`}>
							<Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800">
								<ArrowRight className="h-4 w-4" />
							</Button>
						</Link>
						<div className="flex items-center gap-1.5 text-sm">
							<Link href={`/app/${organizationSlug}/finance`} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
								{t("finance.title")}
							</Link>
							<ChevronLeft className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
							<Link href={basePath} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
								{t("finance.invoices.title")}
							</Link>
							<ChevronLeft className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
							<Link href={`${basePath}/${invoiceId}`} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
								{invoice.invoiceNo}
							</Link>
							<ChevronLeft className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
							<span className="text-slate-700 dark:text-slate-200 font-medium">
								{t("finance.invoices.creditNote.title")}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
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
							className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white gap-2"
						>
							<FileMinus className="h-4 w-4" />
							{createMutation.isPending
								? t("finance.invoices.creditNote.creating")
								: t("finance.invoices.creditNote.create")}
						</Button>
					</div>
				</div>
			</div>

			<div className="space-y-5 max-w-5xl mx-auto">
				{/* ─── Original Invoice Reference ────────────────── */}
				<div className="bg-pink-50/80 dark:bg-pink-950/20 backdrop-blur-sm rounded-2xl border border-pink-200/80 dark:border-pink-800/40 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] p-5">
					<div className="flex items-center gap-3 mb-4">
						<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-sm">
							<FileText className="h-4.5 w-4.5 text-white" />
						</div>
						<h3 className="font-semibold text-slate-900 dark:text-slate-100">
							{t("finance.invoices.creditNote.originalInvoice")}
						</h3>
					</div>
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
				</div>

				{/* ─── Reason ─────────────────────────────────────── */}
				<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] p-5">
					<div className="flex items-center gap-3 mb-4">
						<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
							<MessageSquare className="h-4.5 w-4.5 text-white" />
						</div>
						<h3 className="font-semibold text-slate-900 dark:text-slate-100">
							{t("finance.invoices.creditNote.reason")}
						</h3>
					</div>
					<Textarea
						value={reason}
						onChange={(e) => setReason(e.target.value)}
						placeholder={t("finance.invoices.creditNote.reasonPlaceholder")}
						rows={3}
						required
						className="rounded-xl"
					/>
				</div>

				{/* ─── Items Table with Return Quantity ───────────── */}
				<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] p-5">
					<div className="flex items-center gap-3 mb-4">
						<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
							<Package className="h-4.5 w-4.5 text-white" />
						</div>
						<h3 className="font-semibold text-slate-900 dark:text-slate-100">
							{t("finance.invoices.items")}
						</h3>
						{activeItems.length > 0 && (
							<span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 font-medium">
								{activeItems.length}
							</span>
						)}
					</div>
					<div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
						<table className="w-full">
							<thead>
								<tr className="bg-slate-50/80 dark:bg-slate-900/50">
									<th className="py-3 px-4 text-start text-sm font-medium text-slate-500 dark:text-slate-400">
										{t("finance.invoices.form.itemDescription")}
									</th>
									<th className="py-3 px-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
										{t("finance.invoices.form.itemQuantity")}
									</th>
									<th className="py-3 px-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
										{t("finance.invoices.creditNote.returnQuantity")}
									</th>
									<th className="py-3 px-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
										{t("finance.invoices.form.itemUnit")}
									</th>
									<th className="py-3 px-3 text-end text-sm font-medium text-slate-500 dark:text-slate-400">
										{t("finance.invoices.form.itemUnitPrice")}
									</th>
									<th className="py-3 px-4 text-end text-sm font-medium text-slate-500 dark:text-slate-400">
										{t("finance.invoices.form.itemTotal")}
									</th>
								</tr>
							</thead>
							<tbody>
								{returnItems.map((item, index) => {
									const lineTotal = -(item.returnQuantity * item.unitPrice);
									const isActive = item.returnQuantity > 0;

									return (
										<tr
											key={item.originalItemId}
											className={`border-t border-slate-100 dark:border-slate-800 transition-colors ${
												isActive
													? "bg-pink-50/50 dark:bg-pink-950/10"
													: ""
											}`}
										>
											<td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
												{item.description}
											</td>
											<td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400">
												{item.maxQuantity}
											</td>
											<td className="py-3 px-3 text-center">
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
											</td>
											<td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400">
												{item.unit}
											</td>
											<td className="py-3 px-3 text-end text-slate-700 dark:text-slate-300">
												<Currency amount={item.unitPrice} />
											</td>
											<td className="py-3 px-4 text-end font-medium">
												{isActive ? (
													<span className="text-pink-600 dark:text-pink-400">
														<Currency amount={lineTotal} />
													</span>
												) : (
													<span className="text-slate-400">-</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>

				{/* ─── Credit Note Amount Summary ─────────────────── */}
				{activeItems.length > 0 && (
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] p-5">
						<div className="flex items-center gap-3 mb-4">
							<div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
								<Calculator className="h-4.5 w-4.5 text-white" />
							</div>
							<h3 className="font-semibold text-slate-900 dark:text-slate-100">
								{t("finance.summary.title")}
							</h3>
						</div>
						<div className="flex justify-end">
							<AmountSummary
								subtotal={-totals.subtotal}
								discountPercent={invoice.discountPercent}
								discountAmount={-totals.discountAmount}
								vatPercent={invoice.vatPercent}
								vatAmount={-totals.vatAmount}
								totalAmount={-totals.totalAmount}
							/>
						</div>
					</div>
				)}
			</div>

			{/* ─── Mobile Bottom Bar ─────────────────────────────── */}
			<div className="fixed bottom-0 inset-x-0 z-30 p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-800/60 sm:hidden">
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => router.push(`${basePath}/${invoiceId}`)}
						className="flex-1 rounded-xl"
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
						className="flex-1 rounded-xl bg-pink-600 hover:bg-pink-700 text-white gap-2"
					>
						<FileMinus className="h-4 w-4" />
						{createMutation.isPending
							? t("finance.invoices.creditNote.creating")
							: t("finance.invoices.creditNote.create")}
					</Button>
				</div>
			</div>
		</div>
	);
}
