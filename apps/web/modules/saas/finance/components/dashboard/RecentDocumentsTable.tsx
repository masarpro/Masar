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
	Receipt,
} from "lucide-react";
import { formatDate } from "../../lib/utils";
import { Currency } from "../shared/Currency";

interface RecentDocumentsTableProps {
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
	invoices,
	organizationSlug,
}: RecentDocumentsTableProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/finance`;

	const documents = [...invoices]
		.sort((a, b) => {
			const dateA = new Date(a.createdAt).getTime();
			const dateB = new Date(b.createdAt).getTime();
			return dateB - dateA;
		})
		.slice(0, 10);

	return (
		<Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 transition-all duration-300 hover:shadow-xl">
			<CardHeader className="flex flex-row items-center justify-between pb-4">
				<CardTitle className="text-lg font-medium text-slate-900 dark:text-slate-100">
					{t("finance.dashboard.recentDocuments")}
				</CardTitle>
				<Link
					href={`${basePath}/invoices`}
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
									const statusConfig = invoiceStatusConfig[doc.status] ?? invoiceStatusConfig.DRAFT;
									const detailPath = `${basePath}/invoices/${doc.id}`;
									const editPath = `${detailPath}/edit`;

									return (
										<TableRow
											key={doc.id}
											className="group hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
										>
											<TableCell>
												<Link
													href={detailPath}
													className="font-medium text-primary hover:text-primary/80 transition-colors"
												>
													{doc.invoiceNo}
												</Link>
											</TableCell>
											<TableCell className="text-slate-600 dark:text-slate-400">
												{doc.clientName}
											</TableCell>
											<TableCell className="text-end font-medium">
												<Currency amount={doc.totalAmount} />
											</TableCell>
											<TableCell>
												<span
													className={`text-xs px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text}`}
												>
													{t(`finance.invoices.status.${doc.status.toLowerCase()}`)}
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
