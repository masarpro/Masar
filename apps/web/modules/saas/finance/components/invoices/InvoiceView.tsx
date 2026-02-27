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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
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
	FileCheck,
	FileMinus,
	Copy,
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
	ArrowRight,
	ChevronLeft,
	Check,
	FileDown,
	StickyNote,
} from "lucide-react";
import { StatusBadge } from "../shared/StatusBadge";
import { Currency } from "../shared/Currency";
import { formatDate, formatDateTime } from "../../lib/utils";
import { InvoiceDocument } from "./InvoiceDocument";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface InvoiceViewProps {
	organizationId: string;
	organizationSlug: string;
	invoiceId: string;
}

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
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [noteDialogOpen, setNoteDialogOpen] = useState(false);
	const [noteText, setNoteText] = useState("");

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

	// Delete invoice
	const deleteMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.invoices.delete({
				organizationId,
				id: invoiceId,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.deleteSuccess"));
			setDeleteDialogOpen(false);
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
			router.push(basePath);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.deleteError"));
		},
	});

	// Update notes
	const updateNotesMutation = useMutation({
		mutationFn: async () => {
			return orpcClient.finance.invoices.updateNotes({
				organizationId,
				id: invoiceId,
				notes: noteText,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.noteUpdateSuccess"));
			setNoteDialogOpen(false);
			queryClient.invalidateQueries({
				queryKey: ["finance", "invoices"],
			});
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.noteUpdateError"));
		},
	});

	// ─── Helpers ──────────────────────────────────────────────────────────

	const openNoteDialog = () => {
		setNoteText(invoice?.notes || "");
		setNoteDialogOpen(true);
	};

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
					<div className="absolute top-0 inset-inline-start-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
		<div dir="rtl" className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100/40 to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
			<div className="space-y-5 max-w-6xl mx-auto">

				{/* ─── Header ─────────────────────────────────────────── */}
				<div className="sticky top-0 z-20 py-3 px-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50 print:hidden">
					<div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
						{/* Start: back + breadcrumb/title */}
						<div className="flex items-center gap-3 min-w-0">
							<Button type="button" variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-xl border-border shadow-sm">
								<Link href={`/app/${organizationSlug}/finance/invoices`}>
									<ArrowRight className="h-4 w-4" />
								</Link>
							</Button>
							<div className="min-w-0">
								<nav className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5">
									<Link href={`/app/${organizationSlug}/finance`} className="hover:text-foreground transition-colors">{t("finance.title")}</Link>
									<ChevronLeft className="h-3 w-3 shrink-0" />
									<Link href={`/app/${organizationSlug}/finance/invoices`} className="hover:text-foreground transition-colors">{t("finance.invoices.title")}</Link>
								</nav>
								<div className="flex items-center gap-2 flex-wrap">
									<h1 className="text-base font-bold leading-tight truncate">{invoice.invoiceNo}</h1>
									<StatusBadge status={invoice.status} type="invoice" />
									{invoice.clientName && (
										<>
											<span className="text-muted-foreground/50">·</span>
											<div className="flex items-center gap-1.5 text-sm">
												<User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
												{invoice.clientId ? (
													<Link href={`/app/${organizationSlug}/finance/clients/${invoice.clientId}`} className="text-primary hover:underline font-medium truncate">
														{invoice.clientName}
													</Link>
												) : (
													<span className="font-medium truncate">{invoice.clientName}</span>
												)}
												{invoice.clientPhone && (
													<span className="text-xs text-muted-foreground whitespace-nowrap">({invoice.clientPhone})</span>
												)}
											</div>
										</>
									)}
								</div>
							</div>
						</div>

						{/* End: Payment status + Issue button */}
						<div className="flex items-center gap-1.5 shrink-0">
							{invoice.status === "PAID" && (
								<div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
									<Check className="h-3 w-3" />
									{t("finance.invoices.status.paid")}
								</div>
							)}
							{invoice.status === "PARTIALLY_PAID" && (
								<div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium whitespace-nowrap">
									{t("finance.invoices.remainingAmount")}: <Currency amount={remainingAmount} />
								</div>
							)}
							{!isDraft && !isPaid && !isCancelled && invoice.status !== "PARTIALLY_PAID" && invoice.paidAmount === 0 && (
								<span className="text-xs text-muted-foreground whitespace-nowrap">
									<Currency amount={invoice.totalAmount} />
								</span>
							)}
							{isDraft && (
								<Button size="sm" onClick={() => setIssueDialogOpen(true)} className="h-8 rounded-[10px] text-xs px-5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-[0_4px_15px_hsl(var(--primary)/0.35)] hover:shadow-[0_6px_20px_hsl(var(--primary)/0.45)] transition-all">
									<FileCheck className="h-3.5 w-3.5 me-1.5" />
									{t("finance.invoices.issueInvoice")}
								</Button>
							)}
						</div>
					</div>
				</div>

				{/* ─── Action Bar (matches ProjectNavigation style) ── */}
				<nav className="print:hidden flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 shadow-lg flex-wrap">
					{/* Edit — DRAFT only */}
					{isDraft && (
						<Link
							href={`${basePath}/${invoiceId}/edit`}
							className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 hover:text-primary-foreground hover:shadow-md hover:shadow-primary/20 hover:scale-105"
						>
							<Edit className="h-4 w-4" />
							<span className="hidden sm:inline">{t("finance.actions.edit")}</span>
						</Link>
					)}

					{/* Print */}
					<button
						type="button"
						onClick={() => router.push(`${basePath}/${invoiceId}/preview`)}
						className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 hover:text-primary-foreground hover:shadow-md hover:shadow-primary/20 hover:scale-105"
					>
						<Printer className="h-4 w-4" />
						<span className="hidden sm:inline">{t("finance.actions.print")}</span>
					</button>

					{/* PDF */}
					<button
						type="button"
						onClick={() => router.push(`${basePath}/${invoiceId}/preview`)}
						className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 hover:text-primary-foreground hover:shadow-md hover:shadow-primary/20 hover:scale-105"
					>
						<FileDown className="h-4 w-4" />
						<span className="hidden sm:inline">{t("finance.actions.downloadPdf")}</span>
					</button>

					{/* Separator */}
					<div className="w-px h-6 bg-border/50 mx-1" />

					{/* Add Payment — non-DRAFT, non-PAID, non-CANCELLED */}
					{canAddPayment && (
						<button
							type="button"
							onClick={() => setPaymentDialogOpen(true)}
							className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 hover:text-primary-foreground hover:shadow-md hover:shadow-primary/20 hover:scale-105"
						>
							<CreditCard className="h-4 w-4" />
							<span className="hidden sm:inline">{t("finance.invoices.addPayment")}</span>
						</button>
					)}

					{/* Credit Note — non-DRAFT, non-CANCELLED */}
					{canCreditNote && (
						<button
							type="button"
							onClick={() => router.push(`${basePath}/${invoiceId}/credit-note`)}
							className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 hover:text-primary-foreground hover:shadow-md hover:shadow-primary/20 hover:scale-105"
						>
							<FileMinus className="h-4 w-4" />
							<span className="hidden sm:inline">{t("finance.actions.creditNote")}</span>
						</button>
					)}

					{/* Add Note */}
					<button
						type="button"
						onClick={openNoteDialog}
						className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 hover:text-primary-foreground hover:shadow-md hover:shadow-primary/20 hover:scale-105"
					>
						<StickyNote className="h-4 w-4" />
						<span className="hidden sm:inline">{t("finance.actions.addNote")}</span>
					</button>

					{/* Duplicate */}
					<button
						type="button"
						onClick={() => duplicateMutation.mutate()}
						disabled={duplicateMutation.isPending}
						className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary hover:to-primary/80 hover:text-primary-foreground hover:shadow-md hover:shadow-primary/20 hover:scale-105 disabled:opacity-50"
					>
						<Copy className="h-4 w-4" />
						<span className="hidden sm:inline">{t("finance.actions.duplicate")}</span>
					</button>

					{/* Delete icon — DRAFT only */}
					{isDraft && (
						<>
							<div className="flex-1" />
							<button
								type="button"
								onClick={() => setDeleteDialogOpen(true)}
								className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30 hover:scale-105"
							>
								<Trash2 className="h-4 w-4" />
							</button>
						</>
					)}
				</nav>

				{/* ─── Print-ready invoice ─────────────────────────── */}
				<InvoiceTabContent
					invoice={invoice}
				/>

				{/* ─── Details section ─────────────────────────────── */}
				<div className="mt-5 print:hidden">
					<DetailsTabContent
						invoice={invoice}
						organizationSlug={organizationSlug}
						basePath={basePath}
						canAddPayment={canAddPayment}
						onDeletePayment={setDeletePaymentId}
					/>
				</div>

				{/* ─── Activity section ────────────────────────────── */}
				<div className="mt-5 print:hidden">
					<ActivityTabContent
						organizationId={organizationId}
						invoiceId={invoiceId}
					/>
				</div>
			</div>

			{/* ═══════ Issue Invoice AlertDialog ═══════ */}
			<AlertDialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("finance.invoices.issueConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("finance.invoices.issueConfirmDescription")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={() => issueMutation.mutate()} disabled={issueMutation.isPending} className="rounded-xl">
							{issueMutation.isPending ? t("common.saving") : t("finance.invoices.issueConfirmButton")}
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
							<Input type="number" step="0.01" min="0" max={remainingAmount} value={newPaymentAmount} onChange={(e) => setNewPaymentAmount(e.target.value)} placeholder={t("finance.invoices.maxAmount")} className="rounded-xl mt-1" />
						</div>
						<div>
							<Label>{t("finance.invoices.paymentDate")} *</Label>
							<Input type="date" value={newPaymentDate} onChange={(e) => setNewPaymentDate(e.target.value)} className="rounded-xl mt-1" />
						</div>
						<div>
							<Label>{t("finance.invoices.paymentMethod")}</Label>
							<Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("finance.invoices.selectPaymentMethod")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="CASH">{t("finance.paymentMethods.cash")}</SelectItem>
									<SelectItem value="BANK_TRANSFER">{t("finance.paymentMethods.bankTransfer")}</SelectItem>
									<SelectItem value="CHECK">{t("finance.paymentMethods.check")}</SelectItem>
									<SelectItem value="CREDIT_CARD">{t("finance.paymentMethods.creditCard")}</SelectItem>
									<SelectItem value="OTHER">{t("finance.paymentMethods.other")}</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label>{t("finance.invoices.referenceNo")}</Label>
							<Input value={newPaymentReference} onChange={(e) => setNewPaymentReference(e.target.value)} placeholder={t("finance.invoices.referenceNoPlaceholder")} className="rounded-xl mt-1" />
						</div>
						<div>
							<Label>{t("finance.invoices.paymentNotes")}</Label>
							<Textarea value={newPaymentNotes} onChange={(e) => setNewPaymentNotes(e.target.value)} rows={2} className="rounded-xl mt-1" />
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="rounded-xl">{t("common.cancel")}</Button>
						<Button onClick={() => addPaymentMutation.mutate()} disabled={!newPaymentAmount || parseFloat(newPaymentAmount) <= 0 || addPaymentMutation.isPending} className="rounded-xl">
							<Plus className="h-4 w-4 me-2" />
							{addPaymentMutation.isPending ? t("common.saving") : t("finance.invoices.addPayment")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ═══════ Delete Payment AlertDialog ═══════ */}
			<AlertDialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("finance.invoices.deletePaymentTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("finance.invoices.deletePaymentDescription")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={() => deletePaymentId && deletePaymentMutation.mutate(deletePaymentId)} disabled={deletePaymentMutation.isPending} className="rounded-xl bg-red-600 hover:bg-red-700">
							{deletePaymentMutation.isPending ? t("common.deleting") : t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* ═══════ Delete Invoice AlertDialog ═══════ */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("finance.invoices.deleteConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("finance.invoices.deleteConfirmDescription")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="rounded-xl bg-red-600 hover:bg-red-700">
							{deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* ═══════ Add Note Dialog ═══════ */}
			<Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
				<DialogContent className="sm:max-w-md rounded-2xl">
					<DialogHeader>
						<DialogTitle>{t("finance.invoices.addNoteTitle")}</DialogTitle>
					</DialogHeader>
					<div>
						<Textarea
							value={noteText}
							onChange={(e) => setNoteText(e.target.value)}
							rows={4}
							className="rounded-xl"
							placeholder={t("finance.invoices.notes")}
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setNoteDialogOpen(false)} className="rounded-xl">{t("common.cancel")}</Button>
						<Button onClick={() => updateNotesMutation.mutate()} disabled={updateNotesMutation.isPending} className="rounded-xl">
							{updateNotesMutation.isPending ? t("common.saving") : t("common.save")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 1: Invoice — print-ready preview
// ═══════════════════════════════════════════════════════════════════════════

function InvoiceTabContent({
	invoice,
}: {
	invoice: any;
}) {
	const isDraftInvoice = invoice.status === "DRAFT";

	return (
		<div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] max-w-[210mm] mx-auto relative overflow-hidden print:shadow-none print:rounded-none print:border-none print:max-w-none print:bg-white">
			<div className="min-h-[297mm] print:text-black">
				<InvoiceDocument
					invoice={invoice}
					options={{
						showWatermark: isDraftInvoice,
						printMode: false,
						showPayments: true,
					}}
				/>
			</div>
		</div>
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
		<div className="space-y-5">
			{/* ─── Metadata Card ──────────────────────────────────── */}
			<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
				<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
					<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 flex items-center justify-center">
						<FileText className="h-[15px] w-[15px] text-blue-500" />
					</div>
					<span className="text-sm font-semibold text-foreground">{t("finance.invoices.details.metadata")}</span>
				</div>
				<div className="p-5">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<DetailRow icon={<Hash className="h-4 w-4" />} label={t("finance.invoices.details.invoiceNo")} value={invoice.invoiceNo} />
						<DetailRow icon={<FileText className="h-4 w-4" />} label={t("finance.invoices.details.invoiceType")} value={t(`finance.invoices.types.${INVOICE_TYPE_KEYS[invoice.invoiceType] || "standard"}`)} />

						<div className="flex items-start gap-3">
							<div className="mt-1 text-slate-400"><FileCheck className="h-4 w-4" /></div>
							<div>
								<p className="text-sm text-muted-foreground">{t("finance.invoices.details.status")}</p>
								<div className="mt-0.5"><StatusBadge status={invoice.status} type="invoice" /></div>
							</div>
						</div>

						<DetailRow icon={<CalendarDays className="h-4 w-4" />} label={t("finance.invoices.details.createdAt")} value={formatDateTime(invoice.createdAt)} />
						{invoice.issuedAt && <DetailRow icon={<CalendarDays className="h-4 w-4" />} label={t("finance.invoices.details.issuedAt")} value={formatDateTime(invoice.issuedAt)} />}
						<DetailRow icon={<CalendarDays className="h-4 w-4" />} label={t("finance.invoices.details.issueDate")} value={formatDate(invoice.issueDate)} />
						<DetailRow icon={<CalendarDays className="h-4 w-4" />} label={t("finance.invoices.details.dueDate")} value={formatDate(invoice.dueDate)} />

						{invoice.project && (
							<div className="flex items-start gap-3">
								<div className="mt-1 text-slate-400"><Link2 className="h-4 w-4" /></div>
								<div>
									<p className="text-sm text-muted-foreground">{t("finance.invoices.details.project")}</p>
									<Link href={`/app/${organizationSlug}/projects/${invoice.project.slug || invoice.project.id}`} className="text-primary hover:underline font-medium flex items-center gap-1">
										{invoice.project.name}
										<ExternalLink className="h-3 w-3" />
									</Link>
								</div>
							</div>
						)}

						{invoice.quotation && (
							<div className="flex items-start gap-3">
								<div className="mt-1 text-slate-400"><Link2 className="h-4 w-4" /></div>
								<div>
									<p className="text-sm text-muted-foreground">{t("finance.invoices.details.quotation")}</p>
									<Link href={`/app/${organizationSlug}/finance/quotations/${invoice.quotation.id}`} className="text-primary hover:underline font-medium flex items-center gap-1">
										{invoice.quotation.quotationNo}
										<ExternalLink className="h-3 w-3" />
									</Link>
								</div>
							</div>
						)}

						{invoice.createdBy && (
							<DetailRow icon={<User className="h-4 w-4" />} label={t("finance.invoices.details.createdBy")} value={invoice.createdBy.name || invoice.createdBy.email} />
						)}

						{invoice.zatcaUuid && (
							<div className="sm:col-span-2 lg:col-span-3 flex items-start gap-3">
								<div className="mt-1 text-slate-400"><QrCode className="h-4 w-4" /></div>
								<div>
									<p className="text-sm text-muted-foreground">{t("finance.invoices.details.zatcaUuid")}</p>
									<p className="font-mono text-sm text-foreground break-all">{invoice.zatcaUuid}</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ─── Payments List ───────────────────────────────────── */}
			<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
				<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
					<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/40 dark:to-green-800/20 flex items-center justify-center">
						<CreditCard className="h-[15px] w-[15px] text-green-500" />
					</div>
					<span className="text-sm font-semibold text-foreground">{t("finance.invoices.details.payments")}</span>
					{invoice.payments && invoice.payments.length > 0 && (
						<span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[11px] font-bold">{invoice.payments.length}</span>
					)}
				</div>
				<div className="p-5">
					{invoice.payments && invoice.payments.length > 0 ? (
						<div className="space-y-2">
							{invoice.payments.map((payment: any) => (
								<div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
									<div>
										<p className="font-medium text-green-600 dark:text-green-400 text-sm"><Currency amount={payment.amount} /></p>
										<p className="text-xs text-muted-foreground">
											{formatDate(payment.paymentDate)}
											{payment.paymentMethod && ` - ${payment.paymentMethod}`}
											{payment.referenceNo && ` (${payment.referenceNo})`}
										</p>
										{payment.notes && <p className="text-xs text-muted-foreground/70 mt-0.5">{payment.notes}</p>}
										{payment.createdBy && <p className="text-xs text-muted-foreground/50 mt-0.5">{payment.createdBy.name}</p>}
									</div>
									{canAddPayment && (
										<Button variant="ghost" size="icon" onClick={() => onDeletePayment(payment.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg">
											<Trash2 className="h-4 w-4" />
										</Button>
									)}
								</div>
							))}
						</div>
					) : (
						<p className="text-sm text-muted-foreground text-center py-4">{t("finance.invoices.details.noPayments")}</p>
					)}
				</div>
			</div>

			{/* ─── Credit Notes List ───────────────────────────────── */}
			<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
				<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
					<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/40 dark:to-pink-800/20 flex items-center justify-center">
						<FileMinus className="h-[15px] w-[15px] text-pink-500" />
					</div>
					<span className="text-sm font-semibold text-foreground">{t("finance.invoices.details.creditNotes")}</span>
					{invoice.creditNotes && invoice.creditNotes.length > 0 && (
						<span className="px-2.5 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 text-[11px] font-bold">{invoice.creditNotes.length}</span>
					)}
				</div>
				<div className="p-5">
					{invoice.creditNotes && invoice.creditNotes.length > 0 ? (
						<div className="space-y-2">
							{invoice.creditNotes.map((cn: any) => (
								<Link key={cn.id} href={`${basePath}/${cn.id}`} className="flex items-center justify-between p-3 rounded-xl bg-pink-50/50 dark:bg-pink-900/10 border border-pink-200/50 dark:border-pink-800/30 hover:bg-pink-100/50 dark:hover:bg-pink-900/20 transition-colors">
									<div>
										<p className="font-medium text-pink-700 dark:text-pink-400 text-sm">{cn.invoiceNo}</p>
										<p className="text-xs text-muted-foreground">{formatDate(cn.createdAt)}</p>
									</div>
									<div className="flex items-center gap-2">
										<Currency amount={Number(cn.totalAmount)} className="font-medium text-pink-600 dark:text-pink-400 text-sm" />
										<StatusBadge status={cn.status} type="invoice" />
									</div>
								</Link>
							))}
						</div>
					) : (
						<p className="text-sm text-muted-foreground text-center py-4">{t("finance.invoices.details.noCreditNotes")}</p>
					)}
				</div>
			</div>

			{/* ─── Related Invoice (if this is a credit note) ──────── */}
			{invoice.relatedInvoice && (
				<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
					<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
						<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/40 dark:to-slate-700/20 flex items-center justify-center">
							<Link2 className="h-[15px] w-[15px] text-slate-500" />
						</div>
						<span className="text-sm font-semibold text-foreground">{t("finance.invoices.details.relatedInvoice")}</span>
					</div>
					<div className="p-5">
						<Link href={`${basePath}/${invoice.relatedInvoice.id}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors">
							<div>
								<p className="font-medium text-foreground">{invoice.relatedInvoice.invoiceNo}</p>
								<p className="text-xs text-muted-foreground">{t(`finance.invoices.types.${INVOICE_TYPE_KEYS[invoice.relatedInvoice.invoiceType] || "standard"}`)}</p>
							</div>
							<div className="flex items-center gap-2">
								<Currency amount={Number(invoice.relatedInvoice.totalAmount)} className="font-medium text-sm" />
								<StatusBadge status={invoice.relatedInvoice.status} type="invoice" />
								<ExternalLink className="h-4 w-4 text-slate-400" />
							</div>
						</Link>
					</div>
				</div>
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
					<div className="absolute top-0 inset-inline-start-0 w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (logs.length === 0) {
		return (
			<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden py-12">
				<div className="text-center">
					<Clock className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
					<p className="text-muted-foreground">{t("finance.invoices.activity.empty")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
			<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
				<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-900/40 dark:to-violet-800/20 flex items-center justify-center">
					<Clock className="h-[15px] w-[15px] text-violet-500" />
				</div>
				<span className="text-sm font-semibold text-foreground">{t("finance.invoices.activity.title")}</span>
				<span className="px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[11px] font-bold">{logs.length}</span>
			</div>
			<div className="p-5">
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
											<p className="font-medium text-foreground">
												{t(`finance.invoices.activity.actions.${log.action}` as any)}
											</p>
											{log.actor && (
												<p className="text-sm text-muted-foreground">{log.actor.name}</p>
											)}
										</div>
										<p className="text-xs text-muted-foreground/70 whitespace-nowrap">
											{formatDateTime(log.createdAt)}
										</p>
									</div>

									{/* Metadata */}
									{log.metadata && (
										<div className="mt-2 text-sm text-muted-foreground">
											{log.metadata.newStatus && (
												<span className="inline-flex items-center gap-1">
													<StatusBadge status={log.metadata.newStatus} type="invoice" />
												</span>
											)}
											{log.metadata.amount != null && (
												<span>
													{t("finance.invoices.amount")}: <Currency amount={log.metadata.amount} />
												</span>
											)}
											{log.metadata.newInvoiceNo && <span>{log.metadata.newInvoiceNo}</span>}
											{log.metadata.creditNoteNo && <span>{log.metadata.creditNoteNo}</span>}
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
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
				<p className="text-sm text-muted-foreground">{label}</p>
				<p className="font-medium text-foreground">{value}</p>
			</div>
		</div>
	);
}
