"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import { Search, PackageCheck, Calendar } from "lucide-react";
import { formatDate } from "@shared/lib/formatters";

interface GRListProps {
	organizationId: string;
	organizationSlug: string;
}

const GR_STATUS_COLORS: Record<string, string> = {
	PENDING_INSPECTION: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
	GR_ACCEPTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
	PARTIALLY_ACCEPTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
	GR_REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
};

export function GRList({ organizationId, organizationSlug }: GRListProps) {
	const t = useTranslations();
	const router = useRouter();

	const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
	const basePath = `/app/${organizationSlug}/procurement/receipts`;

	const { data, isLoading } = useQuery(
		orpc.procurement.goodsReceipts.list.queryOptions({
			input: {
				organizationId,
				status: statusFilter as any,
			},
		}),
	);

	const receipts = data ?? [];

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<Select
					value={statusFilter || "all"}
					onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}
				>
					<SelectTrigger className="w-48 rounded-xl">
						<SelectValue placeholder={t("procurement.allStatuses")} />
					</SelectTrigger>
					<SelectContent className="rounded-xl">
						<SelectItem value="all">{t("procurement.allStatuses")}</SelectItem>
						{Object.keys(GR_STATUS_COLORS).map((s) => (
							<SelectItem key={s} value={s}>{t(`procurement.grStatuses.${s}`)}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<Card className="rounded-2xl">
				<CardContent className="p-0">
					{isLoading ? (
						<div className="flex items-center justify-center py-20">
							<div className="relative">
								<div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
								<div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
							</div>
						</div>
					) : receipts.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="mb-4 rounded-2xl bg-muted p-4">
								<PackageCheck className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="text-muted-foreground">{t("procurement.noReceipts")}</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("procurement.grNumber")}</TableHead>
									<TableHead>{t("procurement.poNumber")}</TableHead>
									<TableHead>{t("procurement.status")}</TableHead>
									<TableHead>{t("procurement.receiptDate")}</TableHead>
									<TableHead>{t("procurement.inspectedBy")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{receipts.map((gr) => (
									<TableRow
										key={gr.id}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() => router.push(`${basePath}/${gr.id}`)}
									>
										<TableCell>
											<Badge variant="outline" className="rounded-lg font-mono">{gr.grNumber}</Badge>
										</TableCell>
										<TableCell>{gr.purchaseOrder?.poNumber ?? "-"}</TableCell>
										<TableCell>
											<Badge className={`rounded-lg border-0 ${GR_STATUS_COLORS[gr.status] ?? ""}`}>
												{t(`procurement.grStatuses.${gr.status}`)}
											</Badge>
										</TableCell>
										<TableCell>
											<span className="flex items-center gap-1 text-sm text-muted-foreground">
												<Calendar className="h-3 w-3" />
												{formatDate(new Date(gr.receiptDate))}
											</span>
										</TableCell>
										<TableCell>{gr.inspectedBy?.name ?? "-"}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
