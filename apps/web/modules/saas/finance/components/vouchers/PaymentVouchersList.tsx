"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { StatusChip } from "@ui/components/status-chip";
import { Card, CardContent } from "@ui/components/card";
import {
	Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ui/components/table";
import {
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@ui/components/select";
import { Search, Plus, FileMinus, Eye, Clock } from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { Currency } from "../shared/Currency";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";
import { MobileFilterSheet } from "@saas/shared/components/mobile/MobileFilterSheet";

interface PaymentVouchersListProps {
	organizationId: string;
	organizationSlug: string;
}

export function PaymentVouchersList({
	organizationId,
	organizationSlug,
}: PaymentVouchersListProps) {
	const t = useTranslations();
	const router = useRouter();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const basePath = `/app/${organizationSlug}/finance/payment-vouchers`;

	const { data: rawData, isLoading } = useQuery(
		orpc.finance.disbursements.list.queryOptions({
			input: {
				organizationId,
				search: searchQuery || undefined,
				status: statusFilter !== "all" ? (statusFilter as any) : undefined,
			},
		}),
	);
	const data = rawData as any;

	const { data: rawSummaryData } = useQuery(
		orpc.finance.disbursements.getSummary.queryOptions({
			input: { organizationId },
		}),
	);
	const summaryData = rawSummaryData as any;

	const vouchers = data?.items ?? [];
	const total = data?.total ?? 0;

	if (isLoading) return <ListTableSkeleton rows={8} cols={7} />;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-bold">{t("finance.paymentVouchers.title")}</h1>
				<Button onClick={() => router.push(`${basePath}/new`)}>
					<Plus className="me-2 h-4 w-4" />
					{t("finance.paymentVouchers.new")}
				</Button>
			</div>

			{/* Summary Cards */}
			{summaryData && (
				<div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
					<Card>
						<CardContent className="pt-3 sm:pt-4">
							<div className="text-xs sm:text-sm text-muted-foreground">
								{t("finance.paymentVouchers.summary.totalIssued")}
							</div>
							<div className="mt-1 text-base sm:text-2xl font-bold">
								<Currency amount={summaryData.totalAmount} />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-3 sm:pt-4">
							<div className="text-xs sm:text-sm text-muted-foreground">
								{t("finance.paymentVouchers.summary.count")}
							</div>
							<div className="mt-1 text-base sm:text-2xl font-bold">{summaryData.count}</div>
						</CardContent>
					</Card>
					{summaryData.pendingApproval.count > 0 && (
						<Card className="border-amber-200 bg-amber-50">
							<CardContent className="pt-3 sm:pt-4">
								<div className="flex items-center gap-2 text-xs sm:text-sm text-amber-700">
									<Clock className="h-4 w-4" />
									{t("finance.paymentVouchers.summary.pendingApproval")}
								</div>
								<div className="mt-1 text-base sm:text-2xl font-bold text-amber-700">
									{summaryData.pendingApproval.count}
								</div>
								<div className="text-xs text-amber-600">
									<Currency amount={summaryData.pendingApproval.total} />
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{/* الجوال: بحث + ورقة فلاتر في صف واحد */}
			<div className="flex items-center gap-2 sm:hidden">
				<div className="relative min-w-0 flex-1">
					<Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("common.search")}
						value={searchQuery}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
						className="ps-9"
					/>
				</div>
				<MobileFilterSheet activeCount={statusFilter !== "all" ? 1 : 0}>
					<Select value={statusFilter} onValueChange={setStatusFilter}>
						<SelectTrigger className="w-full rounded-xl">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("common.all")}</SelectItem>
							<SelectItem value="DRAFT">{t("finance.paymentVouchers.statuses.DRAFT")}</SelectItem>
							<SelectItem value="PENDING_APPROVAL">{t("finance.paymentVouchers.statuses.PENDING_APPROVAL")}</SelectItem>
							<SelectItem value="ISSUED">{t("finance.paymentVouchers.statuses.ISSUED")}</SelectItem>
							<SelectItem value="CANCELLED">{t("finance.paymentVouchers.statuses.CANCELLED")}</SelectItem>
						</SelectContent>
					</Select>
				</MobileFilterSheet>
			</div>

			{/* Filters (الديسكتوب كما هو) */}
			<div className="hidden flex-col gap-3 sm:flex sm:flex-row sm:items-center">
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
					<SelectTrigger className="w-[180px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("common.all")}</SelectItem>
						<SelectItem value="DRAFT">{t("finance.paymentVouchers.statuses.DRAFT")}</SelectItem>
						<SelectItem value="PENDING_APPROVAL">{t("finance.paymentVouchers.statuses.PENDING_APPROVAL")}</SelectItem>
						<SelectItem value="ISSUED">{t("finance.paymentVouchers.statuses.ISSUED")}</SelectItem>
						<SelectItem value="CANCELLED">{t("finance.paymentVouchers.statuses.CANCELLED")}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			{vouchers.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<FileMinus className="mb-4 h-12 w-12 text-muted-foreground" />
						<p className="text-lg font-medium">{t("finance.paymentVouchers.noVouchers")}</p>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("finance.paymentVouchers.noVouchersDescription")}
						</p>
						<Button className="mt-4" onClick={() => router.push(`${basePath}/new`)}>
							<Plus className="me-2 h-4 w-4" />
							{t("finance.paymentVouchers.new")}
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("finance.paymentVouchers.voucherNo")}</TableHead>
								<TableHead>{t("finance.paymentVouchers.date")}</TableHead>
								<TableHead>{t("finance.paymentVouchers.payeeName")}</TableHead>
								<TableHead>{t("finance.paymentVouchers.payeeType")}</TableHead>
								<TableHead>{t("finance.paymentVouchers.amount")}</TableHead>
								<TableHead>{t("finance.paymentVouchers.status")}</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{vouchers.map((v: any) => (
								<TableRow
									key={v.id}
									className="cursor-pointer"
									onClick={() => router.push(`${basePath}/${v.id}`)}
								>
									<TableCell className="font-mono font-medium">{v.voucherNo}</TableCell>
									<TableCell>{formatDate(v.date)}</TableCell>
									<TableCell>{v.payeeName}</TableCell>
									<TableCell>{t(`finance.paymentVouchers.payeeTypes.${v.payeeType}`)}</TableCell>
									<TableCell><Currency amount={Number(v.amount)} /></TableCell>
									<TableCell>
										<StatusChip status={v.status}>
											{t(`finance.paymentVouchers.statuses.${v.status}`)}
										</StatusChip>
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
