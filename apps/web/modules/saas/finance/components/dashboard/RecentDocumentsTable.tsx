"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Eye,
	Edit,
	Download,
	ArrowUpRight,
	FileText,
	Receipt,
} from "lucide-react";
import { formatDate } from "../../lib/utils";
import { Currency } from "../shared/Currency";

interface Document {
	id: string;
	documentNo: string;
	clientName: string;
	totalAmount: number;
	status: string;
	createdAt: string | Date;
	type: "quotation" | "invoice";
}

interface RecentDocumentsTableProps {
	quotations: Array<{
		id: string;
		quotationNo: string;
		clientName: string;
		totalAmount: number;
		status: string;
		createdAt: string | Date;
	}>;
	invoices: Array<{
		id: string;
		invoiceNo: string;
		clientName: string;
		totalAmount: number;
		status: string;
		createdAt: string | Date;
	}>;
	organizationSlug: string;
}

const quotationStatusConfig: Record<string, { bg: string; text: string }> = {
	DRAFT: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
	SENT: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-600 dark:text-blue-400" },
	VIEWED: { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-600 dark:text-purple-400" },
	ACCEPTED: { bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-600 dark:text-green-400" },
	REJECTED: { bg: "bg-red-100 dark:bg-red-900/50", text: "text-red-600 dark:text-red-400" },
	EXPIRED: { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-600 dark:text-amber-400" },
	CONVERTED: { bg: "bg-teal-100 dark:bg-teal-900/50", text: "text-teal-600 dark:text-teal-400" },
};

const invoiceStatusConfig: Record<string, { bg: string; text: string }> = {
	DRAFT: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
	SENT: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-600 dark:text-blue-400" },
	VIEWED: { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-600 dark:text-purple-400" },
	PARTIALLY_PAID: { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-600 dark:text-amber-400" },
	PAID: { bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-600 dark:text-green-400" },
	OVERDUE: { bg: "bg-red-100 dark:bg-red-900/50", text: "text-red-600 dark:text-red-400" },
	CANCELLED: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-500 dark:text-slate-500" },
};

export function RecentDocumentsTable({
	quotations,
	invoices,
	organizationSlug,
}: RecentDocumentsTableProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance`;

	// Combine and sort by date
	const documents: Document[] = [
		...quotations.map((q) => ({
			id: q.id,
			documentNo: q.quotationNo,
			clientName: q.clientName,
			totalAmount: q.totalAmount,
			status: q.status,
			createdAt: q.createdAt,
			type: "quotation" as const,
		})),
		...invoices.map((i) => ({
			id: i.id,
			documentNo: i.invoiceNo,
			clientName: i.clientName,
			totalAmount: i.totalAmount,
			status: i.status,
			createdAt: i.createdAt,
			type: "invoice" as const,
		})),
	]
		.sort((a, b) => {
			const dateA = new Date(a.createdAt).getTime();
			const dateB = new Date(b.createdAt).getTime();
			return dateB - dateA;
		})
		.slice(0, 10);

	const getStatusConfig = (type: "quotation" | "invoice", status: string) => {
		if (type === "quotation") {
			return quotationStatusConfig[status] ?? quotationStatusConfig.DRAFT;
		}
		return invoiceStatusConfig[status] ?? invoiceStatusConfig.DRAFT;
	};

	const getStatusLabel = (type: "quotation" | "invoice", status: string) => {
		if (type === "quotation") {
			return t(`finance.quotations.status.${status.toLowerCase()}`);
		}
		return t(`finance.invoices.status.${status.toLowerCase()}`);
	};

	return (
		<Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 transition-all duration-300 hover:shadow-xl">
			<CardHeader className="flex flex-row items-center justify-between pb-4">
				<CardTitle className="text-lg font-medium text-slate-900 dark:text-slate-100">
					{t("finance.dashboard.recentDocuments")}
				</CardTitle>
				<Link
					href={`${basePath}/quotations`}
					className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
				>
					{t("common.viewAll")}
					<ArrowUpRight className="h-4 w-4" />
				</Link>
			</CardHeader>
			<CardContent>
				{documents.length > 0 ? (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[140px]">
										{t("finance.dashboard.table.documentNo")}
									</TableHead>
									<TableHead>{t("finance.dashboard.table.client")}</TableHead>
									<TableHead className="w-[100px]">
										{t("finance.dashboard.table.type")}
									</TableHead>
									<TableHead className="w-[120px] text-end">
										{t("finance.dashboard.table.amount")}
									</TableHead>
									<TableHead className="w-[100px]">
										{t("finance.dashboard.table.status")}
									</TableHead>
									<TableHead className="w-[100px]">
										{t("finance.dashboard.table.date")}
									</TableHead>
									<TableHead className="w-[100px] text-center">
										{t("finance.dashboard.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{documents.map((doc) => {
									const statusConfig = getStatusConfig(doc.type, doc.status);
									const detailPath =
										doc.type === "quotation"
											? `${basePath}/quotations/${doc.id}`
											: `${basePath}/invoices/${doc.id}`;
									const editPath = `${detailPath}/edit`;

									return (
										<TableRow
											key={`${doc.type}-${doc.id}`}
											className="group hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
										>
											<TableCell>
												<Link
													href={detailPath}
													className="font-medium text-primary hover:text-primary/80 transition-colors"
												>
													{doc.documentNo}
												</Link>
											</TableCell>
											<TableCell className="text-slate-600 dark:text-slate-400">
												{doc.clientName}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-1.5">
													{doc.type === "quotation" ? (
														<FileText className="h-4 w-4 text-blue-500" />
													) : (
														<Receipt className="h-4 w-4 text-green-500" />
													)}
													<span className="text-xs">
														{t(`finance.dashboard.types.${doc.type}`)}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-end font-medium">
												<Currency amount={doc.totalAmount} />
											</TableCell>
											<TableCell>
												<span
													className={`text-xs px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text}`}
												>
													{getStatusLabel(doc.type, doc.status)}
												</span>
											</TableCell>
											<TableCell className="text-slate-500 text-sm">
												{formatDate(doc.createdAt)}
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 hover:bg-white/80 dark:hover:bg-slate-700/80"
														asChild
													>
														<Link href={detailPath}>
															<Eye className="h-4 w-4" />
														</Link>
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 hover:bg-white/80 dark:hover:bg-slate-700/80"
														asChild
													>
														<Link href={editPath}>
															<Edit className="h-4 w-4" />
														</Link>
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 hover:bg-white/80 dark:hover:bg-slate-700/80"
													>
														<Download className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				) : (
					<p className="text-center text-slate-500 py-8">
						{t("finance.dashboard.noRecentDocuments")}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
