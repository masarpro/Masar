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
	ArrowUpRight,
	Calculator,
	FileSpreadsheet,
} from "lucide-react";
import { formatDate } from "@saas/finance/lib/utils";
import { Currency } from "@saas/finance/components/shared/Currency";

interface RecentDocument {
	id: string;
	type: "study" | "quotation";
	title: string;
	clientName: string;
	amount: number;
	status: string;
	createdAt: string | Date;
}

interface PricingRecentDocsTableProps {
	documents: RecentDocument[];
	organizationSlug: string;
}

const studyStatusConfig: Record<string, { bg: string; text: string }> = {
	draft: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
	in_review: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-600 dark:text-blue-400" },
	in_progress: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-600 dark:text-blue-400" },
	completed: { bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-600 dark:text-emerald-400" },
	approved: { bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-600 dark:text-green-400" },
};

// Map DB status to translation key
const studyStatusTranslationKey: Record<string, string> = {
	draft: "draft",
	in_review: "inProgress",
	in_progress: "in_progress",
	completed: "completed",
	approved: "approved",
};

const quotationStatusConfig: Record<string, { bg: string; text: string }> = {
	DRAFT: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
	SENT: { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-600 dark:text-blue-400" },
	VIEWED: { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-600 dark:text-purple-400" },
	ACCEPTED: { bg: "bg-green-100 dark:bg-green-900/50", text: "text-green-600 dark:text-green-400" },
	REJECTED: { bg: "bg-red-100 dark:bg-red-900/50", text: "text-red-600 dark:text-red-400" },
	EXPIRED: { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-600 dark:text-amber-400" },
	CONVERTED: { bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-600 dark:text-emerald-400" },
};

export function PricingRecentDocsTable({
	documents,
	organizationSlug,
}: PricingRecentDocsTableProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/pricing`;

	return (
		<Card className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 transition-all duration-300 hover:shadow-xl">
			<CardHeader className="flex flex-row items-center justify-between pb-4">
				<CardTitle className="text-lg font-medium text-slate-900 dark:text-slate-100">
					{t("pricing.dashboard.recentDocuments")}
				</CardTitle>
				<Link
					href={`${basePath}/studies`}
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
									<TableHead className="w-[50px]">
										{t("pricing.dashboard.table.type")}
									</TableHead>
									<TableHead>
										{t("pricing.dashboard.table.title")}
									</TableHead>
									<TableHead>{t("pricing.dashboard.table.client")}</TableHead>
									<TableHead className="w-[120px] text-end">
										{t("pricing.dashboard.table.amount")}
									</TableHead>
									<TableHead className="w-[100px]">
										{t("pricing.dashboard.table.status")}
									</TableHead>
									<TableHead className="w-[100px]">
										{t("pricing.dashboard.table.date")}
									</TableHead>
									<TableHead className="w-[60px] text-center">
										{t("pricing.dashboard.table.actions")}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{documents.map((doc) => {
									const isStudy = doc.type === "study";
									const statusConfig = isStudy
										? (studyStatusConfig[doc.status] ?? studyStatusConfig.draft)
										: (quotationStatusConfig[doc.status] ?? quotationStatusConfig.DRAFT);
									const detailPath = isStudy
										? `${basePath}/studies/${doc.id}`
										: `${basePath}/quotations/${doc.id}`;

									const statusLabel = isStudy
										? t(`pricing.studies.status.${studyStatusTranslationKey[doc.status] ?? doc.status}`)
										: t(`pricing.quotations.status.${doc.status.toLowerCase()}`);

									return (
										<TableRow
											key={`${doc.type}-${doc.id}`}
											className="group hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
										>
											<TableCell>
												{isStudy ? (
													<Calculator className="h-4 w-4 text-sky-500" />
												) : (
													<FileSpreadsheet className="h-4 w-4 text-violet-500" />
												)}
											</TableCell>
											<TableCell>
												<Link
													href={detailPath}
													className="font-medium text-primary hover:text-primary/80 transition-colors"
												>
													{doc.title}
												</Link>
											</TableCell>
											<TableCell className="text-slate-600 dark:text-slate-400">
												{doc.clientName || "—"}
											</TableCell>
											<TableCell className="text-end font-medium">
												<Currency amount={doc.amount} />
											</TableCell>
											<TableCell>
												<span
													className={`text-xs px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.text}`}
												>
													{statusLabel}
												</span>
											</TableCell>
											<TableCell className="text-slate-500 text-sm">
												{formatDate(doc.createdAt)}
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
						{t("pricing.dashboard.noRecentDocuments")}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
