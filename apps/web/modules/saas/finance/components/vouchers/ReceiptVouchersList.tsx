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
import { Search, Plus, FileCheck, Eye } from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { Currency } from "../shared/Currency";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface ReceiptVouchersListProps {
	organizationId: string;
	organizationSlug: string;
}

const STATUS_COLORS: Record<string, string> = {
	DRAFT: "bg-gray-100 text-gray-700",
	ISSUED: "bg-green-100 text-green-700",
	CANCELLED: "bg-red-100 text-red-700",
};

const PAYMENT_METHOD_KEYS: Record<string, string> = {
	CASH: "finance.payments.methods.CASH",
	BANK_TRANSFER: "finance.payments.methods.BANK_TRANSFER",
	CHEQUE: "finance.payments.methods.CHEQUE",
	CREDIT_CARD: "finance.payments.methods.CREDIT_CARD",
	OTHER: "finance.payments.methods.OTHER",
};

export function ReceiptVouchersList({
	organizationId,
	organizationSlug,
}: ReceiptVouchersListProps) {
	const t = useTranslations();
	const router = useRouter();

	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");

	const basePath = `/app/${organizationSlug}/finance/receipt-vouchers`;

	// Fetch vouchers
	const { data: rawData, isLoading } = useQuery(
		orpc.finance.receipts.list.queryOptions({
			input: {
				organizationId,
				search: searchQuery || undefined,
				status: statusFilter !== "all" ? (statusFilter as any) : undefined,
			},
		}),
	);
	const data = rawData as any;

	// Fetch summary
	const { data: rawSummaryData } = useQuery(
		orpc.finance.receipts.getSummary.queryOptions({
			input: { organizationId },
		}),
	);
	const summaryData = rawSummaryData as any;

	const vouchers = data?.items ?? [];
	const total = data?.total ?? 0;

	if (isLoading) {
		return <ListTableSkeleton rows={8} cols={6} />;
	}

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">{t("finance.receiptVouchers.title")}</h1>
				</div>
				<Button onClick={() => router.push(`${basePath}/new`)}>
					<Plus className="me-2 h-4 w-4" />
					{t("finance.receiptVouchers.new")}
				</Button>
			</div>

			{/* Summary Cards */}
			{summaryData && (
				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					<Card>
						<CardContent className="pt-4">
							<div className="text-sm text-muted-foreground">
								{t("finance.receiptVouchers.summary.totalIssued")}
							</div>
							<div className="mt-1 text-2xl font-bold">
								<Currency amount={summaryData.totalAmount} />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-4">
							<div className="text-sm text-muted-foreground">
								{t("finance.receiptVouchers.summary.count")}
							</div>
							<div className="mt-1 text-2xl font-bold">{summaryData.count}</div>
						</CardContent>
					</Card>
				</div>
			)}

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
				<Select value={statusFilter} onValueChange={setStatusFilter}>
					<SelectTrigger className="w-[160px]">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{t("common.all")}</SelectItem>
						<SelectItem value="DRAFT">{t("finance.receiptVouchers.statuses.DRAFT")}</SelectItem>
						<SelectItem value="ISSUED">{t("finance.receiptVouchers.statuses.ISSUED")}</SelectItem>
						<SelectItem value="CANCELLED">{t("finance.receiptVouchers.statuses.CANCELLED")}</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Table */}
			{vouchers.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-12">
						<FileCheck className="mb-4 h-12 w-12 text-muted-foreground" />
						<p className="text-lg font-medium">{t("finance.receiptVouchers.noVouchers")}</p>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("finance.receiptVouchers.noVouchersDescription")}
						</p>
						<Button
							className="mt-4"
							onClick={() => router.push(`${basePath}/new`)}
						>
							<Plus className="me-2 h-4 w-4" />
							{t("finance.receiptVouchers.new")}
						</Button>
					</CardContent>
				</Card>
			) : (
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>{t("finance.receiptVouchers.voucherNo")}</TableHead>
								<TableHead>{t("finance.receiptVouchers.date")}</TableHead>
								<TableHead>{t("finance.receiptVouchers.receivedFrom")}</TableHead>
								<TableHead>{t("finance.receiptVouchers.amount")}</TableHead>
								<TableHead>{t("finance.receiptVouchers.paymentMethod")}</TableHead>
								<TableHead>{t("finance.receiptVouchers.status")}</TableHead>
								<TableHead className="w-10" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{vouchers.map((voucher: any) => (
								<TableRow
									key={voucher.id}
									className="cursor-pointer"
									onClick={() => router.push(`${basePath}/${voucher.id}`)}
								>
									<TableCell className="font-mono font-medium">
										{voucher.voucherNo}
									</TableCell>
									<TableCell>{formatDate(voucher.date)}</TableCell>
									<TableCell>{voucher.receivedFrom}</TableCell>
									<TableCell>
										<Currency amount={Number(voucher.amount)} />
									</TableCell>
									<TableCell>
										{t(PAYMENT_METHOD_KEYS[voucher.paymentMethod] ?? "finance.payments.methods.OTHER")}
									</TableCell>
									<TableCell>
										<Badge className={STATUS_COLORS[voucher.status] ?? ""}>
											{t(`finance.receiptVouchers.statuses.${voucher.status}`)}
										</Badge>
									</TableCell>
									<TableCell>
										<Button variant="ghost" size="icon">
											<Eye className="h-4 w-4" />
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Card>
			)}

			{/* Total */}
			<div className="text-sm text-muted-foreground">
				{t("common.totalResults", { count: total })}
			</div>
		</div>
	);
}
