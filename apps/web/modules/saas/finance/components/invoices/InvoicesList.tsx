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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
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
	QrCode,
	Printer,
	Copy,
	FileCheck,
	FileMinus,
	Send,
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
		<div className="space-y-6">
			{/* Status Tabs */}
			<div className="flex items-center gap-2 flex-wrap">
				{STATUS_TABS.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => handleStatusChange(tab.filterValue)}
						className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
							statusFilter === tab.filterValue
								? "bg-primary text-primary-foreground shadow-sm"
								: "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50"
						}`}
					>
						{t(`finance.invoices.statusTabs.${tab.key}`)}
					</button>
				))}
			</div>

			{/* Search and Filter Bar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3 flex-wrap">
					<div className="relative flex-1 min-w-[200px] max-w-md">
						<Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<Input
							placeholder={t("finance.invoices.searchPlaceholder")}
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setCurrentPage(1);
							}}
							className="pr-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl"
						/>
					</div>
					{/* Status dropdown */}
					<Select value={statusFilter} onValueChange={handleStatusChange}>
						<SelectTrigger className="w-[160px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
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
					{/* Type filter */}
					<Select value={typeFilter} onValueChange={handleTypeChange}>
						<SelectTrigger className="w-[160px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
							<SelectValue placeholder={t("finance.invoices.allTypes")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("finance.invoices.allTypes")}</SelectItem>
							<SelectItem value="STANDARD">{t("finance.invoices.types.standard")}</SelectItem>
							<SelectItem value="TAX">{t("finance.invoices.types.tax")}</SelectItem>
							<SelectItem value="SIMPLIFIED">{t("finance.invoices.types.simplified")}</SelectItem>
							<SelectItem value="CREDIT_NOTE">{t("finance.invoices.types.credit_note")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Invoices Table */}
			{invoices.length > 0 ? (
				<>
					<div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
						<Table>
							<TableHeader>
								<TableRow className="bg-slate-50 dark:bg-slate-900/50">
									<TableHead className="font-medium">{t("finance.invoices.columns.number")}</TableHead>
									<TableHead className="font-medium">{t("finance.invoices.columns.client")}</TableHead>
									<TableHead className="font-medium">{t("finance.invoices.columns.date")}</TableHead>
									<TableHead className="font-medium">{t("finance.invoices.columns.dueDate")}</TableHead>
									<TableHead className="font-medium">{t("finance.invoices.columns.amount")}</TableHead>
									<TableHead className="font-medium">{t("finance.invoices.columns.paid")}</TableHead>
									<TableHead className="font-medium">{t("finance.invoices.columns.status")}</TableHead>
									<TableHead className="w-[50px]" />
								</TableRow>
							</TableHeader>
							<TableBody>
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
										<TableRow
											key={invoice.id}
											className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
												overdue ? "bg-red-50/50 dark:bg-red-950/20" : ""
											}`}
										>
											<TableCell className="font-medium">
												<Link
													href={`${basePath}/${invoice.id}`}
													className="text-primary hover:underline flex items-center gap-2"
												>
													{invoice.invoiceNo}
													{invoice.invoiceType === "TAX" && (
														<QrCode className="h-3 w-3 text-green-600" />
													)}
													{invoice.invoiceType === "CREDIT_NOTE" && (
														<span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400">
															{t("finance.invoices.types.credit_note")}
														</span>
													)}
												</Link>
											</TableCell>
											<TableCell>
												<div>
													<p className="font-medium text-slate-900 dark:text-slate-100">
														{invoice.clientName}
													</p>
													{invoice.clientCompany && (
														<p className="text-sm text-slate-500">
															{invoice.clientCompany}
														</p>
													)}
												</div>
											</TableCell>
											<TableCell className="text-slate-600 dark:text-slate-400">
												{formatDate(invoice.issueDate)}
											</TableCell>
											<TableCell className={overdue ? "text-red-600 font-medium" : "text-slate-600 dark:text-slate-400"}>
												{formatDate(invoice.dueDate)}
											</TableCell>
											<TableCell className="font-semibold">
												<Currency amount={invoice.totalAmount} />
											</TableCell>
											<TableCell className="text-green-600 font-medium">
												<Currency amount={invoice.paidAmount} />
											</TableCell>
											<TableCell>
												<StatusBadge
													status={overdue && invoice.status !== "PAID" ? "OVERDUE" : invoice.status}
													type="invoice"
												/>
											</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon" className="h-8 w-8">
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
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
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
				<div className="flex flex-col items-center justify-center py-16 text-center">
					<div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 mb-5">
						<Receipt className="h-12 w-12 text-slate-400 dark:text-slate-500" />
					</div>
					<h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
						{t("finance.invoices.empty")}
					</h3>
					<p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm">
						{t("finance.invoices.emptyDescription")}
					</p>
					<Button asChild className="mt-5 rounded-xl">
						<Link href={`${basePath}/new`}>
							<Plus className="ml-2 h-4 w-4" />
							{t("finance.invoices.create")}
						</Link>
					</Button>
				</div>
			)}

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
