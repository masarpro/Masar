"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { formatAccounting } from "./formatters";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { exportAccountLedgerToExcel, type LedgerLabels } from "../../lib/accounting-excel-export";

interface AccountLedgerPageProps {
	organizationId: string;
	organizationSlug: string;
	accountId: string;
}

export function AccountLedgerPage({
	organizationId,
	organizationSlug,
	accountId,
}: AccountLedgerPageProps) {
	const t = useTranslations();
	const router = useRouter();

	// Default: current month
	const now = new Date();
	const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
	const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

	const [dateFrom, setDateFrom] = useState(defaultFrom.toISOString().split("T")[0]);
	const [dateTo, setDateTo] = useState(defaultTo.toISOString().split("T")[0]);
	const [page, setPage] = useState(1);
	const pageSize = 50;

	const basePath = `/app/${organizationSlug}/finance`;

	const { data, isLoading } = useQuery(
		orpc.accounting.accounts.getLedger.queryOptions({
			input: {
				organizationId,
				id: accountId,
				dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
				dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
				page,
				pageSize,
			},
		}),
	);

	if (isLoading) return <DashboardSkeleton />;

	const account = data?.account;
	const entries = data?.entries ?? [];
	const totalPages = Math.ceil((data?.total ?? 0) / pageSize);

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
				<div className="flex items-center gap-3">
					<Button variant="outline" size="sm" className="rounded-xl" onClick={() => router.back()}>
						<ArrowLeft className="h-4 w-4 me-1" />
						{t("common.back")}
					</Button>
					{account && (
						<div>
							<h2 className="text-lg font-bold">{account.code} — {account.nameAr}</h2>
							<p className="text-sm text-slate-500">{t("finance.accounting.ledger.title")}</p>
						</div>
					)}
				</div>
				<div className="flex items-center gap-2">
					<Input
						type="date"
						value={dateFrom}
						onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
						className="rounded-xl w-40"
					/>
					<span className="text-slate-400">—</span>
					<Input
						type="date"
						value={dateTo}
						onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
						className="rounded-xl w-40"
					/>
					<Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.print()}>
						<Printer className="h-4 w-4 me-1" />
						{t("finance.accounting.ledger.print")}
					</Button>
					{data && account && (
						<Button variant="outline" size="sm" className="rounded-xl" onClick={() => exportAccountLedgerToExcel(
							`${account.code} — ${account.nameAr}`,
							data.openingBalance,
							data.entries,
							{ totalDebit: data.totalDebit, totalCredit: data.totalCredit, closingBalance: data.closingBalance },
							{
								sheetName: t("finance.accounting.excel.sheetLedger"),
								ledgerPrefix: t("finance.accounting.excel.ledgerPrefix"),
								headers: [t("finance.accounting.excel.date"), t("finance.accounting.excel.entryNo"), t("finance.accounting.excel.description"), t("finance.accounting.excel.debit"), t("finance.accounting.excel.credit"), t("finance.accounting.excel.balance")],
								openingBalance: t("finance.accounting.excel.openingBalance"),
								closingBalance: t("finance.accounting.excel.closingBalance"),
							} as LedgerLabels,
						)}>
							<Download className="h-4 w-4 me-1" />
							Excel
						</Button>
					)}
				</div>
			</div>

			{/* Print Header */}
			<div className="hidden print:block text-center mb-6">
				<h1 className="text-xl font-bold">{t("finance.accounting.ledger.title")}</h1>
				{account && <p className="text-lg">{account.code} — {account.nameAr}</p>}
				<p className="text-sm text-slate-500">{dateFrom} — {dateTo}</p>
			</div>

			{/* Table */}
			<Card className="rounded-2xl print:rounded-none print:shadow-none print:border">
				<CardContent className="p-0">
					{entries.length === 0 && !data?.openingBalance ? (
						<div className="text-center py-12 text-slate-500">
							{t("finance.accounting.ledger.noMovements")}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("finance.accounting.entryDate")}</TableHead>
									<TableHead>{t("finance.accounting.entryNo")}</TableHead>
									<TableHead>{t("finance.accounting.description")}</TableHead>
									<TableHead>{t("finance.accounting.reference")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.debit")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.credit")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.ledger.runningBalance")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{/* Opening Balance Row */}
								{page === 1 && (
									<TableRow className="bg-slate-50 dark:bg-slate-800/50 font-medium">
										<TableCell colSpan={4}>{t("finance.accounting.ledger.openingBalance")}</TableCell>
										<TableCell className="text-end">—</TableCell>
										<TableCell className="text-end">—</TableCell>
										<TableCell className="text-end font-bold">
											{formatAccounting(data?.openingBalance ?? 0)}
										</TableCell>
									</TableRow>
								)}

								{entries.map((entry) => (
									<TableRow key={`${entry.entryId}-${entry.debit}-${entry.credit}`}>
										<TableCell className="text-sm text-slate-500">
											{new Date(entry.date).toLocaleDateString("en-SA")}
										</TableCell>
										<TableCell>
											<Link
												href={`${basePath}/journal-entries/${entry.entryId}`}
												className="font-mono text-sm text-primary hover:underline"
											>
												{entry.entryNo}
											</Link>
										</TableCell>
										<TableCell className="text-sm max-w-[250px] truncate">
											{entry.description}
										</TableCell>
										<TableCell className="text-sm text-slate-500">
											{entry.referenceNo || entry.referenceType || "—"}
										</TableCell>
										<TableCell className="text-end">
											{entry.debit > 0 ? formatAccounting(entry.debit) : "—"}
										</TableCell>
										<TableCell className="text-end">
											{entry.credit > 0 ? formatAccounting(entry.credit) : "—"}
										</TableCell>
										<TableCell className="text-end font-medium">
											{formatAccounting(entry.runningBalance)}
										</TableCell>
									</TableRow>
								))}

								{/* Closing Balance Row */}
								<TableRow className="bg-slate-50 dark:bg-slate-800/50 font-medium border-t-2">
									<TableCell colSpan={4}>{t("finance.accounting.ledger.closingBalance")}</TableCell>
									<TableCell className="text-end font-bold">
										{formatAccounting(data?.totalDebit ?? 0)}
									</TableCell>
									<TableCell className="text-end font-bold">
										{formatAccounting(data?.totalCredit ?? 0)}
									</TableCell>
									<TableCell className="text-end font-bold text-primary">
										{formatAccounting(data?.closingBalance ?? 0)}
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 print:hidden">
					<Button
						variant="outline"
						size="sm"
						disabled={page <= 1}
						onClick={() => setPage((p) => p - 1)}
						className="rounded-xl"
					>
						{t("common.previous")}
					</Button>
					<span className="text-sm text-slate-500">
						{page} / {totalPages}
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={page >= totalPages}
						onClick={() => setPage((p) => p + 1)}
						className="rounded-xl"
					>
						{t("common.next")}
					</Button>
				</div>
			)}
		</div>
	);
}
