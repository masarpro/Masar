"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
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
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@ui/components/alert-dialog";
import {
	Plus,
	Search,
	Receipt,
	MoreHorizontal,
	Eye,
	Edit,
	Trash2,
	CreditCard,
	Printer,
	Copy,
	FileCheck,
	FileMinus,
	FileText,
	ArrowRight,
	ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatDate, isOverdue } from "../../lib/utils";
import { Currency } from "../shared/Currency";
import { StatusBadge } from "../shared/StatusBadge";
import { Pagination } from "@saas/shared/components/Pagination";

interface InvoicesListProps {
	organizationId: string;
	organizationSlug: string;
}

const STATUS_TABS = [
	{ key: "all", filterValue: "all" },
	{ key: "overdue", filterValue: "OVERDUE" },
	{ key: "draft", filterValue: "DRAFT" },
	{ key: "issued", filterValue: "ISSUED" },
	{ key: "sent", filterValue: "SENT" },
	{ key: "partially_paid", filterValue: "PARTIALLY_PAID" },
	{ key: "paid", filterValue: "PAID" },
	{ key: "credit_note", filterValue: "CREDIT_NOTE" },
] as const;

const PAGE_SIZE = 20;

export function InvoicesList({ organizationId, organizationSlug }: InvoicesListProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [currentPage, setCurrentPage] = useState(1);
	const basePath = `/app/${organizationSlug}/finance/invoices`;

	// Confirmation dialog states
	const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
	const [issueInvoiceId, setIssueInvoiceId] = useState<string | null>(null);

	// Determine if the credit_note tab is selected (it's a type, not a status)
	const isCreditNoteTab = statusFilter === "CREDIT_NOTE";

	const { data, isLoading } = useQuery(
		orpc.finance.invoices.list.queryOptions({
			input: {
				organizationId,
				status: !isCreditNoteTab && statusFilter !== "all" ? statusFilter as any : undefined,
				invoiceType: isCreditNoteTab ? "CREDIT_NOTE" as any : (typeFilter !== "all" ? typeFilter as any : undefined),
				query: searchTerm || undefined,
				limit: PAGE_SIZE,
				offset: (currentPage - 1) * PAGE_SIZE,
			},
		}),
	);

	const invoices = data?.invoices ?? [];
	const totalCount = data?.total ?? 0;

	// Reset page on filter change
	const handleStatusChange = (value: string) => {
		setStatusFilter(value);
		setCurrentPage(1);
	};

	const handleTypeChange = (value: string) => {
		setTypeFilter(value);
		setCurrentPage(1);
	};

	// ─── Mutations ────────────────────────────────────────────────────

	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.invoices.delete({ organizationId, id });
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.deleteSuccess"));
			setDeleteInvoiceId(null);
			queryClient.invalidateQueries({ queryKey: ["finance", "invoices"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.deleteError"));
		},
	});

	const issueMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.invoices.issue({ organizationId, id });
		},
		onSuccess: () => {
			toast.success(t("finance.invoices.issueSuccess"));
			setIssueInvoiceId(null);
			queryClient.invalidateQueries({ queryKey: ["finance", "invoices"] });
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.issueError"));
		},
	});

	const duplicateMutation = useMutation({
		mutationFn: async (id: string) => {
			return orpcClient.finance.invoices.duplicate({ organizationId, id });
		},
		onSuccess: (data) => {
			toast.success(t("finance.invoices.duplicateSuccess"));
			queryClient.invalidateQueries({ queryKey: ["finance", "invoices"] });
			router.push(`${basePath}/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.duplicateError"));
		},
	});

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

	return (
		<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100/40 to-slate-50 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950">
			<div className="space-y-5 max-w-6xl mx-auto">

				{/* ─── Header ─────────────────────────────────────────── */}
				<div className="sticky top-0 z-20 py-3 px-4 rounded-xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-border/50">
					<div className="flex items-center justify-between gap-3 max-w-6xl mx-auto">
						<div className="flex items-center gap-3 min-w-0">
							<Button type="button" variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-xl border-border shadow-sm">
								<Link href={`/app/${organizationSlug}/finance`}>
									<ArrowRight className="h-4 w-4" />
								</Link>
							</Button>
							<div className="min-w-0">
								<nav className="flex items-center gap-1 text-[11px] text-muted-foreground mb-0.5">
									<Link href={`/app/${organizationSlug}/finance`} className="hover:text-foreground transition-colors">{t("finance.title")}</Link>
									<ChevronLeft className="h-3 w-3 shrink-0" />
									<span className="text-foreground font-medium">{t("finance.invoices.title")}</span>
								</nav>
								<h1 className="text-base font-bold leading-tight truncate">{t("finance.invoices.title")}</h1>
							</div>
						</div>
						<Button asChild size="sm" className="h-8 rounded-[10px] text-xs px-5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-[0_4px_15px_hsl(var(--primary)/0.35)] hover:shadow-[0_6px_20px_hsl(var(--primary)/0.45)] transition-all">
							<Link href={`${basePath}/new`}>
								<Plus className="h-3.5 w-3.5 me-1.5" />
								{t("finance.invoices.create")}
							</Link>
						</Button>
					</div>
				</div>

				{/* ─── Status Tabs ─────────────────────────────────────── */}
				<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] px-4 py-3">
					<div className="flex items-center gap-2 flex-wrap">
						{STATUS_TABS.map((tab) => (
							<button
								key={tab.key}
								type="button"
								onClick={() => handleStatusChange(tab.filterValue)}
								className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
									statusFilter === tab.filterValue
										? "bg-primary text-primary-foreground shadow-[0_2px_8px_hsl(var(--primary)/0.3)]"
										: "bg-slate-100/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200/80 dark:hover:bg-slate-700/50"
								}`}
							>
								{t(`finance.invoices.statusTabs.${tab.key}`)}
							</button>
						))}
					</div>
				</div>

				{/* ─── Search and Filter ───────────────────────────────── */}
				<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] px-5 py-3.5">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
						<div className="relative flex-1 min-w-[200px]">
							<Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<Input
								placeholder={t("finance.invoices.searchPlaceholder")}
								value={searchTerm}
								onChange={(e) => {
									setSearchTerm(e.target.value);
									setCurrentPage(1);
								}}
								className="pr-10 rounded-xl h-9 border-slate-200/80 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 focus:bg-background"
							/>
						</div>
						<Select value={statusFilter} onValueChange={handleStatusChange}>
							<SelectTrigger className="w-[160px] rounded-xl h-9 border-slate-200/80 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
								<SelectValue placeholder={t("finance.invoices.allStatuses")} />
							</SelectTrigger>
							<SelectContent className="rounded-xl">
								<SelectItem value="all">{t("finance.invoices.allStatuses")}</SelectItem>
								<SelectItem value="DRAFT">{t("finance.invoices.status.draft")}</SelectItem>
								<SelectItem value="ISSUED">{t("finance.invoices.status.issued")}</SelectItem>
								<SelectItem value="SENT">{t("finance.invoices.status.sent")}</SelectItem>
								<SelectItem value="PARTIALLY_PAID">{t("finance.invoices.status.partially_paid")}</SelectItem>
								<SelectItem value="PAID">{t("finance.invoices.status.paid")}</SelectItem>
								<SelectItem value="OVERDUE">{t("finance.invoices.status.overdue")}</SelectItem>
								<SelectItem value="CANCELLED">{t("finance.invoices.status.cancelled")}</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* ─── Invoices Table ──────────────────────────────────── */}
				{invoices.length > 0 ? (
					<>
						<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
							<div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/60">
								<div className="w-[30px] h-[30px] rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-800/20 flex items-center justify-center">
									<FileText className="h-[15px] w-[15px] text-amber-500" />
								</div>
								<span className="text-sm font-semibold text-foreground">{t("finance.invoices.title")}</span>
								<span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">{totalCount}</span>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b bg-slate-50/80 dark:bg-slate-800/30">
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide">{t("finance.invoices.columns.number")}</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide">{t("finance.invoices.columns.client")}</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide">{t("finance.invoices.columns.date")}</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide">{t("finance.invoices.columns.dueDate")}</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide">{t("finance.invoices.columns.amount")}</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide">{t("finance.invoices.columns.paid")}</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide">{t("finance.invoices.columns.status")}</th>
											<th className="p-3 w-10" />
										</tr>
									</thead>
									<tbody>
										{invoices.map((invoice) => {
											const overdue = isOverdue(invoice.dueDate) &&
												invoice.status !== "PAID" &&
												invoice.status !== "CANCELLED";

											const isDraft = invoice.status === "DRAFT";
											const isPaid = invoice.status === "PAID";
											const isCancelled = invoice.status === "CANCELLED";
											const canAddPayment = !isDraft && !isPaid && !isCancelled;
											const canCreditNote = !isDraft && !isCancelled;

											return (
												<tr
													key={invoice.id}
													className={`border-b border-slate-50 dark:border-slate-800/30 last:border-0 hover:bg-primary/[0.02] transition-colors ${
														overdue ? "bg-red-50/50 dark:bg-red-950/20" : ""
													}`}
												>
													<td className="p-3 font-medium">
														<Link
															href={`${basePath}/${invoice.id}`}
															className="text-primary hover:underline flex items-center gap-2"
														>
															{invoice.invoiceNo}
															{invoice.invoiceType === "CREDIT_NOTE" && (
																<span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
																	{t("finance.invoices.types.credit_note")}
																</span>
															)}
														</Link>
													</td>
													<td className="p-3">
														<div>
															<p className="font-medium text-foreground">{invoice.clientName}</p>
															{invoice.clientCompany && (
																<p className="text-xs text-muted-foreground">{invoice.clientCompany}</p>
															)}
														</div>
													</td>
													<td className="p-3 text-muted-foreground">{formatDate(invoice.issueDate)}</td>
													<td className={`p-3 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
														{formatDate(invoice.dueDate)}
													</td>
													<td className="p-3 font-semibold">
														<Currency amount={invoice.totalAmount} />
													</td>
													<td className="p-3 text-green-600 font-medium">
														<Currency amount={invoice.paidAmount} />
													</td>
													<td className="p-3">
														<StatusBadge
															status={overdue && invoice.status !== "PAID" ? "OVERDUE" : invoice.status}
															type="invoice"
														/>
													</td>
													<td className="p-3">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
																	<MoreHorizontal className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end" className="rounded-xl">
																{/* View — always */}
																<DropdownMenuItem asChild>
																	<Link href={`${basePath}/${invoice.id}`}>
																		<Eye className="h-4 w-4 me-2" />
																		{t("finance.actions.preview")}
																	</Link>
																</DropdownMenuItem>

																{/* Edit — only DRAFT */}
																{isDraft && (
																	<DropdownMenuItem asChild>
																		<Link href={`${basePath}/${invoice.id}/edit`}>
																			<Edit className="h-4 w-4 me-2" />
																			{t("finance.actions.edit")}
																		</Link>
																	</DropdownMenuItem>
																)}

																{/* Print — always */}
																<DropdownMenuItem asChild>
																	<Link href={`${basePath}/${invoice.id}/preview`}>
																		<Printer className="h-4 w-4 me-2" />
																		{t("finance.actions.print")}
																	</Link>
																</DropdownMenuItem>

																<DropdownMenuSeparator />

																{/* Add Payment — only non-DRAFT, non-PAID, non-CANCELLED */}
																{canAddPayment && (
																	<DropdownMenuItem
																		onClick={() => router.push(`${basePath}/${invoice.id}`)}
																	>
																		<CreditCard className="h-4 w-4 me-2" />
																		{t("finance.actions.addPayment")}
																	</DropdownMenuItem>
																)}

																{/* Issue — only DRAFT */}
																{isDraft && (
																	<DropdownMenuItem
																		onClick={() => setIssueInvoiceId(invoice.id)}
																	>
																		<FileCheck className="h-4 w-4 me-2" />
																		{t("finance.actions.issue")}
																	</DropdownMenuItem>
																)}

																{/* Credit Note — only non-DRAFT, non-CANCELLED */}
																{canCreditNote && (
																	<DropdownMenuItem
																		onClick={() => router.push(`${basePath}/${invoice.id}/credit-note`)}
																	>
																		<FileMinus className="h-4 w-4 me-2" />
																		{t("finance.actions.creditNote")}
																	</DropdownMenuItem>
																)}

																{/* Duplicate — always */}
																<DropdownMenuItem
																	onClick={() => duplicateMutation.mutate(invoice.id)}
																	disabled={duplicateMutation.isPending}
																>
																	<Copy className="h-4 w-4 me-2" />
																	{t("finance.actions.duplicate")}
																</DropdownMenuItem>

																<DropdownMenuSeparator />

																{/* Delete — only DRAFT */}
																{isDraft && (
																	<DropdownMenuItem
																		className="text-red-600"
																		onClick={() => setDeleteInvoiceId(invoice.id)}
																	>
																		<Trash2 className="h-4 w-4 me-2" />
																		{t("finance.actions.delete")}
																	</DropdownMenuItem>
																)}
															</DropdownMenuContent>
														</DropdownMenu>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>

						{/* Pagination */}
						{totalCount > PAGE_SIZE && (
							<Pagination
								totalItems={totalCount}
								itemsPerPage={PAGE_SIZE}
								currentPage={currentPage}
								onChangeCurrentPage={setCurrentPage}
							/>
						)}
					</>
				) : (
					<div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-2xl border border-white/80 dark:border-slate-800/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
						<div className="flex flex-col items-center justify-center py-16 text-center">
							<div className="p-5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/50 dark:to-slate-800/30 mb-5">
								<Receipt className="h-12 w-12 text-slate-400 dark:text-slate-500" />
							</div>
							<h3 className="text-lg font-medium text-foreground">
								{t("finance.invoices.empty")}
							</h3>
							<p className="text-muted-foreground mt-2 max-w-sm text-sm">
								{t("finance.invoices.emptyDescription")}
							</p>
							<Button asChild className="mt-5 rounded-[10px] h-9 px-5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-[0_4px_15px_hsl(var(--primary)/0.35)] hover:shadow-[0_6px_20px_hsl(var(--primary)/0.45)] transition-all">
								<Link href={`${basePath}/new`}>
									<Plus className="ml-2 h-4 w-4" />
									{t("finance.invoices.create")}
								</Link>
							</Button>
						</div>
					</div>
				)}
			</div>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={!!deleteInvoiceId} onOpenChange={() => setDeleteInvoiceId(null)}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("finance.invoices.deleteConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("finance.invoices.deleteConfirmDescription")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteInvoiceId && deleteMutation.mutate(deleteInvoiceId)}
							disabled={deleteMutation.isPending}
							className="rounded-xl bg-red-600 hover:bg-red-700"
						>
							{deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Issue Confirmation Dialog */}
			<AlertDialog open={!!issueInvoiceId} onOpenChange={() => setIssueInvoiceId(null)}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{t("finance.invoices.issueConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("finance.invoices.issueConfirmDescription")}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => issueInvoiceId && issueMutation.mutate(issueInvoiceId)}
							disabled={issueMutation.isPending}
							className="rounded-xl"
						>
							{issueMutation.isPending ? t("common.saving") : t("finance.invoices.issueConfirmButton")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
