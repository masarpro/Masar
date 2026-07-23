"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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
	RefreshCw,
	AlertTriangle,
	Loader2,
} from "lucide-react";
import { exportToPDF, printDocument } from "@saas/shared/lib/pdf-export";
import { StatusBadge } from "../shared/StatusBadge";
import { JournalEntryLink } from "../shared/JournalEntryLink";
import { Currency } from "../shared/Currency";
import { formatDate, formatDateTime } from "../../lib/utils";
import { ScaleToFit } from "@saas/company/components/templates/renderer/ScaleToFit";
import { InvoiceDocument } from "./InvoiceDocument";
import Link from "next/link";
import { PreviewPageSkeleton } from "@saas/shared/components/skeletons";

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
	const locale = useLocale();
	const router = useRouter();
	const queryClient = useQueryClient();
	const basePath = `/app/${organizationSlug}/finance/invoices`;

	// ─── State ────────────────────────────────────────────────────────────
	const [issueDialogOpen, setIssueDialogOpen] = useState(false);
	const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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
	const [newPaymentAccountId, setNewPaymentAccountId] = useState("");

	// ─── Queries ──────────────────────────────────────────────────────────
	const { data: invoice, isLoading } = useQuery(
		orpc.finance.invoices.getById.queryOptions({
			input: { organizationId, id: invoiceId },
		}),
	);

	// الحسابات البنكية — لاختيار الحساب المستلم للدفعة (تُجلب عند فتح النافذة فقط)
	const { data: paymentAccountsData } = useQuery({
		...orpc.finance.banks.list.queryOptions({
			input: { organizationId, isActive: true },
		}),
		enabled: paymentDialogOpen,
	});
	const paymentAccounts: any[] = (paymentAccountsData as any)?.accounts ?? [];

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
				queryKey: orpc.finance.invoices.key(),
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
				queryKey: orpc.finance.invoices.key(),
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
			if (!newPaymentAccountId) {
				throw new Error(t("finance.expenses.errors.accountRequired"));
			}
			return orpcClient.finance.invoices.addPayment({
				organizationId,
				id: invoiceId,
				amount: parseFloat(newPaymentAmount),
				paymentDate: new Date(newPaymentDate).toISOString(),
				paymentMethod: newPaymentMethod || undefined,
				referenceNo: newPaymentReference || undefined,
				notes: newPaymentNotes || undefined,
				sourceAccountId: newPaymentAccountId,
			});
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.paymentAddSuccess"));
			setPaymentDialogOpen(false);
			resetPaymentForm();
			queryClient.invalidateQueries({
				queryKey: orpc.finance.invoices.key(),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.finance.banks.key(),
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
				queryKey: orpc.finance.invoices.key(),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.finance.banks.key(),
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
				queryKey: orpc.finance.invoices.key(),
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
				queryKey: orpc.finance.invoices.key(),
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
		setNewPaymentAccountId("");
	};

	// ─── Loading / Not found ─────────────────────────────────────────────

	if (isLoading) {
		return <PreviewPageSkeleton />;
	}

	if (!invoice) {
		return (
			<div className="text-center py-20">
				<p className="text-muted-foreground">
					{t("finance.invoices.notFound")}
				</p>
			</div>
		);
	}

	// ─── Render ──────────────────────────────────────────────────────────

	return (
		<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-background">
			<div className="space-y-5 max-w-6xl mx-auto">

				{/* ─── Header ─────────────────────────────────────────── */}
				<div className="sticky top-0 z-20 py-3 px-4 rounded-2xl bg-card border-2 border-border print:hidden">
					<div className="flex flex-wrap items-center justify-between gap-3 max-w-6xl mx-auto">
						{/* Start: back + breadcrumb/title */}
						<div className="flex items-center gap-3 min-w-0">
							<Button type="button" variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-xl border-border">
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
									{invoice.status !== "DRAFT" && (
										<JournalEntryLink
											organizationId={organizationId}
											organizationSlug={organizationSlug}
											referenceType="INVOICE"
											referenceId={invoiceId}
										/>
									)}
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
								<div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-success/15 text-success text-xs font-medium">
									<Check className="h-3 w-3" />
									{t("finance.invoices.status.paid")}
								</div>
							)}
							{invoice.status === "PARTIALLY_PAID" && (
								<div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-chart-1/15 text-chart-1 text-xs font-medium whitespace-nowrap">
									{t("finance.invoices.remainingAmount")}: <Currency amount={remainingAmount} />
								</div>
							)}
							{!isDraft && !isPaid && !isCancelled && invoice.status !== "PARTIALLY_PAID" && invoice.paidAmount === 0 && (
								<span className="text-xs text-muted-foreground whitespace-nowrap">
									<Currency amount={invoice.totalAmount} />
								</span>
							)}
							{isDraft && (
								<Button size="sm" onClick={() => setIssueDialogOpen(true)} className="h-8 rounded-lg text-xs px-5">
									<FileCheck className="h-3.5 w-3.5 me-1.5" />
									{t("finance.invoices.issueInvoice")}
								</Button>
							)}
						</div>
					</div>
				</div>

				{/* ─── Action Bar (matches ProjectNavigation style) ── */}
				<nav className="print:hidden flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-card border-2 border-border flex-wrap">
					{/* Edit — DRAFT only */}
					{isDraft && (
						<Link
							href={`${basePath}/${invoiceId}/edit`}
							className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
						>
							<Edit className="h-4 w-4" />
							<span className="hidden sm:inline">{t("finance.actions.edit")}</span>
						</Link>
					)}

					{/* Print — ينفَّذ مباشرة (المستند معروض في هذه الصفحة) */}
					<button
						type="button"
						onClick={() => printDocument()}
						className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					>
						<Printer className="h-4 w-4" />
						<span className="hidden sm:inline">{t("finance.actions.print")}</span>
					</button>

					{/* PDF — يُولَّد خادمياً من رابط المعاينة دون مغادرة الصفحة */}
					<button
						type="button"
						disabled={isGeneratingPdf}
						onClick={async () => {
							setIsGeneratingPdf(true);
							try {
								await exportToPDF(
									`${invoice.invoiceNo}-${invoice.clientName || "invoice"}`,
									{ url: `${basePath}/${invoiceId}/preview` },
								);
							} catch (error) {
								console.error("PDF generation failed:", error);
								toast.error(t("common.error"));
							} finally {
								setIsGeneratingPdf(false);
							}
						}}
						className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
					>
						{isGeneratingPdf ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<FileDown className="h-4 w-4" />
						)}
						<span className="hidden sm:inline">{t("finance.actions.downloadPdf")}</span>
					</button>

					{/* Separator */}
					<div className="w-px h-6 bg-border/50 mx-1" />

					{/* Add Payment — non-DRAFT, non-PAID, non-CANCELLED */}
					{canAddPayment && (
						<button
							type="button"
							onClick={() => setPaymentDialogOpen(true)}
							className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
							className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
						>
							<FileMinus className="h-4 w-4" />
							<span className="hidden sm:inline">{t("finance.actions.creditNote")}</span>
						</button>
					)}

					{/* Add Note */}
					<button
						type="button"
						onClick={openNoteDialog}
						className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
					>
						<StickyNote className="h-4 w-4" />
						<span className="hidden sm:inline">{t("finance.actions.addNote")}</span>
					</button>

					{/* Duplicate */}
					<button
						type="button"
						onClick={() => duplicateMutation.mutate()}
						disabled={duplicateMutation.isPending}
						className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
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
								className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
						organizationId={organizationId}
						invoiceId={invoiceId}
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
							<Input type="number" step="0.01" min="0" max={remainingAmount} value={newPaymentAmount} onChange={(e: any) => setNewPaymentAmount(e.target.value)} placeholder={t("finance.invoices.maxAmount")} className="rounded-xl mt-1" />
						</div>
						<div>
							<Label>{t("finance.invoices.paymentDate")} *</Label>
							<Input type="date" value={newPaymentDate} onChange={(e: any) => setNewPaymentDate(e.target.value)} className="rounded-xl mt-1" />
						</div>
						<div>
							<Label>{t("finance.invoices.receivingAccount")} *</Label>
							<Select value={newPaymentAccountId} onValueChange={setNewPaymentAccountId}>
								<SelectTrigger className="rounded-xl mt-1">
									<SelectValue placeholder={t("finance.expenses.selectAccountPlaceholder")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{paymentAccounts.map((account: any) => (
										<SelectItem key={account.id} value={account.id}>
											{account.name}
											{account.balance != null
												? ` (${new Intl.NumberFormat("en-US").format(Number(account.balance))})`
												: ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
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
							<Input value={newPaymentReference} onChange={(e: any) => setNewPaymentReference(e.target.value)} placeholder={t("finance.invoices.referenceNoPlaceholder")} className="rounded-xl mt-1" />
						</div>
						<div>
							<Label>{t("finance.invoices.paymentNotes")}</Label>
							<Textarea value={newPaymentNotes} onChange={(e: any) => setNewPaymentNotes(e.target.value)} rows={2} className="rounded-xl mt-1" />
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="rounded-xl">{t("common.cancel")}</Button>
						<Button onClick={() => addPaymentMutation.mutate()} disabled={!newPaymentAmount || parseFloat(newPaymentAmount) <= 0 || !newPaymentAccountId || addPaymentMutation.isPending} className="rounded-xl">
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
						<AlertDialogAction onClick={() => deletePaymentId && deletePaymentMutation.mutate(deletePaymentId)} disabled={deletePaymentMutation.isPending} className="rounded-xl bg-destructive hover:bg-destructive">
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
						<AlertDialogAction onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending} className="rounded-xl bg-destructive hover:bg-destructive">
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
							onChange={(e: any) => setNoteText(e.target.value)}
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
		<div
			id="invoice-print-area"
			className="bg-card dark:bg-muted rounded-2xl border border-white/80 dark:border-border shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] max-w-[210mm] mx-auto relative overflow-hidden print:shadow-none print:rounded-none print:border-none print:max-w-none print:bg-white"
		>
			{/* على الجوال: تصغير صفحة A4 لتطابق عرض الشاشة بدل قصّها */}
			<ScaleToFit contentWidth={794}>
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
			</ScaleToFit>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 2: Details — metadata, payments, credit notes
// ═══════════════════════════════════════════════════════════════════════════

function DetailsTabContent({
	invoice,
	organizationId,
	invoiceId,
	organizationSlug,
	basePath,
	canAddPayment,
	onDeletePayment,
}: {
	invoice: any;
	organizationId: string;
	invoiceId: string;
	organizationSlug: string;
	basePath: string;
	canAddPayment: boolean;
	onDeletePayment: (id: string) => void;
}) {
	const t = useTranslations();
	const locale = useLocale();
	const queryClient = useQueryClient();

	// ─── ZATCA retry: fetch latest submission only when status is recoverable ─
	const zatcaCanRetry =
		invoice?.zatcaSubmissionStatus === "FAILED" ||
		invoice?.zatcaSubmissionStatus === "REJECTED";

	const { data: zatcaSubmissionsData } = useQuery({
		...orpc.zatca.submissions.list.queryOptions({
			input: { organizationId, invoiceId, limit: 1, offset: 0 },
		}),
		enabled: !!invoice && zatcaCanRetry,
	});
	const latestZatcaSubmission = zatcaSubmissionsData?.submissions?.[0];

	const retryZatcaMutation = useMutation({
		mutationFn: async () => {
			if (!latestZatcaSubmission) {
				throw new Error(t("zatca.submission.retryError"));
			}
			return orpcClient.zatca.retrySubmission({
				organizationId,
				submissionId: latestZatcaSubmission.id,
			});
		},
		onSuccess: (data) => {
			if (data.success) {
				toast.success(t("zatca.submission.retrySuccess"));
			} else {
				const firstErr = data.errors?.[0]?.message;
				toast.error(firstErr || t("zatca.submission.retryError"));
			}
			queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.key() });
			queryClient.invalidateQueries({ queryKey: orpc.zatca.key() });
		},
		onError: (error: any) => {
			toast.error(error?.message || t("zatca.submission.retryError"));
		},
	});

	return (
		<div className="space-y-5">
			{/* ─── Metadata Card ──────────────────────────────────── */}
			<div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
				<div className="flex items-center gap-2.5 px-5 py-3.5 border-b-2 border-border">
					<div className="flex size-8 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
						<FileText className="h-[15px] w-[15px]" />
					</div>
					<span className="text-sm font-semibold text-card-foreground">{t("finance.invoices.details.metadata")}</span>
				</div>
				<div className="p-5">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<DetailRow icon={<Hash className="h-4 w-4" />} label={t("finance.invoices.details.invoiceNo")} value={invoice.invoiceNo} />
						<DetailRow icon={<FileText className="h-4 w-4" />} label={t("finance.invoices.details.invoiceType")} value={t(`finance.invoices.types.${INVOICE_TYPE_KEYS[invoice.invoiceType] || "standard"}`)} />

						<div className="flex items-start gap-3">
							<div className="mt-1 text-muted-foreground"><FileCheck className="h-4 w-4" /></div>
							<div>
								<p className="text-sm text-muted-foreground">{t("finance.invoices.details.status")}</p>
								<div className="mt-0.5"><StatusBadge status={invoice.status} type="invoice" /></div>
							</div>
						</div>

						<DetailRow icon={<CalendarDays className="h-4 w-4" />} label={t("finance.invoices.details.createdAt")} value={formatDateTime(invoice.createdAt, locale)} />
						{invoice.issuedAt && <DetailRow icon={<CalendarDays className="h-4 w-4" />} label={t("finance.invoices.details.issuedAt")} value={formatDateTime(invoice.issuedAt, locale)} />}
						<DetailRow icon={<CalendarDays className="h-4 w-4" />} label={t("finance.invoices.details.issueDate")} value={formatDate(invoice.issueDate)} />
						<DetailRow icon={<CalendarDays className="h-4 w-4" />} label={t("finance.invoices.details.dueDate")} value={formatDate(invoice.dueDate)} />

						{invoice.project && (
							<div className="flex items-start gap-3">
								<div className="mt-1 text-muted-foreground"><Link2 className="h-4 w-4" /></div>
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
								<div className="mt-1 text-muted-foreground"><Link2 className="h-4 w-4" /></div>
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
								<div className="mt-1 text-muted-foreground"><QrCode className="h-4 w-4" /></div>
								<div>
									<p className="text-sm text-muted-foreground">{t("finance.invoices.details.zatcaUuid")}</p>
									<p className="font-mono text-sm text-foreground break-all">{invoice.zatcaUuid}</p>
								</div>
							</div>
						)}

						{/* ZATCA Phase 2 Status */}
						{invoice.zatcaSubmissionStatus && invoice.zatcaSubmissionStatus !== "NOT_APPLICABLE" && (
							<div className="sm:col-span-2 lg:col-span-3 flex items-start gap-3">
								<div className="mt-1 text-muted-foreground"><FileCheck className="h-4 w-4" /></div>
								<div className="space-y-1.5 flex-1 min-w-0">
									<p className="text-sm text-muted-foreground">{t("zatca.submission.title")}</p>
									<div className="flex flex-wrap items-center gap-2">
										<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
											invoice.zatcaSubmissionStatus === "CLEARED" || invoice.zatcaSubmissionStatus === "REPORTED"
												? "bg-success/15 text-success"
												: invoice.zatcaSubmissionStatus === "REJECTED"
													? "bg-destructive/15 text-destructive"
													: invoice.zatcaSubmissionStatus === "FAILED"
														? "bg-chart-1/15 text-chart-1"
														: "bg-chart-4/15 text-chart-4"
										}`}>
											{t(`zatca.submission.${invoice.zatcaSubmissionStatus}`)}
										</span>
										{zatcaCanRetry && latestZatcaSubmission && (
											<Button
												type="button"
												size="sm"
												variant="outline"
												disabled={retryZatcaMutation.isPending}
												onClick={() => retryZatcaMutation.mutate()}
												className="h-7 px-2.5 gap-1.5 text-xs"
											>
												<RefreshCw className={`h-3.5 w-3.5 ${retryZatcaMutation.isPending ? "animate-spin" : ""}`} />
												{retryZatcaMutation.isPending
													? t("zatca.submission.retrying")
													: t("zatca.submission.retry")}
											</Button>
										)}
									</div>
									{invoice.zatcaSubmittedAt && (
										<p className="text-xs text-muted-foreground">{t("zatca.submission.sentAt")}: {new Date(invoice.zatcaSubmittedAt).toLocaleString("ar-SA")}</p>
									)}
									{invoice.zatcaClearedAt && (
										<p className="text-xs text-muted-foreground">{t("zatca.submission.clearedAt")}: {new Date(invoice.zatcaClearedAt).toLocaleString("ar-SA")}</p>
									)}
									{zatcaCanRetry && latestZatcaSubmission && (
										(() => {
											const errs = (latestZatcaSubmission.zatcaErrors as Array<{ code?: string; message?: string }> | null) ?? [];
											const resp = (latestZatcaSubmission.zatcaResponse as { errors?: Array<{ message?: string }>; message?: string } | null);
											const hasErrors = errs.length > 0 || (resp?.errors && resp.errors.length > 0) || resp?.message;
											if (!hasErrors) return null;
											return (
												<div className="mt-2 p-2.5 rounded-lg bg-destructive/10 border-2 border-destructive/30">
													<div className="flex items-start gap-2">
														<AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
														<div className="space-y-1 min-w-0">
															<p className="text-xs font-semibold text-destructive">
																{t("zatca.submission.errorDetails")}
															</p>
															<ul className="text-xs text-destructive space-y-0.5 list-disc ms-4">
																{errs.length > 0 ? (
																	errs.map((e, i) => (
																		<li key={i} className="break-words">
																			{e.code ? <span className="font-mono">[{e.code}] </span> : null}
																			{e.message}
																		</li>
																	))
																) : resp?.errors && resp.errors.length > 0 ? (
																	resp.errors.map((e, i) => (
																		<li key={i} className="break-words">{e.message}</li>
																	))
																) : (
																	<li className="break-words">{resp?.message}</li>
																)}
															</ul>
														</div>
													</div>
												</div>
											);
										})()
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* ─── Payments List ───────────────────────────────────── */}
			<div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
				<div className="flex items-center gap-2.5 px-5 py-3.5 border-b-2 border-border">
					<div className="flex size-8 items-center justify-center rounded-xl bg-success/15 text-success">
						<CreditCard className="h-[15px] w-[15px]" />
					</div>
					<span className="text-sm font-semibold text-card-foreground">{t("finance.invoices.details.payments")}</span>
					{invoice.payments && invoice.payments.length > 0 && (
						<span className="px-2.5 py-0.5 rounded-full bg-success/15 text-success text-[11px] font-bold">{invoice.payments.length}</span>
					)}
				</div>
				<div className="p-5">
					{invoice.payments && invoice.payments.length > 0 ? (
						<div className="space-y-2">
							{invoice.payments.map((payment: any) => (
								<div key={payment.id} className="flex items-center justify-between p-3 rounded-xl bg-muted border-2 border-border">
									<div>
										<p className="font-medium text-success text-sm"><Currency amount={payment.amount} /></p>
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
			<div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
				<div className="flex items-center gap-2.5 px-5 py-3.5 border-b-2 border-border">
					<div className="flex size-8 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
						<FileMinus className="h-[15px] w-[15px]" />
					</div>
					<span className="text-sm font-semibold text-card-foreground">{t("finance.invoices.details.creditNotes")}</span>
					{invoice.creditNotes && invoice.creditNotes.length > 0 && (
						<span className="px-2.5 py-0.5 rounded-full bg-destructive/15 text-destructive text-[11px] font-bold">{invoice.creditNotes.length}</span>
					)}
				</div>
				<div className="p-5">
					{invoice.creditNotes && invoice.creditNotes.length > 0 ? (
						<div className="space-y-2">
							{invoice.creditNotes.map((cn: any) => (
								<Link key={cn.id} href={`${basePath}/${cn.id}`} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border-2 border-destructive/20 hover:bg-destructive/10 transition-colors">
									<div>
										<p className="font-medium text-destructive text-sm">{cn.invoiceNo}</p>
										<p className="text-xs text-muted-foreground">{formatDate(cn.createdAt)}</p>
									</div>
									<div className="flex items-center gap-2">
										<Currency amount={Number(cn.totalAmount)} className="font-medium text-destructive text-sm" />
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
				<div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
					<div className="flex items-center gap-2.5 px-5 py-3.5 border-b-2 border-border">
						<div className="flex size-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
							<Link2 className="h-[15px] w-[15px]" />
						</div>
						<span className="text-sm font-semibold text-card-foreground">{t("finance.invoices.details.relatedInvoice")}</span>
					</div>
					<div className="p-5">
						<Link href={`${basePath}/${invoice.relatedInvoice.id}`} className="flex items-center justify-between p-3 rounded-xl bg-muted border-2 border-border hover:bg-accent transition-colors">
							<div>
								<p className="font-medium text-foreground">{invoice.relatedInvoice.invoiceNo}</p>
								<p className="text-xs text-muted-foreground">{t(`finance.invoices.types.${INVOICE_TYPE_KEYS[invoice.relatedInvoice.invoiceType] || "standard"}`)}</p>
							</div>
							<div className="flex items-center gap-2">
								<Currency amount={Number(invoice.relatedInvoice.totalAmount)} className="font-medium text-sm" />
								<StatusBadge status={invoice.relatedInvoice.status} type="invoice" />
								<ExternalLink className="h-4 w-4 text-muted-foreground" />
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
	const locale = useLocale();

	const { data, isLoading } = useQuery(
		orpc.finance.invoices.getActivity.queryOptions({
			input: { organizationId, id: invoiceId },
		}),
	);

	const logs = data?.logs ?? [];

	if (isLoading) {
		return <PreviewPageSkeleton />;
	}

	if (logs.length === 0) {
		return (
			<div className="bg-card rounded-2xl border-2 border-border overflow-hidden py-12">
				<div className="text-center">
					<Clock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
					<p className="text-muted-foreground">{t("finance.invoices.activity.empty")}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
			<div className="flex items-center gap-2.5 px-5 py-3.5 border-b-2 border-border">
				<div className="flex size-8 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
					<Clock className="h-[15px] w-[15px]" />
				</div>
				<span className="text-sm font-semibold text-card-foreground">{t("finance.invoices.activity.title")}</span>
				<span className="px-2.5 py-0.5 rounded-full bg-chart-4/15 text-chart-4 text-[11px] font-bold">{logs.length}</span>
			</div>
			<div className="p-5">
				<div className="relative">
					{/* Timeline line */}
					<div className="absolute top-0 bottom-0 start-4 w-0.5 bg-border" />

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
											{formatDateTime(log.createdAt, locale)}
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
			<div className="mt-1 text-muted-foreground">{icon}</div>
			<div>
				<p className="text-sm text-muted-foreground">{label}</p>
				<p className="font-medium text-foreground">{value}</p>
			</div>
		</div>
	);
}
