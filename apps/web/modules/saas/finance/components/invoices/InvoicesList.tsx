"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import { EmptyState } from "@ui/components/empty-state";
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
	Download,
	Send,
	XCircle,
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
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";
import { BulkActionsBar } from "../../../../ui/components/bulk-actions-bar";
import { exportTableToCsv } from "../../../../../lib/export-table";

interface InvoicesListProps {
	organizationId: string;
	organizationSlug: string;
}

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

	// Drafts count (badge)
	const { data: draftCountData } = useQuery(
		orpc.finance.invoices.drafts.count.queryOptions({ input: { organizationId } }),
	);
	const draftCount = (draftCountData as any)?.count ?? 0;

	// Row selection state
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

	// Confirmation dialog states
	const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
	const [issueInvoiceId, setIssueInvoiceId] = useState<string | null>(null);
	const [bulkConfirm, setBulkConfirm] = useState<{ title: string; description?: string; onConfirm: () => Promise<void> } | null>(null);

	// Determine if the credit_note tab is selected (it's a type, not a status)
	const isCreditNoteTab = statusFilter === "CREDIT_NOTE";

	const { data, isLoading } = useQuery({
		...orpc.finance.invoices.list.queryOptions({
			input: {
				organizationId,
				status: !isCreditNoteTab && statusFilter !== "all" ? statusFilter as any : undefined,
				invoiceType: isCreditNoteTab ? "CREDIT_NOTE" as any : (typeFilter !== "all" ? typeFilter as any : undefined),
				query: searchTerm || undefined,
				limit: PAGE_SIZE,
				offset: (currentPage - 1) * PAGE_SIZE,
			},
		}),
		staleTime: STALE_TIMES.INVOICES,
	});

	const invoices = data?.invoices ?? [];
	const totalCount = data?.total ?? 0;

	// Selection helpers
	const toggleRow = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};
	const toggleAllPage = () => {
		if (selectedIds.size === invoices.length) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(invoices.map((inv: any) => inv.id)));
		}
	};
	const clearSelection = () => setSelectedIds(new Set());
	const selectedInvoices = invoices.filter((inv: any) => selectedIds.has(inv.id));

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
			queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.key() });
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
			queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.key() });
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
			queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.key() });
			router.push(`${basePath}/${data.id}`);
		},
		onError: (error: any) => {
			toast.error(error.message || t("finance.invoices.duplicateError"));
		},
	});

	if (isLoading) {
		return <ListTableSkeleton />;
	}

	return (
		<div className="-mx-4 -mt-2 px-4 pt-0 pb-24 sm:-mx-6 sm:px-6 min-h-[calc(100vh-4rem)] bg-background">
			<div className="space-y-5 max-w-6xl mx-auto">

				{/* ─── Header ─────────────────────────────────────────── */}
				<div className="sticky top-0 z-20 py-3 px-4 rounded-2xl bg-card border-2 border-border">
					<div className="flex flex-wrap items-center justify-between gap-3 max-w-6xl mx-auto">
						<div className="flex items-center gap-3 min-w-0">
							<Button type="button" variant="outline" size="icon" asChild className="h-9 w-9 shrink-0 rounded-xl border-border" aria-label={t("common.back")}>
								<Link href={`/app/${organizationSlug}/finance`}>
									<ArrowRight className="h-4 w-4 rtl:rotate-180" />
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
						<div className="flex items-center gap-2 shrink-0">
							<Button asChild size="sm" variant="outline" className="h-8 rounded-[10px] text-xs px-4">
								<Link href={`/app/${organizationSlug}/finance/invoices/drafts`}>
									<FileText className="h-3.5 w-3.5 me-1.5" />
									{t("drafts.button")}
									{draftCount > 0 && (
										<span className="ms-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-chart-1 text-primary text-[10px] font-bold">
											{draftCount}
										</span>
									)}
								</Link>
							</Button>
							<Button asChild size="sm" className="h-8 rounded-lg text-xs px-5">
								<Link href={`${basePath}/new`}>
									<Plus className="h-3.5 w-3.5 me-1.5" />
									{t("finance.invoices.create")}
								</Link>
							</Button>
						</div>
					</div>
				</div>

				{/* ─── Search + Filter (زر فلترة واحد للجوال والكمبيوتر) ── */}
				<div className="bg-card rounded-2xl border-2 border-border px-4 py-3 sm:px-5 sm:py-3.5">
					<div className="flex items-center gap-2">
						<div className="relative min-w-0 flex-1">
							<Search className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder={t("finance.invoices.searchPlaceholder")}
								value={searchTerm}
								onChange={(e: any) => {
									setSearchTerm(e.target.value);
									setCurrentPage(1);
								}}
								className="pe-10 rounded-lg h-9 border-input bg-card"
							/>
						</div>
						<MobileFilterSheet activeCount={statusFilter !== "all" ? 1 : 0}>
							<Select value={statusFilter} onValueChange={handleStatusChange}>
								<SelectTrigger className="w-full rounded-xl">
									<SelectValue placeholder={t("finance.invoices.allStatuses")} />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									<SelectItem value="all">{t("finance.invoices.statusTabs.all")}</SelectItem>
									<SelectItem value="OVERDUE">{t("finance.invoices.statusTabs.overdue")}</SelectItem>
									<SelectItem value="DRAFT">{t("finance.invoices.statusTabs.draft")}</SelectItem>
									<SelectItem value="ISSUED">{t("finance.invoices.statusTabs.issued")}</SelectItem>
									<SelectItem value="SENT">{t("finance.invoices.statusTabs.sent")}</SelectItem>
									<SelectItem value="PARTIALLY_PAID">{t("finance.invoices.statusTabs.partially_paid")}</SelectItem>
									<SelectItem value="PAID">{t("finance.invoices.statusTabs.paid")}</SelectItem>
									<SelectItem value="CREDIT_NOTE">{t("finance.invoices.statusTabs.credit_note")}</SelectItem>
								</SelectContent>
							</Select>
						</MobileFilterSheet>
					</div>
				</div>

				{/* ─── Invoices Table ──────────────────────────────────── */}
				{invoices.length > 0 ? (
					<>
						<div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
							<div className="flex items-center gap-2.5 px-5 py-3.5 border-b-2 border-border">
								<div className="flex size-8 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
									<FileText className="h-[15px] w-[15px]" />
								</div>
								<span className="text-sm font-semibold text-card-foreground">{t("finance.invoices.title")}</span>
								<span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold">{totalCount}</span>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b-2 border-border">
											<th className="p-3 w-10">
												<Checkbox
													checked={invoices.length > 0 && selectedIds.size === invoices.length}
													onCheckedChange={toggleAllPage}
													aria-label={t("common.selectAll")}
												/>
											</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide">{t("finance.invoices.columns.number")}</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide hidden sm:table-cell">{t("finance.invoices.columns.client")}</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide hidden md:table-cell">{t("finance.invoices.columns.date")}</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide hidden lg:table-cell">{t("finance.invoices.columns.dueDate")}</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide">{t("finance.invoices.columns.amount")}</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide hidden md:table-cell">{t("finance.invoices.columns.paid")}</th>
											<th className="p-3 text-start text-[11.5px] font-semibold text-muted-foreground tracking-wide">{t("finance.invoices.columns.status")}</th>
											<th className="p-3 text-center text-[11.5px] font-semibold text-muted-foreground tracking-wide hidden lg:table-cell">{t("zatca.title")}</th>
											<th className="p-3 w-10" />
										</tr>
									</thead>
									<tbody>
										{invoices.map((invoice: any) => {
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
													className={`border-b border-border last:border-0 hover:bg-primary/[0.02] transition-colors ${
														overdue ? "bg-destructive/5" : ""
													}`}
												>
													<td className="p-3" onClick={(e) => e.stopPropagation()}>
													<Checkbox
														checked={selectedIds.has(invoice.id)}
														onCheckedChange={() => toggleRow(invoice.id)}
														aria-label={`${t("common.select")} ${invoice.invoiceNo ?? ""}`}
													/>
												</td>
												<td className="p-3 font-medium">
														<Link
															href={`${basePath}/${invoice.id}`}
															className="text-primary hover:underline flex items-center gap-2"
														>
															{invoice.invoiceNo}
															{invoice.invoiceType === "CREDIT_NOTE" && (
																<span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-destructive/15 text-destructive">
																	{t("finance.invoices.types.credit_note")}
																</span>
															)}
														</Link>
													</td>
													<td className="p-3 hidden sm:table-cell">
														<div>
															<p className="font-medium text-foreground">{invoice.clientName}</p>
															{invoice.clientCompany && (
																<p className="text-xs text-muted-foreground">{invoice.clientCompany}</p>
															)}
														</div>
													</td>
													<td className="p-3 text-muted-foreground hidden md:table-cell">{formatDate(invoice.issueDate)}</td>
													<td className={`p-3 hidden lg:table-cell ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
														{formatDate(invoice.dueDate)}
													</td>
													<td className="p-3 font-semibold">
														<Currency amount={invoice.totalAmount} />
													</td>
													<td className="p-3 text-success font-medium hidden md:table-cell">
														<Currency amount={invoice.paidAmount} />
													</td>
													<td className="p-3">
														<StatusBadge
															status={overdue && invoice.status !== "PAID" ? "OVERDUE" : invoice.status}
															type="invoice"
														/>
													</td>
													<td className="p-3 text-center hidden lg:table-cell">
														<ZatcaStatusIcon status={(invoice as any).zatcaSubmissionStatus} />
													</td>
													<td className="p-3">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="خيارات">
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

																{/* Print — يفتح المعاينة ويُطلق الطباعة فوراً */}
																<DropdownMenuItem asChild>
																	<Link href={`${basePath}/${invoice.id}/preview?print=1`}>
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
																		className="text-destructive"
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

						{/* Bulk Actions */}
						<BulkActionsBar
							selectedCount={selectedIds.size}
							totalCount={invoices.length}
							selectedIds={Array.from(selectedIds)}
							onClearSelection={clearSelection}
							actions={[
								{
									label: t("common.export"),
									icon: <Download className="h-4 w-4 me-1.5" />,
									onClick: () => {
										exportTableToCsv(
											selectedInvoices as unknown as Record<string, unknown>[],
											[
												{ key: "invoiceNo", label: t("finance.invoices.columns.number") },
												{ key: "clientName", label: t("finance.invoices.columns.client") },
												{ key: "totalAmount", label: t("finance.invoices.columns.amount") },
												{ key: "paidAmount", label: t("finance.invoices.columns.paid") },
												{ key: "status", label: t("finance.invoices.columns.status") },
												{ key: "issueDate", label: t("finance.invoices.columns.date") },
												{ key: "dueDate", label: t("finance.invoices.columns.dueDate") },
											],
											"invoices",
										);
										clearSelection();
									},
								},
								{
									label: t("finance.invoices.bulkMarkAsSent"),
									icon: <Send className="h-4 w-4 me-1.5" />,
									onClick: () => {
										const eligible = selectedInvoices.filter((inv: any) => inv.status === "ISSUED");
										if (eligible.length === 0) {
											toast.error(t("finance.invoices.noEligibleForSent"));
											return;
										}
										setBulkConfirm({
											title: t("finance.invoices.bulkMarkAsSentConfirm", { count: eligible.length }),
											onConfirm: async () => {
												await Promise.allSettled(
													eligible.map((inv: any) =>
														orpcClient.finance.invoices.issue({ organizationId, id: inv.id }),
													),
												);
												queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.key() });
												clearSelection();
												setBulkConfirm(null);
												toast.success(t("finance.invoices.bulkActionSuccess"));
											},
										});
									},
								},
								{
									label: t("finance.invoices.bulkCancelDrafts"),
									icon: <XCircle className="h-4 w-4 me-1.5" />,
									variant: "destructive",
									onClick: () => {
										const eligible = selectedInvoices.filter((inv: any) => inv.status === "DRAFT");
										if (eligible.length === 0) {
											toast.error(t("finance.invoices.noEligibleForCancel"));
											return;
										}
										setBulkConfirm({
											title: t("finance.invoices.bulkCancelConfirm", { count: eligible.length }),
											description: t("finance.invoices.bulkCancelWarning"),
											onConfirm: async () => {
												await Promise.allSettled(
													eligible.map((inv: any) =>
														orpcClient.finance.invoices.delete({ organizationId, id: inv.id }),
													),
												);
												queryClient.invalidateQueries({ queryKey: orpc.finance.invoices.key() });
												clearSelection();
												setBulkConfirm(null);
												toast.success(t("finance.invoices.bulkActionSuccess"));
											},
										});
									},
								},
							]}
						/>

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
					<EmptyState
						icon={<Receipt className="h-12 w-12" />}
						title={t("finance.invoices.empty")}
						description={t("finance.invoices.emptyDescription")}
					>
						<Button asChild className="rounded-lg h-9 px-5">
							<Link href={`${basePath}/new`}>
								<Plus className="ms-2 h-4 w-4" />
								{t("finance.invoices.create")}
							</Link>
						</Button>
					</EmptyState>
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
							className="rounded-xl bg-destructive hover:bg-destructive/90"
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

			{/* Bulk Action Confirmation Dialog */}
			<AlertDialog open={!!bulkConfirm} onOpenChange={() => setBulkConfirm(null)}>
				<AlertDialogContent className="rounded-2xl">
					<AlertDialogHeader>
						<AlertDialogTitle>{bulkConfirm?.title}</AlertDialogTitle>
						{bulkConfirm?.description && (
							<AlertDialogDescription>{bulkConfirm.description}</AlertDialogDescription>
						)}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => bulkConfirm?.onConfirm()}
							className="rounded-xl"
						>
							{t("common.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

// ─── ZATCA Status Icon (inline helper) ──────────────────────────────────

function ZatcaStatusIcon({ status }: { status?: string | null }) {
	if (!status || status === "NOT_APPLICABLE") {
		return <span className="text-muted-foreground">—</span>;
	}
	if (status === "CLEARED" || status === "REPORTED") {
		return (
			<span title={status === "CLEARED" ? "Cleared" : "Reported"} className="text-success">
				<FileCheck className="h-4 w-4 inline-block" />
			</span>
		);
	}
	if (status === "REJECTED") {
		return (
			<span title="Rejected" className="text-destructive">
				<XCircle className="h-4 w-4 inline-block" />
			</span>
		);
	}
	if (status === "FAILED") {
		return (
			<span title="Failed" className="text-chart-1">
				<XCircle className="h-4 w-4 inline-block" />
			</span>
		);
	}
	// PENDING, SUBMITTED
	return (
		<span title="Pending" className="text-chart-4 animate-pulse">
			<FileCheck className="h-4 w-4 inline-block" />
		</span>
	);
}
