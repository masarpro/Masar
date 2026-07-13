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
	draft: { bg: "bg-muted", text: "text-muted-foreground" },
	in_review: { bg: "bg-chart-4/15", text: "text-chart-4" },
	in_progress: { bg: "bg-chart-4/15", text: "text-chart-4" },
	completed: { bg: "bg-success/15", text: "text-success" },
	approved: { bg: "bg-success/15", text: "text-success" },
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
	DRAFT: { bg: "bg-muted", text: "text-muted-foreground" },
	SENT: { bg: "bg-chart-4/15", text: "text-chart-4" },
	VIEWED: { bg: "bg-chart-4/15", text: "text-chart-4" },
	ACCEPTED: { bg: "bg-success/15", text: "text-success" },
	REJECTED: { bg: "bg-destructive/15", text: "text-destructive" },
	EXPIRED: { bg: "bg-chart-1/15", text: "text-chart-1" },
	CONVERTED: { bg: "bg-success/15", text: "text-success" },
};

export function PricingRecentDocsTable({
	documents,
	organizationSlug,
}: PricingRecentDocsTableProps) {
	const t = useTranslations();
	const basePath = `/app/${organizationSlug}/pricing`;

	return (
		<Card className="rounded-3xl">
			<CardHeader className="flex flex-row items-center justify-between pb-4">
				<CardTitle className="text-lg font-semibold text-card-foreground">
					{t("pricing.dashboard.recentDocuments")}
				</CardTitle>
				<Link
					href={`${basePath}/studies`}
					className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
				>
					{t("common.viewAll")}
					<ArrowUpRight className="h-4 w-4 rtl-flip" />
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
											className="group hover:bg-accent transition-colors"
										>
											<TableCell>
												{isStudy ? (
													<Calculator className="h-4 w-4 text-chart-4" />
												) : (
													<FileSpreadsheet className="h-4 w-4 text-chart-4" />
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
											<TableCell className="text-muted-foreground">
												{doc.clientName || "—"}
											</TableCell>
											<TableCell className="text-end font-medium">
												<Currency amount={doc.amount} />
											</TableCell>
											<TableCell>
												<span
													className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.text}`}
												>
													{statusLabel}
												</span>
											</TableCell>
											<TableCell className="text-muted-foreground text-sm">
												{formatDate(doc.createdAt)}
											</TableCell>
											<TableCell>
												<div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8"
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
					<p className="text-center text-muted-foreground py-8">
						{t("pricing.dashboard.noRecentDocuments")}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
