"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
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
	Plus,
	Search,
	Receipt,
	MoreHorizontal,
	Eye,
	Edit,
	Trash2,
	CreditCard,
	QrCode,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatDate, isOverdue } from "../../lib/utils";
import { Currency } from "../shared/Currency";
import { StatusBadge } from "../shared/StatusBadge";

interface InvoicesListProps {
	organizationId: string;
	organizationSlug: string;
}

export function InvoicesList({ organizationId, organizationSlug }: InvoicesListProps) {
	const t = useTranslations();
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const basePath = `/app/${organizationSlug}/finance/invoices`;

	const { data, isLoading, refetch } = useQuery(
		orpc.finance.invoices.list.queryOptions({
			input: {
				organizationId,
				status: statusFilter !== "all" ? statusFilter as any : undefined,
				query: searchTerm || undefined,
			},
		}),
	);

	const invoices = data?.invoices ?? [];

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
			{/* Search and Filter Bar */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 items-center gap-3">
					<div className="relative flex-1 max-w-md">
						<Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<Input
							placeholder={t("finance.invoices.searchPlaceholder")}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pr-10 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl"
						/>
					</div>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-[160px] bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-xl">
							<SelectValue placeholder={t("finance.invoices.allStatuses")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("finance.invoices.allStatuses")}</SelectItem>
							<SelectItem value="DRAFT">{t("finance.invoices.status.draft")}</SelectItem>
							<SelectItem value="SENT">{t("finance.invoices.status.sent")}</SelectItem>
							<SelectItem value="PARTIALLY_PAID">{t("finance.invoices.status.partially_paid")}</SelectItem>
							<SelectItem value="PAID">{t("finance.invoices.status.paid")}</SelectItem>
							<SelectItem value="OVERDUE">{t("finance.invoices.status.overdue")}</SelectItem>
							<SelectItem value="CANCELLED">{t("finance.invoices.status.cancelled")}</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Invoices Table */}
			{invoices.length > 0 ? (
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
													<DropdownMenuItem asChild>
														<Link href={`${basePath}/${invoice.id}/preview`}>
															<Eye className="h-4 w-4 me-2" />
															{t("finance.actions.preview")}
														</Link>
													</DropdownMenuItem>
													<DropdownMenuItem asChild>
														<Link href={`${basePath}/${invoice.id}`}>
															<Edit className="h-4 w-4 me-2" />
															{t("finance.actions.edit")}
														</Link>
													</DropdownMenuItem>
													{invoice.status !== "PAID" && (
														<DropdownMenuItem>
															<CreditCard className="h-4 w-4 me-2" />
															{t("finance.actions.addPayment")}
														</DropdownMenuItem>
													)}
													{invoice.invoiceType !== "TAX" && (
														<DropdownMenuItem>
															<QrCode className="h-4 w-4 me-2" />
															{t("finance.actions.convertToTax")}
														</DropdownMenuItem>
													)}
													<DropdownMenuSeparator />
													<DropdownMenuItem className="text-red-600">
														<Trash2 className="h-4 w-4 me-2" />
														{t("finance.actions.delete")}
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</div>
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
		</div>
	);
}
