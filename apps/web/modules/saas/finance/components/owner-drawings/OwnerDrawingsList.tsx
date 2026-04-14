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
	Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ui/components/table";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@ui/components/select";
import { Search, Plus, UserMinus, Eye, TrendingDown, TrendingUp, Wallet, FileText } from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { Currency } from "../shared/Currency";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface OwnerDrawingsListProps {
	organizationId: string;
	organizationSlug: string;
}

const STATUS_COLORS: Record<string, string> = {
	APPROVED: "bg-green-100 text-green-700",
	CANCELLED: "bg-red-100 text-red-700",
};

const TYPE_COLORS: Record<string, string> = {
	COMPANY_LEVEL: "border-blue-300 text-blue-700 bg-blue-50",
	PROJECT_SPECIFIC: "border-purple-300 text-purple-700 bg-purple-50",
};

export function OwnerDrawingsList({
	organizationId,
	organizationSlug,
}: OwnerDrawingsListProps) {
	const t = useTranslations();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [ownerFilter, setOwnerFilter] = useState<string>("all");

	const basePath = `/app/${organizationSlug}/finance/owner-drawings`;

	const { data: rawData, isLoading } = useQuery(
		orpc.accounting.ownerDrawings.list.queryOptions({
			input: {
				organizationId,
				search: searchQuery || undefined,
				status: statusFilter !== "all" ? (statusFilter as any) : undefined,
				ownerId: ownerFilter !== "all" ? ownerFilter : undefined,
			},
		}),
	);
	const data = rawData as any;

	const { data: rawSummary } = useQuery(
		orpc.accounting.ownerDrawings.companySummary.queryOptions({
			input: { organizationId },
		}),
	);
	const summary = rawSummary as any;

	// Fetch owners for the filter dropdown
	const { data: rawOwners } = useQuery(
		orpc.accounting.owners.list.queryOptions({
			input: { organizationId },
		}),
	);
	const owners = (rawOwners as any)?.owners ?? rawOwners ?? [];

	const drawings = data?.items ?? [];
	const total = data?.total ?? 0;

	if (isLoading) return <ListTableSkeleton rows={8} cols={7} />;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-2xl font-bold">{t("finance.ownerDrawings.title")}</h1>
				<Button onClick={() => router.push(`${basePath}/new`)} className="w-full sm:w-auto">
					<Plus className="me-2 h-4 w-4" />
					{t("finance.ownerDrawings.new")}
				</Button>
			</div>

			{/* Summary Cards */}
			{summary && (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
					<Card className="border-red-200">
						<CardContent className="pt-4">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
								<span className="truncate">{t("finance.ownerDrawings.summary.totalDrawn")}</span>
							</div>
							<div className="mt-1 text-2xl font-bold text-red-600 tabular-nums">
								<Currency amount={summary.totalDrawingsThisYear} />
							</div>
						</CardContent>
					</Card>
					<Card className="border-green-200">
						<CardContent className="pt-4">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
								<span className="truncate">{t("finance.ownerDrawings.summary.yearProfit")}</span>
							</div>
							<div className="mt-1 text-2xl font-bold text-green-600 tabular-nums">
								<Currency amount={summary.currentYearProfit} />
							</div>
						</CardContent>
					</Card>
					<Card className="border-blue-200">
						<CardContent className="pt-4">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<Wallet className="h-4 w-4 text-blue-500 shrink-0" />
								<span className="truncate">{t("finance.ownerDrawings.summary.available")}</span>
							</div>
							<div className="mt-1 text-2xl font-bold text-blue-600 tabular-nums">
								<Currency amount={summary.availableForDrawing} />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-4">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<FileText className="h-4 w-4 shrink-0" />
								<span className="truncate">{t("finance.ownerDrawings.summary.totalCount")}</span>
							</div>
							<div className="mt-1 text-2xl font-bold tabular-nums">
								{summary.drawingsByOwner?.reduce((sum: number, o: any) => sum + o.count, 0) ?? 0}
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Filters */}
			<div className="flex flex-col gap-2 md:flex-row md:items-center">
				<div className="relative flex-1">
					<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("common.search")}
						value={searchQuery}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
						className="ps-9"
					/>
				</div>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-full md:w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("common.all")}</SelectItem>
						<SelectItem value="APPROVED">{t("finance.ownerDrawings.statuses.APPROVED")}</SelectItem>
						<SelectItem value="CANCELLED">{t("finance.ownerDrawings.statuses.CANCELLED")}</SelectItem>
					</SelectContent>
				</Select>
				<Select value={ownerFilter} onValueChange={setOwnerFilter}>
					<SelectTrigger className="w-full md:w-[200px]">
						<SelectValue placeholder={t("finance.ownerDrawings.allOwners")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("finance.ownerDrawings.allOwners")}</SelectItem>
						{Array.isArray(owners) && owners.map((owner: any) => (
							<SelectItem key={owner.id} value={owner.id}>{owner.name}</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			{drawings.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<UserMinus className="mb-4 h-12 w-12 text-muted-foreground" />
						<p className="text-lg font-medium">{t("finance.ownerDrawings.noDrawings")}</p>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("finance.ownerDrawings.noDrawingsDescription")}
						</p>
						<Button className="mt-4" onClick={() => router.push(`${basePath}/new`)}>
							<Plus className="me-2 h-4 w-4" />
							{t("finance.ownerDrawings.new")}
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("finance.ownerDrawings.drawingNo")}</TableHead>
								<TableHead className="hidden md:table-cell">{t("finance.ownerDrawings.date")}</TableHead>
								<TableHead className="hidden md:table-cell">{t("finance.ownerDrawings.ownerName")}</TableHead>
								<TableHead>{t("finance.ownerDrawings.amount")}</TableHead>
								<TableHead className="hidden md:table-cell">{t("finance.ownerDrawings.type")}</TableHead>
								<TableHead className="hidden lg:table-cell">{t("finance.ownerDrawings.project")}</TableHead>
								<TableHead className="hidden md:table-cell">{t("finance.ownerDrawings.status")}</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{drawings.map((d: any) => (
								<TableRow
									key={d.id}
									className="cursor-pointer"
									onClick={() => router.push(`${basePath}/${d.id}`)}
								>
									<TableCell className="font-mono font-medium">{d.drawingNo}</TableCell>
									<TableCell className="hidden md:table-cell">{formatDate(d.date)}</TableCell>
									<TableCell className="hidden md:table-cell">{d.owner?.name ?? "-"}</TableCell>
									<TableCell className="tabular-nums"><Currency amount={Number(d.amount)} /></TableCell>
									<TableCell className="hidden md:table-cell">
										<Badge variant="outline" className={TYPE_COLORS[d.type] ?? ""}>
											{t(`finance.ownerDrawings.types.${d.type}`)}
										</Badge>
									</TableCell>
									<TableCell className="hidden lg:table-cell">{d.project?.name ?? "-"}</TableCell>
									<TableCell className="hidden md:table-cell">
										<Badge className={STATUS_COLORS[d.status] ?? ""}>
											{t(`finance.ownerDrawings.statuses.${d.status}`)}
										</Badge>
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Card>
			)}

			<div className="text-sm text-muted-foreground">
				{t("common.totalResults", { count: total })}
			</div>
		</div>
	);
}
