"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Button } from "@ui/components/button";
import { CheckCircle, XCircle, Printer } from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { formatAccounting } from "./formatters";
import { ReportPrintHeader } from "../shared/ReportPrintHeader";

interface Props {
	organizationId: string;
	organizationSlug: string;
}

export function BalanceSheetReport({ organizationId }: Props) {
	const t = useTranslations();
	const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().split("T")[0]);

	const { data, isLoading } = useQuery(
		orpc.accounting.reports.balanceSheet.queryOptions({
			input: { organizationId, asOfDate: new Date(asOfDate).toISOString() },
		}),
	);

	if (isLoading) return <DashboardSkeleton />;

	return (
		<div className="space-y-4">
			<ReportPrintHeader reportTitle={t("finance.accounting.balanceSheet.title")} dateRange={asOfDate} />
			{/* Date Filter */}
			<div className="flex items-end gap-3 print:hidden">
				<div>
					<Label className="text-xs">{t("finance.accounting.trialBalance.asOfDate")}</Label>
					<Input type="date" value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} className="rounded-xl h-9 w-40" />
				</div>
				<Button variant="outline" size="sm" className="rounded-xl ms-auto" onClick={() => window.print()}>
					<Printer className="h-4 w-4 me-1" />
					{t("common.print")}
				</Button>
			</div>

			{data && (
				<>
					{/* Balance Check */}
					<Card className={`rounded-2xl ${data.isBalanced ? "bg-green-50 dark:bg-green-950/20 border-green-200" : "bg-red-50 dark:bg-red-950/20 border-red-200"}`}>
						<CardContent className="p-4 flex items-center gap-3">
							{data.isBalanced ? (
								<>
									<CheckCircle className="h-5 w-5 text-green-600" />
									<span className="font-medium text-green-700 dark:text-green-300">{t("finance.accounting.balanceSheet.balanced")}</span>
								</>
							) : (
								<>
									<XCircle className="h-5 w-5 text-red-600" />
									<span className="font-medium text-red-700 dark:text-red-300">{t("finance.accounting.balanceSheet.notBalanced")}</span>
								</>
							)}
						</CardContent>
					</Card>

					{/* T-Account Layout */}
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Assets (Right side in RTL) */}
						<Card className="rounded-2xl">
							<CardHeader className="bg-blue-50 dark:bg-blue-950/20 rounded-t-2xl">
								<CardTitle className="text-blue-700 dark:text-blue-300">{t("finance.accounting.balanceSheet.assets")}</CardTitle>
							</CardHeader>
							<CardContent className="p-4 space-y-4">
								{/* Current Assets */}
								<BSSection
									title={t("finance.accounting.balanceSheet.currentAssets")}
									accounts={data.assets.currentAssets.accounts}
									total={data.assets.currentAssets.total}
								/>
								{/* Fixed Assets */}
								<BSSection
									title={t("finance.accounting.balanceSheet.fixedAssets")}
									accounts={data.assets.fixedAssets.accounts}
									total={data.assets.fixedAssets.total}
								/>
								{/* Total Assets */}
								<div className="flex justify-between py-2 border-t-2 border-double border-blue-300 dark:border-blue-700 font-bold text-blue-700 dark:text-blue-300">
									<span>{t("finance.accounting.balanceSheet.totalAssets")}</span>
									<span>{formatAccounting(data.assets.totalAssets)}</span>
								</div>
							</CardContent>
						</Card>

						{/* Liabilities + Equity (Left side in RTL) */}
						<Card className="rounded-2xl">
							<CardHeader className="bg-red-50 dark:bg-red-950/20 rounded-t-2xl">
								<CardTitle className="text-red-700 dark:text-red-300">{t("finance.accounting.balanceSheet.liabilitiesAndEquity")}</CardTitle>
							</CardHeader>
							<CardContent className="p-4 space-y-4">
								{/* Current Liabilities */}
								<BSSection
									title={t("finance.accounting.balanceSheet.currentLiabilities")}
									accounts={data.liabilities.currentLiabilities.accounts}
									total={data.liabilities.currentLiabilities.total}
								/>
								{/* Equity */}
								<div>
									<h4 className="font-semibold text-sm text-purple-700 dark:text-purple-300 mb-2 py-1 px-2 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
										{t("finance.accounting.balanceSheet.equity")}
									</h4>
									{data.equity.accounts.map((acc) => (
										<div key={acc.accountId} className="flex justify-between py-1 text-sm">
											<span className="text-slate-600 dark:text-slate-400">{acc.nameAr}</span>
											<span>{formatAccounting(acc.balance)}</span>
										</div>
									))}
									{/* Current Year P&L */}
									<div className="flex justify-between py-1 text-sm">
										<span className="text-blue-600 dark:text-blue-400 italic">{t("finance.accounting.balanceSheet.currentYearPL")}</span>
										<span className={`font-medium ${data.equity.currentYearPL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
											{formatAccounting(data.equity.currentYearPL)}
										</span>
									</div>
									<div className="flex justify-between py-1 border-t font-semibold text-sm">
										<span>{t("finance.accounting.balanceSheet.totalEquity")}</span>
										<span>{formatAccounting(data.equity.totalEquity)}</span>
									</div>
								</div>
								{/* Total L+E */}
								<div className="flex justify-between py-2 border-t-2 border-double border-red-300 dark:border-red-700 font-bold text-red-700 dark:text-red-300">
									<span>{t("finance.accounting.balanceSheet.totalLiabilities")} + {t("finance.accounting.balanceSheet.equity")}</span>
									<span>{formatAccounting(data.liabilities.totalLiabilities + data.equity.totalEquity)}</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</>
			)}
		</div>
	);
}

function BSSection({ title, accounts, total }: { title: string; accounts: { accountId: string; nameAr: string; balance: number }[]; total: number }) {
	if (accounts.length === 0 && total === 0) return null;
	return (
		<div>
			<h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-1">{title}</h4>
			{accounts.map((acc) => (
				<div key={acc.accountId} className="flex justify-between py-1 text-sm">
					<span className="text-slate-600 dark:text-slate-400">{acc.nameAr}</span>
					<span>{formatAccounting(acc.balance)}</span>
				</div>
			))}
			<div className="flex justify-between py-1 border-t border-slate-200 dark:border-slate-700 font-medium text-sm">
				<span>{title}</span>
				<span>{formatAccounting(total)}</span>
			</div>
		</div>
	);
}
