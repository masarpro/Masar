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
import { Search, Plus, ClipboardCheck, Eye } from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface HandoverProtocolsListProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

const TYPE_COLORS: Record<string, string> = {
	ITEM_ACCEPTANCE: "bg-blue-100 text-blue-700",
	PRELIMINARY: "bg-purple-100 text-purple-700",
	FINAL: "bg-green-100 text-green-700",
	DELIVERY: "bg-orange-100 text-orange-700",
};

const STATUS_COLORS: Record<string, string> = {
	DRAFT: "bg-gray-100 text-gray-700",
	PENDING_SIGNATURES: "bg-amber-100 text-amber-700",
	PARTIALLY_SIGNED: "bg-orange-100 text-orange-700",
	COMPLETED: "bg-green-100 text-green-700",
	ARCHIVED: "bg-gray-200 text-gray-600",
};

export function HandoverProtocolsList({
	organizationId,
	organizationSlug,
	projectId,
}: HandoverProtocolsListProps) {
	const t = useTranslations();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const basePath = `/app/${organizationSlug}/projects/${projectId}/handover`;

	const { data: rawData, isLoading } = useQuery(
		orpc.handover.list.queryOptions({
			input: {
				organizationId,
				projectId,
				search: searchQuery || undefined,
				type: typeFilter !== "all" ? (typeFilter as any) : undefined,
				status: statusFilter !== "all" ? (statusFilter as any) : undefined,
			},
		}),
	);
	const data = rawData as any;

	const protocols = data?.items ?? [];
	const total = data?.total ?? 0;

	if (isLoading) return <ListTableSkeleton rows={8} cols={6} />;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">{t("handover.title")}</h1>
				<Button onClick={() => router.push(`${basePath}/new`)}>
					<Plus className="me-2 h-4 w-4" />
					{t("handover.new")}
				</Button>
			</div>

			{/* Filters */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<div className="relative flex-1">
					<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("common.search")}
						value={searchQuery}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
						className="ps-9"
					/>
				</div>
				<Select value={typeFilter} onValueChange={setTypeFilter}>
					<SelectTrigger className="w-[160px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("common.all")}</SelectItem>
						<SelectItem value="ITEM_ACCEPTANCE">{t("handover.types.ITEM_ACCEPTANCE")}</SelectItem>
						<SelectItem value="PRELIMINARY">{t("handover.types.PRELIMINARY")}</SelectItem>
						<SelectItem value="FINAL">{t("handover.types.FINAL")}</SelectItem>
						<SelectItem value="DELIVERY">{t("handover.types.DELIVERY")}</SelectItem>
					</SelectContent>
				</Select>
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("common.all")}</SelectItem>
						<SelectItem value="DRAFT">{t("handover.statuses.DRAFT")}</SelectItem>
						<SelectItem value="PENDING_SIGNATURES">{t("handover.statuses.PENDING_SIGNATURES")}</SelectItem>
						<SelectItem value="COMPLETED">{t("handover.statuses.COMPLETED")}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			{protocols.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<ClipboardCheck className="mb-4 h-12 w-12 text-muted-foreground" />
						<p className="text-lg font-medium">{t("handover.noProtocols")}</p>
						<p className="mt-1 text-sm text-muted-foreground">{t("handover.noProtocolsDescription")}</p>
						<Button className="mt-4" onClick={() => router.push(`${basePath}/new`)}>
							<Plus className="me-2 h-4 w-4" />
							{t("handover.new")}
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("handover.protocolNo")}</TableHead>
								<TableHead>{t("handover.types.ITEM_ACCEPTANCE").split(" ")[0]}</TableHead>
								<TableHead>{t("handover.titleField")}</TableHead>
								<TableHead>{t("handover.date")}</TableHead>
								<TableHead>{t("handover.items.title")}</TableHead>
								<TableHead>{t("handover.statuses.DRAFT").split(" ")[0]}</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{protocols.map((p: any) => (
								<TableRow
									key={p.id}
									className="cursor-pointer"
									onClick={() => router.push(`${basePath}/${p.id}`)}
								>
									<TableCell className="font-mono font-medium">{p.protocolNo}</TableCell>
									<TableCell>
										<Badge className={TYPE_COLORS[p.type] ?? ""}>
											{t(`handover.types.${p.type}`)}
										</Badge>
									</TableCell>
									<TableCell className="max-w-[200px] truncate">{p.title}</TableCell>
									<TableCell>{formatDate(p.date)}</TableCell>
									<TableCell>{p._count?.items ?? 0}</TableCell>
									<TableCell>
										<Badge className={STATUS_COLORS[p.status] ?? ""}>
											{t(`handover.statuses.${p.status}`)}
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
