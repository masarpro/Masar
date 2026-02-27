"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Textarea } from "@ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@ui/components/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import { toast } from "sonner";
import {
	Edit,
	Printer,
	CreditCard,
	MoreVertical,
	FileCheck,
	FileMinus,
	Copy,
	Send,
	Ban,
	Plus,
	Trash2,
	FileText,
	Clock,
	User,
	CalendarDays,
	Link2,
	Hash,
	QrCode,
	ExternalLink,
} from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { Currency } from "../shared/Currency";
import { formatDate, formatDateTime } from "../../lib/utils";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface InvoiceViewProps {
	organizationId: string;
	organizationSlug: string;
	invoiceId: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Invoice type labels (Arabic)
// ═══════════════════════════════════════════════════════════════════════════

// Invoice type label keys for i18n lookup
const INVOICE_TYPE_KEYS: Record<string, string> = {
	STANDARD: "standard",
	TAX: "tax",
	SIMPLIFIED: "simplified",
	CREDIT_NOTE: "credit_note",
	DEBIT_NOTE: "debit_note",
};

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export function InvoiceView({
	organizationId,
	organizationSlug,
	invoiceId,
}: InvoiceViewProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/finance/invoices`;

	// ─── State ────────────────────────────────────────────────────────────
	const [issueDialogOpen, setIssueDialogOpen] = useState(false);
	const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
	const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null);

	// Payment form state
	const [newPaymentAmount, setNewPaymentAmount] = useState("");
	const [newPaymentDate, setNewPaymentDate] = useState(() =>
		new Date().toISOString().split("T")[0],
	);
	const [newPaymentMethod, setNewPaymentMethod] = useState("");
	const [newPaymentReference, setNewPaymentReference] = useState("");
	const [newPaymentNotes, setNewPaymentNotes] = useState("");

	// ─── Queries ──────────────────────────────────────────────────────────
	const { data: invoice, isLoading } = useQuery(
		orpc.finance.invoices.getById.queryOptions({
			input: { organizationId, id: invoiceId },
		}),
	);

	// ─── Derived state ───────────────────────────────────────────────────
	const isDraft = invoice?.status === "DRAFT";
	const isPaid = invoice?.status === "PAID";
	const isCancelled = invoice?.status === "CANCELLED";
	const canAddPayment = !isDraft && !isPaid && !isCancelled;
	const canCreditNote = !isDraft && !isCancelled;
	const remainingAmount = invoice
		? invoice.totalAmount - invoice.paidAmount
		: 0;

	// ─── Mutations ────────────────────────────────────────────────────────

	// Issue invoice (DRAFT -> ISSUED)
	const issueMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.invoices.issue({
				organizationId,
				id: invoiceId,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.issueSuccess"));
			setIssueDialogOpen(false);
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.issueError"));
		},
	});

	// Update status
	const statusMutation = useMutation({
		mutationFn: async (
			status: "DRAFT" | "SENT" | "VIEWED" | "OVERDUE" | "CANCELLED",
		) => {
			await orpcClient.finance.invoices.updateStatus({
				organizationId,
				id: invoiceId,
				status,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.updateSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.statusUpdateError"));
		},
	});

	// Duplicate invoice
	const duplicateMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.invoices.duplicate({
				organizationId,
				id: invoiceId,
			});
		},
		onSuccess: (data) => {
			toast.success(t("finance.invoices.duplicateSuccess"));
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
			router.push(`${basePath}/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.duplicateError"));
		},
	});

	// Add payment
	const addPaymentMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.invoices.addPayment({
				organizationId,
				id: invoiceId,
				amount: parseFloat(newPaymentAmount),
				paymentDate: new Date(newPaymentDate).toISOString(),
				paymentMethod: newPaymentMethod || undefined,
				referenceNo: newPaymentReference || undefined,
				notes: newPaymentNotes || undefined,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.paymentAddSuccess"));
			setPaymentDialogOpen(false);
			resetPaymentForm();
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.paymentAddError"));
		},
	});

	// Delete payment
	const deletePaymentMutation = useMutation({
		mutationFn: async (paymentId: string) => {
			return orpcClient.finance.invoices.deletePayment({
				organizationId,
				invoiceId,
				paymentId,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.paymentDeleteSuccess"));
			setDeletePaymentId(null);
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.paymentDeleteError"));
		},
	});

	// ─── Helpers ──────────────────────────────────────────────────────────

	const resetPaymentForm = () => {
		setNewPaymentAmount("");
		setNewPaymentDate(new Date().toISOString().split("T")[0]);
		setNewPaymentMethod("");
		setNewPaymentReference("");
		setNewPaymentNotes("");
	};

	// ─── Loading / Not found ─────────────────────────────────────────────

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

	// ─── Render ──────────────────────────────────────────────────────────

	return (
		<div className="space-y-6">
			{/* ═══════ Action Bar ═══════ */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				{/* Left: Invoice number + status */}
				<div className="flex items-center gap-3">
					<h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
						{invoice.invoiceNo}
					</h1>
					<StatusBadge status={invoice.status} type="invoice" />
				</div>

				{/* Right: Action buttons */}
				<div className="flex items-center gap-2 flex-wrap">
					{/* Edit — DRAFT only */}
					{isDraft && (
						<Button
							variant="outline"
							onClick={() =>
								router.push(`${basePath}/${invoiceId}/edit`)
							}
							className="rounded-xl"
						>
							<Edit className="h-4 w-4 me-2" />
							{t("finance.actions.edit")}
						</Button>
					)}

					{/* Issue Invoice — DRAFT only */}
					{isDraft && (
						<Button
							onClick={() => setIssueDialogOpen(true)}
							className="rounded-xl"
						>
							<FileCheck className="h-4 w-4 me-2" />
							{t("finance.invoices.issueInvoice")}
						</Button>
					)}

					{/* Print */}
					<Button
						variant="outline"
						onClick={() =>
							router.push(`${basePath}/${invoiceId}/preview`)
						}
						className="rounded-xl"
					>
						<Printer className="h-4 w-4 me-2" />
						{t("finance.actions.print")}
					</Button>

					{/* Add Payment — non-DRAFT, non-PAID, non-CANCELLED */}
					{canAddPayment && (
						<Button
							variant="outline"
							onClick={() => setPaymentDialogOpen(true)}
							className="rounded-xl"
						>
							<CreditCard className="h-4 w-4 me-2" />
							{t("finance.invoices.addPayment")}
						</Button>
					)}

					{/* More dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="icon" className="rounded-xl">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="rounded-xl">
							{/* Credit Note — non-DRAFT, non-CANCELLED */}
							{canCreditNote && (
								<DropdownMenuItem
									onClick={() =>
										router.push(
											`${basePath}/${invoiceId}/credit-note`,
										)
									}
								>
									<FileMinus className="h-4 w-4 me-2" />
									{t("finance.actions.creditNote")}
								</DropdownMenuItem>
							)}

							{/* Send — DRAFT -> SENT */}
							{isDraft && (
								<DropdownMenuItem
									onClick={() => statusMutation.mutate("SENT")}
									disabled={statusMutation.isPending}
								>
									<Send className="h-4 w-4 me-2" />
									{t("finance.invoices.actions.send")}
								</DropdownMenuItem>
							)}

							{/* Duplicate — always */}
							<DropdownMenuItem
								onClick={() => duplicateMutation.mutate()}
								disabled={duplicateMutation.isPending}
							>
								<Copy className="h-4 w-4 me-2" />
								{t("finance.actions.duplicate")}
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							{/* Cancel — non-CANCELLED, non-DRAFT */}
							{!isCancelled && !isDraft && (
								<DropdownMenuItem
									onClick={() => statusMutation.mutate("CANCELLED")}
									disabled={statusMutation.isPending}
									className="text-red-600"
								>
									<Ban className="h-4 w-4 me-2" />
									{t("finance.invoices.actions.cancel")}
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			{/* ═══════ Tabs ═══════ */}
			<Tabs defaultValue="invoice" className="w-full">
				<TabsList className="grid w-full grid-cols-3 rounded-xl max-w-md">
					<TabsTrigger value="invoice" className="rounded-xl">
						<FileText className="h-4 w-4 me-2" />
						{t("finance.invoices.tabs.invoice")}
					</TabsTrigger>
					<TabsTrigger value="details" className="rounded-xl">
						<Hash className="h-4 w-4 me-2" />
						{t("finance.invoices.tabs.details")}
					</TabsTrigger>
					<TabsTrigger value="activity" className="rounded-xl">
						<Clock className="h-4 w-4 me-2" />
						{t("finance.invoices.tabs.activity")}
					</TabsTrigger>
				</TabsList>

				{/* ─── Tab 1: Invoice (print-ready preview) ─────────────── */}
				<TabsContent value="invoice" className="mt-6">
					<InvoiceTabContent
						invoice={invoice}
						basePath={basePath}
						remainingAmount={remainingAmount}
					/>
				</TabsContent>

				{/* ─── Tab 2: Details ───────────────────────────────────── */}
				<TabsContent value="details" className="mt-6">
					<DetailsTabContent
						invoice={invoice}
						organizationSlug={organizationSlug}
						basePath={basePath}
						canAddPayment={canAddPayment}
						onDeletePayment={setDeletePaymentId}
					/>
				</TabsContent>

				{/* ─── Tab 3: Activity ──────────────────────────────────── */}
				<TabsContent value="activity" className="mt-6">
					<ActivityTabContent
						organizationId={organizationId}
						invoiceId={invoiceId}
					/>
				</TabsContent>
			</Tabs>

			{/* ═══════ Issue Invoice AlertDialog ═══════ */}
			<AlertDialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.invoices.issueConfirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.invoices.issueConfirmDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => issueMutation.mutate()}
							disabled={issueMutation.isPending}
							className="rounded-xl"
						>
							{issueMutation.isPending
								? t("common.saving")
								: t("finance.invoices.issueConfirmButton")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* ═══════ Add Payment Dialog ═══════ */}
			<Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
				<DialogContent className="sm:max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("finance.invoices.addPayment")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label>{t("finance.invoices.paymentAmount")} *</Label>
							<Input
								type="number"
								step="0.01"
								min="0"
								max={remainingAmount}
								value={newPaymentAmount}
								onChange={(e) => setNewPaymentAmount(e.target.value)}
								placeholder={t("finance.invoices.maxAmount")}
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.invoices.paymentDate")} *</Label>
							<Input
								type="date"
								value={newPaymentDate}
								onChange={(e) => setNewPaymentDate(e.target.value)}
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.invoices.paymentMethod")}</Label>
							<Select
								value={newPaymentMethod}
								onValueChange={setNewPaymentMethod}
							>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue
										placeholder={t(
											"finance.invoices.selectPaymentMethod",
										)}
									/>
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="CASH">
										{t("finance.paymentMethods.cash")}
									</SelectItem>
									<SelectItem value="BANK_TRANSFER">
										{t("finance.paymentMethods.bankTransfer")}
									</SelectItem>
									<SelectItem value="CHECK">
										{t("finance.paymentMethods.check")}
									</SelectItem>
									<SelectItem value="CREDIT_CARD">
										{t("finance.paymentMethods.creditCard")}
									</SelectItem>
									<SelectItem value="OTHER">
										{t("finance.paymentMethods.other")}
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("finance.invoices.referenceNo")}</Label>
							<Input
								value={newPaymentReference}
								onChange={(e) =>
									setNewPaymentReference(e.target.value)
								}
								placeholder={t(
									"finance.invoices.referenceNoPlaceholder",
								)}
								className="rounded-xl mt-1"
							/>
						</div>
						<div>
							<Label>{t("finance.invoices.paymentNotes")}</Label>
							<Textarea
								value={newPaymentNotes}
								onChange={(e) => setNewPaymentNotes(e.target.value)}
								rows={2}
								className="rounded-xl mt-1"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setPaymentDialogOpen(false)}
							className="rounded-xl"
						>
							{t("common.cancel")}
						</Button>
						<Button
							onClick={() => addPaymentMutation.mutate()}
							disabled={
								!newPaymentAmount ||
								parseFloat(newPaymentAmount) <= 0 ||
								addPaymentMutation.isPending
							}
							className="rounded-xl"
						>
							<Plus className="h-4 w-4 me-2" />
							{addPaymentMutation.isPending
								? t("common.saving")
								: t("finance.invoices.addPayment")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ═══════ Delete Payment AlertDialog ═══════ */}
			<AlertDialog
				open={!!deletePaymentId}
				onOpenChange={() => setDeletePaymentId(null)}
			>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("finance.invoices.deletePaymentTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("finance.invoices.deletePaymentDescription")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">
							{t("common.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={() =>
								deletePaymentId &&
								deletePaymentMutation.mutate(deletePaymentId)
							}
							disabled={deletePaymentMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{deletePaymentMutation.isPending
								? t("common.deleting")
								: t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 1: Invoice — print-ready preview
// ═══════════════════════════════════════════════════════════════════════════

function InvoiceTabContent({
	invoice,
	basePath,
	remainingAmount,
}: {
	invoice: any;
	basePath: string;
	remainingAmount: number;
}) {
	const t = useTranslations();

	const taxableAmount =
		invoice.subtotal - invoice.discountAmount;

	// Resolve seller info: frozen data from issuance → fallback to org finance settings
	const orgSettings = invoice.organizationSettings;
	const displaySellerName = invoice.sellerName || orgSettings?.companyNameAr || "";
	const displaySellerTaxNumber = invoice.sellerTaxNumber || orgSettings?.taxNumber || "";
	const displaySellerAddress = invoice.sellerAddress || orgSettings?.address || "";
	const displaySellerPhone = invoice.sellerPhone || orgSettings?.phone || "";
	const displaySellerCommercialReg = orgSettings?.commercialReg || "";
	const displaySellerEmail = orgSettings?.email || "";

	const isDraftInvoice = invoice.status === "DRAFT";

	return (
		<Card className="rounded-2xl max-w-4xl mx-auto relative overflow-hidden">
			{/* DRAFT Watermark */}
			{isDraftInvoice && (
				<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
					<span className="text-8xl font-bold text-slate-200/50 dark:text-slate-700/30 -rotate-45 select-none">
						{t("finance.invoices.status.draft")}
					</span>
				</div>
			)}
			<CardContent className="p-8">
				{/* ─── Header: Org name + QR code ─────────────────────── */}
				<div className="flex justify-between items-start mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
					<div className="space-y-1">
						{displaySellerName && (
							<h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
								{displaySellerName}
							</h2>
						)}
						{displaySellerTaxNumber && (
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("finance.invoices.sellerTaxNumber")}: {displaySellerTaxNumber}
							</p>
						)}
						{displaySellerCommercialReg && (
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{t("finance.invoices.commercialReg")}: {displaySellerCommercialReg}
							</p>
						)}
						{displaySellerAddress && (
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{displaySellerAddress}
							</p>
						)}
						{displaySellerPhone && (
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{displaySellerPhone}
							</p>
						)}
						{displaySellerEmail && (
							<p className="text-sm text-slate-500 dark:text-slate-400">
								{displaySellerEmail}
							</p>
						)}
					</div>
					{invoice.qrCode && (
						<div className="bg-white p-3 rounded-xl border border-slate-200 shrink-0">
							<img
								src={invoice.qrCode}
								alt="ZATCA QR Code"
								className="w-32 h-32"
								style={{ minWidth: "8rem", minHeight: "8rem" }}
							/>
						</div>
					)}
				</div>

				{/* ─── Title: Type label + Number + Dates ─────────────── */}
				<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
					<div>
						<h3 className="text-xl font-bold text-primary">
							{t(`finance.invoices.types.${INVOICE_TYPE_KEYS[invoice.invoiceType] || "standard"}`)}
						</h3>
						<p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
							{invoice.invoiceNo}
						</p>
					</div>
					<div className="text-end space-y-1">
						<div>
							<span className="text-sm text-slate-500 dark:text-slate-400">
								{t("finance.invoices.issueDate")}:{" "}
							</span>
							<span className="font-medium text-slate-900 dark:text-slate-100">
								{formatDate(invoice.issueDate)}
							</span>
						</div>
						<div>
							<span className="text-sm text-slate-500 dark:text-slate-400">
								{t("finance.invoices.dueDate")}:{" "}
							</span>
							<span className="font-medium text-slate-900 dark:text-slate-100">
								{formatDate(invoice.dueDate)}
							</span>
						</div>
					</div>
				</div>

				{/* ─── Client block ───────────────────────────────────── */}
				<div className="mb-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
					<h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
						{t("finance.invoices.clientInfo")}
					</h4>
					<p className="font-semibold text-lg text-slate-900 dark:text-slate-100">
						{invoice.clientName}
					</p>
					{invoice.clientCompany && (
						<p className="text-slate-600 dark:text-slate-400">
							{invoice.clientCompany}
						</p>
					)}
					{invoice.clientTaxNumber && (
						<p className="text-slate-600 dark:text-slate-400">
							{t("finance.invoices.taxNumber")}: {invoice.clientTaxNumber}
						</p>
					)}
					{invoice.clientAddress && (
						<p className="text-slate-600 dark:text-slate-400">
							{invoice.clientAddress}
						</p>
					)}
				</div>

				{/* ─── Items table ────────────────────────────────────── */}
				<div className="mb-8 overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b-2 border-slate-200 dark:border-slate-700">
								<th className="py-3 text-start text-sm font-medium text-slate-500 dark:text-slate-400 w-12">
									#
								</th>
								<th className="py-3 text-start text-sm font-medium text-slate-500 dark:text-slate-400">
									{t("finance.items.description")}
								</th>
								<th className="py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
									{t("finance.items.unit")}
								</th>
								<th className="py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
									{t("finance.items.quantity")}
								</th>
								<th className="py-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
									{t("finance.items.unitPrice")}
								</th>
								<th className="py-3 text-end text-sm font-medium text-slate-500 dark:text-slate-400">
									{t("finance.items.total")}
								</th>
							</tr>
						</thead>
						<tbody>
							{invoice.items.map(
								(item: any, index: number) => (
									<tr
										key={item.id}
										className="border-b border-slate-100 dark:border-slate-800"
									>
										<td className="py-3 text-slate-500 dark:text-slate-400">
											{index + 1}
										</td>
										<td className="py-3 text-slate-900 dark:text-slate-100">
											{item.description}
										</td>
										<td className="py-3 text-center text-slate-700 dark:text-slate-300">
											{item.unit || "-"}
										</td>
										<td className="py-3 text-center text-slate-700 dark:text-slate-300">
											{item.quantity}
										</td>
										<td className="py-3 text-center text-slate-700 dark:text-slate-300">
											<Currency amount={item.unitPrice} />
										</td>
										<td className="py-3 text-end font-medium text-slate-900 dark:text-slate-100">
											<Currency amount={item.totalPrice} />
										</td>
									</tr>
								),
							)}
						</tbody>
					</table>
				</div>

				{/* ─── Totals ─────────────────────────────────────────── */}
				<div className="flex justify-end mb-8">
					<div className="w-80 space-y-2">
						{/* Subtotal */}
						<div className="flex justify-between text-slate-700 dark:text-slate-300">
							<span>{t("finance.summary.subtotal")}</span>
							<span className="font-medium">
								<Currency amount={invoice.subtotal} />
							</span>
						</div>

						{/* Discount */}
						{invoice.discountAmount > 0 && (
							<>
								<div className="flex justify-between text-red-600 dark:text-red-400">
									<span>
										{t("finance.summary.discount")} (
										{invoice.discountPercent}%)
									</span>
									<span>
										-<Currency amount={invoice.discountAmount} />
									</span>
								</div>
								<div className="flex justify-between text-slate-700 dark:text-slate-300">
									<span>{t("finance.summary.taxableAmount")}</span>
									<span className="font-medium">
										<Currency amount={taxableAmount} />
									</span>
								</div>
							</>
						)}

						{/* VAT */}
						<div className="flex justify-between text-slate-700 dark:text-slate-300">
							<span>
								{t("finance.summary.vat")} ({invoice.vatPercent}%)
							</span>
							<span className="font-medium">
								<Currency amount={invoice.vatAmount} />
							</span>
						</div>

						{/* Total */}
						<div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-bold text-lg">
							<span className="text-slate-900 dark:text-slate-100">
								{t("finance.summary.total")}
							</span>
							<span className="text-primary">
								<Currency amount={invoice.totalAmount} />
							</span>
						</div>

						{/* Paid / Balance */}
						{invoice.paidAmount > 0 && (
							<>
								<div className="flex justify-between text-green-600 dark:text-green-400 pt-1">
									<span>{t("finance.invoices.paidAmount")}</span>
									<span>
										-<Currency amount={invoice.paidAmount} />
									</span>
								</div>
								<div className="flex justify-between font-bold">
									<span
										className={
											remainingAmount > 0
												? "text-amber-600 dark:text-amber-400"
												: "text-green-600 dark:text-green-400"
										}
									>
										{t("finance.invoices.remainingAmount")}
									</span>
									<span
										className={
											remainingAmount > 0
												? "text-amber-600 dark:text-amber-400"
												: "text-green-600 dark:text-green-400"
										}
									>
										<Currency amount={remainingAmount} />
									</span>
								</div>
							</>
						)}
					</div>
				</div>

				{/* ─── Notes / Terms ──────────────────────────────────── */}
				{invoice.paymentTerms && (
					<div className="border-t border-slate-200 dark:border-slate-700 pt-6 mb-4">
						<h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
							{t("finance.invoices.paymentTerms")}
						</h4>
						<p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
							{invoice.paymentTerms}
						</p>
					</div>
				)}
				{invoice.notes && (
					<div className="pt-4 border-t border-slate-200 dark:border-slate-700">
						<h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
							{t("finance.invoices.notes")}
						</h4>
						<p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
							{invoice.notes}
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 2: Details — metadata, payments, credit notes
// ═══════════════════════════════════════════════════════════════════════════

function DetailsTabContent({
	invoice,
	organizationSlug,
	basePath,
	canAddPayment,
	onDeletePayment,
}: {
	invoice: any;
	organizationSlug: string;
	basePath: string;
	canAddPayment: boolean;
	onDeletePayment: (id: string) => void;
}) {
	const t = useTranslations();

	return (
		<div className="space-y-6">
			{/* ─── Metadata Card ──────────────────────────────────── */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						{t("finance.invoices.details.metadata")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{/* Invoice No */}
						<DetailRow
							icon={<Hash className="h-4 w-4" />}
							label={t("finance.invoices.details.invoiceNo")}
							value={invoice.invoiceNo}
						/>

						{/* Invoice Type */}
						<DetailRow
							icon={<FileText className="h-4 w-4" />}
							label={t("finance.invoices.details.invoiceType")}
							value={
								t(`finance.invoices.types.${INVOICE_TYPE_KEYS[invoice.invoiceType] || "standard"}`)
							}
						/>

						{/* Status */}
						<div className="flex items-start gap-3">
							<div className="mt-1 text-slate-400">
								<FileCheck className="h-4 w-4" />
							</div>
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.invoices.details.status")}
								</p>
								<div className="mt-0.5">
									<StatusBadge
										status={invoice.status}
										type="invoice"
									/>
								</div>
							</div>
						</div>

						{/* Created At */}
						<DetailRow
							icon={<CalendarDays className="h-4 w-4" />}
							label={t("finance.invoices.details.createdAt")}
							value={formatDateTime(invoice.createdAt)}
						/>

						{/* Issued At */}
						{invoice.issuedAt && (
							<DetailRow
								icon={<CalendarDays className="h-4 w-4" />}
								label={t("finance.invoices.details.issuedAt")}
								value={formatDateTime(invoice.issuedAt)}
							/>
						)}

						{/* Issue Date */}
						<DetailRow
							icon={<CalendarDays className="h-4 w-4" />}
							label={t("finance.invoices.details.issueDate")}
							value={formatDate(invoice.issueDate)}
						/>

						{/* Due Date */}
						<DetailRow
							icon={<CalendarDays className="h-4 w-4" />}
							label={t("finance.invoices.details.dueDate")}
							value={formatDate(invoice.dueDate)}
						/>

						{/* Project */}
						{invoice.project && (
							<div className="flex items-start gap-3">
								<div className="mt-1 text-slate-400">
									<Link2 className="h-4 w-4" />
								</div>
								<div>
									<p className="text-sm text-slate-500 dark:text-slate-400">
										{t("finance.invoices.details.project")}
									</p>
									<Link
										href={`/app/${organizationSlug}/projects/${invoice.project.slug || invoice.project.id}`}
										className="text-primary hover:underline font-medium flex items-center gap-1"
									>
										{invoice.project.name}
										<ExternalLink className="h-3 w-3" />
									</Link>
								</div>
							</div>
						)}

						{/* Quotation */}
						{invoice.quotation && (
							<div className="flex items-start gap-3">
								<div className="mt-1 text-slate-400">
									<Link2 className="h-4 w-4" />
								</div>
								<div>
									<p className="text-sm text-slate-500 dark:text-slate-400">
										{t("finance.invoices.details.quotation")}
									</p>
									<Link
										href={`/app/${organizationSlug}/finance/quotations/${invoice.quotation.id}`}
										className="text-primary hover:underline font-medium flex items-center gap-1"
									>
										{invoice.quotation.quotationNo}
										<ExternalLink className="h-3 w-3" />
									</Link>
								</div>
							</div>
						)}

						{/* Created By */}
						{invoice.createdBy && (
							<DetailRow
								icon={<User className="h-4 w-4" />}
								label={t("finance.invoices.details.createdBy")}
								value={invoice.createdBy.name || invoice.createdBy.email}
							/>
						)}

						{/* ZATCA UUID */}
						{invoice.zatcaUuid && (
							<div className="sm:col-span-2 lg:col-span-3 flex items-start gap-3">
								<div className="mt-1 text-slate-400">
									<QrCode className="h-4 w-4" />
								</div>
								<div>
									<p className="text-sm text-slate-500 dark:text-slate-400">
										{t("finance.invoices.details.zatcaUuid")}
									</p>
									<p className="font-mono text-sm text-slate-700 dark:text-slate-300 break-all">
										{invoice.zatcaUuid}
									</p>
								</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* ─── Payments List ───────────────────────────────────── */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						{t("finance.invoices.details.payments")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{invoice.payments && invoice.payments.length > 0 ? (
						<div className="space-y-3">
							{invoice.payments.map((payment: any) => (
								<div
									key={payment.id}
									className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
								>
									<div>
										<p className="font-medium text-green-600 dark:text-green-400">
											<Currency amount={payment.amount} />
										</p>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{formatDate(payment.paymentDate)}
											{payment.paymentMethod &&
												` - ${payment.paymentMethod}`}
											{payment.referenceNo &&
												` (${payment.referenceNo})`}
										</p>
										{payment.notes && (
											<p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
												{payment.notes}
											</p>
										)}
										{payment.createdBy && (
											<p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
												{payment.createdBy.name}
											</p>
										)}
									</div>
									{canAddPayment && (
										<Button
											variant="ghost"
											size="sm"
											onClick={() =>
												onDeletePayment(payment.id)
											}
											className="text-red-600 hover:text-red-700 hover:bg-red-50"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
							{t("finance.invoices.details.noPayments")}
						</p>
					)}
				</CardContent>
			</Card>

			{/* ─── Credit Notes List ───────────────────────────────── */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileMinus className="h-5 w-5" />
						{t("finance.invoices.details.creditNotes")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{invoice.creditNotes && invoice.creditNotes.length > 0 ? (
						<div className="space-y-3">
							{invoice.creditNotes.map((cn: any) => (
								<Link
									key={cn.id}
									href={`${basePath}/${cn.id}`}
									className="flex items-center justify-between p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors"
								>
									<div>
										<p className="font-medium text-pink-700 dark:text-pink-400">
											{cn.invoiceNo}
										</p>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{formatDate(cn.createdAt)}
										</p>
									</div>
									<div className="flex items-center gap-2">
										<Currency
											amount={Number(cn.totalAmount)}
											className="font-medium text-pink-600 dark:text-pink-400"
										/>
										<StatusBadge
											status={cn.status}
											type="invoice"
										/>
									</div>
								</Link>
							))}
						</div>
					) : (
						<p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
							{t("finance.invoices.details.noCreditNotes")}
						</p>
					)}
				</CardContent>
			</Card>

			{/* ─── Related Invoice (if this is a credit note) ──────── */}
			{invoice.relatedInvoice && (
				<Card className="rounded-2xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Link2 className="h-5 w-5" />
							{t("finance.invoices.details.relatedInvoice")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Link
							href={`${basePath}/${invoice.relatedInvoice.id}`}
							className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
						>
							<div>
								<p className="font-medium text-slate-900 dark:text-slate-100">
									{invoice.relatedInvoice.invoiceNo}
								</p>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t(`finance.invoices.types.${INVOICE_TYPE_KEYS[invoice.relatedInvoice.invoiceType] || "standard"}`)}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<Currency
									amount={Number(
										invoice.relatedInvoice.totalAmount,
									)}
									className="font-medium"
								/>
								<StatusBadge
									status={invoice.relatedInvoice.status}
									type="invoice"
								/>
								<ExternalLink className="h-4 w-4 text-slate-400" />
							</div>
						</Link>
					</CardContent>
				</Card>
			)}
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 3: Activity — audit trail
// ═══════════════════════════════════════════════════════════════════════════

function ActivityTabContent({
	organizationId,
	invoiceId,
}: {
	organizationId: string;
	invoiceId: string;
}) {
	const t = useTranslations();

	const { data, isLoading } = useQuery(
		orpc.finance.invoices.getActivity.queryOptions({
			input: { organizationId, id: invoiceId },
		}),
	);

	const logs = data?.logs ?? [];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="relative">
					<div className="w-10 h-10 border-4 border-primary/20 rounded-full" />
					<div className="absolute top-0 left-0 w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (logs.length === 0) {
		return (
			<Card className="rounded-2xl">
				<CardContent className="py-12">
					<div className="text-center">
						<Clock className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
						<p className="text-slate-500 dark:text-slate-400">
							{t("finance.invoices.activity.empty")}
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="rounded-2xl">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Clock className="h-5 w-5" />
					{t("finance.invoices.activity.title")}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="relative">
					{/* Timeline line */}
					<div className="absolute top-0 bottom-0 start-4 w-0.5 bg-slate-200 dark:bg-slate-700" />

					<div className="space-y-6">
						{logs.map((log: any) => (
							<div key={log.id} className="relative flex gap-4">
								{/* Timeline dot */}
								<div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 border-2 border-primary/30 shrink-0">
									<div className="w-2.5 h-2.5 rounded-full bg-primary" />
								</div>

								{/* Content */}
								<div className="flex-1 pb-1">
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
										<div>
											<p className="font-medium text-slate-900 dark:text-slate-100">
												{t(
													`finance.invoices.activity.actions.${log.action}` as any,
												)}
											</p>
											{log.actor && (
												<p className="text-sm text-slate-500 dark:text-slate-400">
													{log.actor.name}
												</p>
											)}
										</div>
										<p className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
											{formatDateTime(log.createdAt)}
										</p>
									</div>

									{/* Metadata */}
									{log.metadata && (
										<div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
											{log.metadata.newStatus && (
												<span className="inline-flex items-center gap-1">
													<StatusBadge
														status={log.metadata.newStatus}
														type="invoice"
													/>
												</span>
											)}
											{log.metadata.amount != null && (
												<span>
													{t("finance.invoices.amount")}:{" "}
													<Currency
														amount={log.metadata.amount}
													/>
												</span>
											)}
											{log.metadata.newInvoiceNo && (
												<span>
													{log.metadata.newInvoiceNo}
												</span>
											)}
											{log.metadata.creditNoteNo && (
												<span>
													{log.metadata.creditNoteNo}
												</span>
											)}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility: Detail row
// ═══════════════════════════════════════════════════════════════════════════

function DetailRow({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: string | null | undefined;
}) {
	if (!value) return null;

	return (
		<div className="flex items-start gap-3">
			<div className="mt-1 text-slate-400">{icon}</div>
			<div>
				<p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
				<p className="font-medium text-slate-900 dark:text-slate-100">
					{value}
				</p>
			</div>
		</div>
	);
}
