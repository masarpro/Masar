"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Button } from "@ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { CheckCircle, XCircle, Printer, Download } from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { formatAccounting, ACCOUNT_TYPE_COLORS } from "./formatters";
import { ReportPrintHeader } from "../shared/ReportPrintHeader";
import { exportTrialBalanceToExcel, type TrialBalanceLabels } from "../../lib/accounting-excel-export";

interface TrialBalanceReportProps {
	organizationId: string;
	organizationSlug: string;
}

export function TrialBalanceReport({ organizationId }: TrialBalanceReportProps) {
	const t = useTranslations();
	const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().split("T")[0]);
	const [dateFrom, setDateFrom] = useState("");
	const [includeZero, setIncludeZero] = useState(false);

	const { data, isLoading } = useQuery(
		orpc.accounting.reports.trialBalance.queryOptions({
			input: {
				organizationId,
				asOfDate: new Date(asOfDate).toISOString(),
				dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
				includeZeroBalance: includeZero,
			},
		}),
	);

	if (isLoading) return <DashboardSkeleton />;

	return (
		<div className="space-y-4">
			<ReportPrintHeader reportTitle={t("finance.accounting.trialBalance.title")} dateRange={asOfDate} />
			{/* Filters */}
			<div className="flex flex-wrap items-end gap-3 print:hidden">
				<div>
					<Label className="text-xs">{t("finance.accounting.trialBalance.asOfDate")}</Label>
					<Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="rounded-xl h-9 w-40" />
				</div>
				<div>
					<Label className="text-xs">{t("finance.accounting.trialBalance.periodFrom")}</Label>
					<Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-xl h-9 w-40" />
				</div>
				<label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
					<input type="checkbox" checked={includeZero} onChange={(e) => setIncludeZero(e.target.checked)} className="rounded" />
					{t("finance.accounting.trialBalance.includeZero")}
				</label>
				<div className="flex gap-2 ms-auto">
					<Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.print()}>
						<Printer className="h-4 w-4 me-1" />
						{t("common.print")}
					</Button>
					{data && (
						<Button variant="outline" size="sm" className="rounded-xl" onClick={() => exportTrialBalanceToExcel(data, {
									sheetName: t("finance.accounting.excel.sheetTrialBalance"),
									headers: [t("finance.accounting.excel.accountCode"), t("finance.accounting.excel.accountName"), t("finance.accounting.excel.periodDebit"), t("finance.accounting.excel.periodCredit"), t("finance.accounting.excel.debitBalance"), t("finance.accounting.excel.creditBalance")],
									total: t("finance.accounting.excel.total"),
								} as TrialBalanceLabels)}>
							<Download className="h-4 w-4 me-1" />
							Excel
						</Button>
					)}
				</div>
			</div>

			{data && (
				<>
					{/* Balance Status */}
					<Card className={`rounded-2xl ${data.isBalanced ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"}`}>
						<CardContent className="p-4 flex items-center gap-3">
							{data.isBalanced ? (
								<>
									<CheckCircle className="h-5 w-5 text-green-600" />
									<span className="font-medium text-green-700 dark:text-green-300">{t("finance.accounting.trialBalance.balanced")}</span>
								</>
							) : (
								<>
									<XCircle className="h-5 w-5 text-red-600" />
									<span className="font-medium text-red-700 dark:text-red-300">
										{t("finance.accounting.trialBalance.notBalanced")}: {formatAccounting(data.difference)}
									</span>
								</>
							)}
							<span className="ms-auto text-sm text-slate-500">
								{t("finance.accounting.trialBalance.accountCount")}: {data.accountCount}
							</span>
						</CardContent>
					</Card>

					{/* Table */}
					<Card className="rounded-2xl">
						<CardContent className="p-0 overflow-x-auto">
							{data.rows.length === 0 ? (
								<div className="text-center py-12 text-slate-500">{t("finance.accounting.trialBalance.noEntries")}</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="min-w-[80px]">{t("finance.accounting.accountCode")}</TableHead>
											<TableHead>{t("finance.accounting.accountName")}</TableHead>
											<TableHead className="text-end">{t("finance.accounting.trialBalance.periodDebit")}</TableHead>
											<TableHead className="text-end">{t("finance.accounting.trialBalance.periodCredit")}</TableHead>
											<TableHead className="text-end">{t("finance.accounting.trialBalance.debitBalance")}</TableHead>
											<TableHead className="text-end">{t("finance.accounting.trialBalance.creditBalance")}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data.rows.map((row) => {
											const colors = ACCOUNT_TYPE_COLORS[row.accountType];
											const isLevel1 = row.level === 1;
											return (
												<TableRow key={row.accountId} className={isLevel1 ? `${colors?.bg} font-semibold` : ""}>
													<TableCell className="font-mono text-sm" style={{ paddingInlineStart: `${(row.level - 1) * 1}rem` }}>
														{row.accountCode}
													</TableCell>
													<TableCell className={isLevel1 ? "font-semibold" : ""}>{row.accountNameAr}</TableCell>
													<TableCell className="text-end">{formatAccounting(row.periodDebit)}</TableCell>
													<TableCell className="text-end">{formatAccounting(row.periodCredit)}</TableCell>
													<TableCell className="text-end">{formatAccounting(row.debitBalance)}</TableCell>
													<TableCell className="text-end">{formatAccounting(row.creditBalance)}</TableCell>
												</TableRow>
											);
										})}
										{/* Totals */}
										<TableRow className="border-t-2 border-double border-slate-400 dark:border-slate-500 font-bold bg-slate-100 dark:bg-slate-800">
											<TableCell colSpan={2}>{t("finance.accounting.aging.total")}</TableCell>
											<TableCell className="text-end">{formatAccounting(data.totals.totalPeriodDebit)}</TableCell>
											<TableCell className="text-end">{formatAccounting(data.totals.totalPeriodCredit)}</TableCell>
											<TableCell className="text-end">{formatAccounting(data.totals.totalDebitBalance)}</TableCell>
											<TableCell className="text-end">{formatAccounting(data.totals.totalCreditBalance)}</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
