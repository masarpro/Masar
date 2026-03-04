"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
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
import { Search, Plus, FileText, Calendar } from "lucide-react";
import { Currency } from "@saas/finance/components/shared/Currency";
import { formatDate } from "@shared/lib/formatters";

interface PRListProps {
	organizationId: string;
	organizationSlug: string;
}

const PR_STATUS_COLORS: Record<string, string> = {
	PR_DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
	PR_PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
	PR_APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
	PR_REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
	PARTIALLY_ORDERED: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
	FULLY_ORDERED: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400",
	PR_CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
};

const PRIORITY_COLORS: Record<string, string> = {
	LOW: "bg-slate-100 text-slate-600",
	MEDIUM: "bg-blue-100 text-blue-700",
	HIGH: "bg-orange-100 text-orange-700",
	URGENT: "bg-red-100 text-red-700",
};

export function PRList({ organizationId, organizationSlug }: PRListProps) {
	const t = useTranslations();
	const router = useRouter();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

	const basePath = `/app/${organizationSlug}/procurement/requests`;

	const { data, isLoading } = useQuery(
		orpc.procurement.purchaseRequests.list.queryOptions({
			input: {
				organizationId,
				query: searchQuery || undefined,
				status: statusFilter as any,
			},
		}),
	);

	const requests = data ?? [];

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
					<div className="relative flex-1 max-w-xs">
						<Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder={t("procurement.search")}
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="ps-10 rounded-xl"
						/>
					</div>
					<Select
						value={statusFilter || "all"}
						onValueChange={(v) => setStatusFilter(v === "all" ? undefined : v)}
					>
						<SelectTrigger className="w-48 rounded-xl">
							<SelectValue placeholder={t("procurement.allStatuses")} />
						</SelectTrigger>
						<SelectContent className="rounded-xl">
							<SelectItem value="all">{t("procurement.allStatuses")}</SelectItem>
							{["PR_DRAFT", "PR_PENDING", "PR_APPROVED", "PR_REJECTED", "PARTIALLY_ORDERED", "FULLY_ORDERED", "PR_CANCELLED"].map((s) => (
								<SelectItem key={s} value={s}>{t(`procurement.prStatuses.${s}`)}</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button className="rounded-xl" onClick={() => router.push(`${basePath}/new`)}>
					<Plus className="me-2 h-4 w-4" />
					{t("procurement.newRequest")}
				</Button>
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
					) : requests.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-center">
							<div className="mb-4 rounded-2xl bg-muted p-4">
								<FileText className="h-8 w-8 text-muted-foreground" />
							</div>
							<p className="mb-4 text-muted-foreground">{t("procurement.noRequests")}</p>
							<Button className="rounded-xl" onClick={() => router.push(`${basePath}/new`)}>
								<Plus className="me-2 h-4 w-4" />
								{t("procurement.newRequest")}
							</Button>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("procurement.prNumber")}</TableHead>
									<TableHead>{t("procurement.requestTitle")}</TableHead>
									<TableHead>{t("procurement.project")}</TableHead>
									<TableHead>{t("procurement.status")}</TableHead>
									<TableHead>{t("procurement.priorities.MEDIUM")}</TableHead>
									<TableHead>{t("procurement.requestedBy")}</TableHead>
									<TableHead className="text-end">{t("procurement.estimatedTotal")}</TableHead>
									<TableHead>{t("procurement.date")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{requests.map((pr) => (
									<TableRow
										key={pr.id}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() => router.push(`${basePath}/${pr.id}`)}
									>
										<TableCell>
											<Badge variant="outline" className="rounded-lg font-mono">
												{pr.prNumber}
											</Badge>
										</TableCell>
										<TableCell className="max-w-[200px] truncate font-medium">
											{pr.title}
										</TableCell>
										<TableCell>{pr.project?.name ?? "-"}</TableCell>
										<TableCell>
											<Badge className={`rounded-lg border-0 ${PR_STATUS_COLORS[pr.status] ?? ""}`}>
												{t(`procurement.prStatuses.${pr.status}`)}
											</Badge>
										</TableCell>
										<TableCell>
											<Badge className={`rounded-lg border-0 ${PRIORITY_COLORS[pr.priority] ?? ""}`}>
												{t(`procurement.priorities.${pr.priority}`)}
											</Badge>
										</TableCell>
										<TableCell>{pr.requestedBy?.name ?? "-"}</TableCell>
										<TableCell className="text-end">
											<Currency amount={Number(pr.estimatedTotal)} />
										</TableCell>
										<TableCell>
											<span className="flex items-center gap-1 text-sm text-muted-foreground">
												<Calendar className="h-3 w-3" />
												{formatDate(new Date(pr.createdAt))}
											</span>
										</TableCell>
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
