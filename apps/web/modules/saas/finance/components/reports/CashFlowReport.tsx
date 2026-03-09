"use client";

import { useState } from "react";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	TrendingUp,
	TrendingDown,
	ArrowRightLeft,
	Wallet,
	Target,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { Currency } from "../shared/Currency";

interface CashFlowReportProps {
	organizationId: string;
	organizationSlug: string;
}

export function CashFlowReport({
	organizationId,
	organizationSlug,
}: CashFlowReportProps) {
	const t = useTranslations();

	const [periodType, setPeriodType] = useState<"weekly" | "monthly">(
		"monthly",
	);
	const [dateFrom, setDateFrom] = useState(() => {
		const d = new Date();
		d.setMonth(d.getMonth() - 6);
		return d.toISOString().split("T")[0]!;
	});
	const [dateTo, setDateTo] = useState(() => {
		return new Date().toISOString().split("T")[0]!;
	});

	const { data, isLoading } = useQuery(
		orpc.finance.reports.cashFlow.queryOptions({
			input: {
				organizationId,
				periodType,
				dateFrom: new Date(dateFrom).toISOString(),
				dateTo: new Date(dateTo).toISOString(),
			},
		}),
	);

	return (
		<div className="space-y-6">
			{/* Filters */}
			<div className="flex flex-wrap items-end gap-4">
				<div>
					<Label className="text-xs">
						{t("finance.reports.cashFlow.periodType")}
					</Label>
					<div className="flex mt-1 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
						<button
							type="button"
							onClick={() => setPeriodType("monthly")}
							className={`px-3 py-1.5 text-sm transition-colors ${
								periodType === "monthly"
									? "bg-primary text-white"
									: "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
							}`}
						>
							{t("finance.reports.cashFlow.monthly")}
						</button>
						<button
							type="button"
							onClick={() => setPeriodType("weekly")}
							className={`px-3 py-1.5 text-sm transition-colors ${
								periodType === "weekly"
									? "bg-primary text-white"
									: "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
							}`}
						>
							{t("finance.reports.cashFlow.weekly")}
						</button>
					</div>
				</div>
				<div>
					<Label className="text-xs">
						{t("finance.reports.cashFlow.from")}
					</Label>
					<Input
						type="date"
						value={dateFrom}
						onChange={(e) => setDateFrom(e.target.value)}
						className="rounded-xl h-9 w-36"
					/>
				</div>
				<div>
					<Label className="text-xs">
						{t("finance.reports.cashFlow.to")}
					</Label>
					<Input
						type="date"
						value={dateTo}
						onChange={(e) => setDateTo(e.target.value)}
						className="rounded-xl h-9 w-36"
					/>
				</div>
			</div>

			{isLoading ? (
				<DashboardSkeleton />
			) : !data || data.periods.length === 0 ? (
				<div className="flex items-center justify-center py-12 text-slate-500">
					{t("finance.reports.cashFlow.noData")}
				</div>
			) : (
				<>
					{/* Summary KPI Cards */}
					<div className="grid gap-4 sm:grid-cols-3">
						<Card className="rounded-2xl bg-green-50 dark:bg-green-950/30 border-slate-200/60 dark:border-slate-700/50">
							<CardContent className="p-5">
								<div className="flex items-center gap-3">
									<div className="shrink-0 rounded-xl bg-green-100 dark:bg-green-900/50 p-2.5">
										<TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs text-green-600 dark:text-green-400">
											{t("finance.reports.cashFlow.totalInflows")}
										</p>
										<p className="truncate text-lg font-semibold text-green-700 dark:text-green-300">
											<Currency amount={data.summary.totalInflows} />
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-2xl bg-red-50 dark:bg-red-950/30 border-slate-200/60 dark:border-slate-700/50">
							<CardContent className="p-5">
								<div className="flex items-center gap-3">
									<div className="shrink-0 rounded-xl bg-red-100 dark:bg-red-900/50 p-2.5">
										<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs text-red-600 dark:text-red-400">
											{t("finance.reports.cashFlow.totalOutflows")}
										</p>
										<p className="truncate text-lg font-semibold text-red-700 dark:text-red-300">
											<Currency amount={data.summary.totalOutflows} />
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card
							className={`rounded-2xl border-slate-200/60 dark:border-slate-700/50 ${
								data.summary.netCashFlow >= 0
									? "bg-emerald-50 dark:bg-emerald-950/30"
									: "bg-orange-50 dark:bg-orange-950/30"
							}`}
						>
							<CardContent className="p-5">
								<div className="flex items-center gap-3">
									<div
										className={`shrink-0 rounded-xl p-2.5 ${
											data.summary.netCashFlow >= 0
												? "bg-emerald-100 dark:bg-emerald-900/50"
												: "bg-orange-100 dark:bg-orange-900/50"
										}`}
									>
										<ArrowRightLeft
											className={`h-5 w-5 ${
												data.summary.netCashFlow >= 0
													? "text-emerald-600 dark:text-emerald-400"
													: "text-orange-600 dark:text-orange-400"
											}`}
										/>
									</div>
									<div className="min-w-0 flex-1">
										<p
											className={`text-xs ${
												data.summary.netCashFlow >= 0
													? "text-emerald-600 dark:text-emerald-400"
													: "text-orange-600 dark:text-orange-400"
											}`}
										>
											{t("finance.reports.cashFlow.netCashFlow")}
										</p>
										<p
											className={`truncate text-lg font-semibold ${
												data.summary.netCashFlow >= 0
													? "text-emerald-700 dark:text-emerald-300"
													: "text-orange-700 dark:text-orange-300"
											}`}
										>
											<Currency amount={data.summary.netCashFlow} />
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Period Table */}
					<Card className="rounded-2xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								<Wallet className="h-4 w-4" />
								{t("finance.reports.cashFlow.period")}
							</CardTitle>
						</CardHeader>
						<CardContent className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>
											{t("finance.reports.cashFlow.period")}
										</TableHead>
										<TableHead className="text-end text-green-600">
											{t("finance.reports.cashFlow.inflows")}
										</TableHead>
										<TableHead className="text-end text-red-600">
											{t("finance.reports.cashFlow.outflows")}
										</TableHead>
										<TableHead className="text-end">
											{t("finance.reports.cashFlow.netFlow")}
										</TableHead>
										<TableHead className="text-end">
											{t("finance.reports.cashFlow.cumulativeBalance")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{/* Opening Balance Row */}
									<TableRow className="bg-slate-50 dark:bg-slate-800/50">
										<TableCell className="font-medium">
											{t("finance.reports.cashFlow.openingBalance")}
										</TableCell>
										<TableCell />
										<TableCell />
										<TableCell />
										<TableCell className="text-end font-semibold">
											<Currency amount={data.summary.openingBalance} />
										</TableCell>
									</TableRow>

									{data.periods.map((period) => (
										<TableRow key={period.periodStart}>
											<TableCell className="font-medium whitespace-nowrap">
												{period.periodStart} → {period.periodEnd}
											</TableCell>
											<TableCell className="text-end text-green-600">
												<Currency amount={period.inflows.total} />
											</TableCell>
											<TableCell className="text-end text-red-600">
												<Currency amount={period.outflows.total} />
											</TableCell>
											<TableCell
												className={`text-end font-medium ${
													period.netFlow >= 0
														? "text-green-600"
														: "text-red-600"
												}`}
											>
												<Currency amount={period.netFlow} />
											</TableCell>
											<TableCell className="text-end font-semibold">
												<Currency amount={period.cumulativeBalance} />
											</TableCell>
										</TableRow>
									))}

									{/* Closing Balance Row */}
									<TableRow className="bg-slate-50 dark:bg-slate-800/50 font-semibold">
										<TableCell>
											{t("finance.reports.cashFlow.closingBalance")}
										</TableCell>
										<TableCell className="text-end text-green-600">
											<Currency amount={data.summary.totalInflows} />
										</TableCell>
										<TableCell className="text-end text-red-600">
											<Currency amount={data.summary.totalOutflows} />
										</TableCell>
										<TableCell
											className={`text-end ${
												data.summary.netCashFlow >= 0
													? "text-green-600"
													: "text-red-600"
											}`}
										>
											<Currency amount={data.summary.netCashFlow} />
										</TableCell>
										<TableCell className="text-end">
											<Currency amount={data.summary.closingBalance} />
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>

					{/* Projected Section */}
					<Card className="rounded-2xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								<Target className="h-4 w-4 text-blue-500" />
								{t("finance.reports.cashFlow.projected")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<Table>
								<TableBody>
									<TableRow>
										<TableCell className="font-medium">
											{t("finance.reports.cashFlow.expectedInflows")}
										</TableCell>
										<TableCell className="text-end text-green-600">
											<Currency amount={data.projected.expectedInflows} />
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="font-medium">
											{t("finance.reports.cashFlow.expectedOutflows")}
										</TableCell>
										<TableCell className="text-end text-red-600">
											<Currency amount={data.projected.expectedOutflows} />
										</TableCell>
									</TableRow>
									<TableRow className="bg-slate-50 dark:bg-slate-800/50 font-semibold">
										<TableCell>
											{t("finance.reports.cashFlow.projectedBalance")}
										</TableCell>
										<TableCell
											className={`text-end ${
												data.projected.projectedBalance >= 0
													? "text-green-600"
													: "text-red-600"
											}`}
										>
											<Currency amount={data.projected.projectedBalance} />
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
