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
					<div className="flex mt-1 rounded-xl border border-border overflow-hidden">
						<button
							type="button"
							onClick={() => setPeriodType("monthly")}
							className={`px-3 py-1.5 text-sm transition-colors ${
								periodType === "monthly"
									? "bg-primary text-primary-foreground"
									: "bg-card text-muted-foreground hover:bg-accent"
							}`}
						>
							{t("finance.reports.cashFlow.monthly")}
						</button>
						<button
							type="button"
							onClick={() => setPeriodType("weekly")}
							className={`px-3 py-1.5 text-sm transition-colors ${
								periodType === "weekly"
									? "bg-primary text-primary-foreground"
									: "bg-card text-muted-foreground hover:bg-accent"
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
						onChange={(e: any) => setDateFrom(e.target.value)}
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
						onChange={(e: any) => setDateTo(e.target.value)}
						className="rounded-xl h-9 w-36"
					/>
				</div>
			</div>

			{isLoading ? (
				<DashboardSkeleton />
			) : !data || data.periods.length === 0 ? (
				<div className="flex items-center justify-center py-12 text-muted-foreground">
					{t("finance.reports.cashFlow.noData")}
				</div>
			) : (
				<>
					{/* Summary KPI Cards */}
					<div className="grid gap-4 sm:grid-cols-3">
						<Card className="rounded-2xl">
							<CardContent className="p-5">
								<div className="flex items-center gap-3">
									<div className="shrink-0 rounded-xl bg-success/15 p-2.5">
										<TrendingUp className="h-5 w-5 text-success" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs text-success">
											{t("finance.reports.cashFlow.totalInflows")}
										</p>
										<p className="truncate text-lg font-semibold text-success">
											<Currency amount={data.summary.totalInflows} />
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-2xl">
							<CardContent className="p-5">
								<div className="flex items-center gap-3">
									<div className="shrink-0 rounded-xl bg-destructive/15 p-2.5">
										<TrendingDown className="h-5 w-5 text-destructive" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-xs text-destructive">
											{t("finance.reports.cashFlow.totalOutflows")}
										</p>
										<p className="truncate text-lg font-semibold text-destructive">
											<Currency amount={data.summary.totalOutflows} />
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-2xl">
							<CardContent className="p-5">
								<div className="flex items-center gap-3">
									<div
										className={`shrink-0 rounded-xl p-2.5 ${
											data.summary.netCashFlow >= 0
												? "bg-success/15"
												: "bg-chart-1/15"
										}`}
									>
										<ArrowRightLeft
											className={`h-5 w-5 ${
												data.summary.netCashFlow >= 0
													? "text-success"
													: "text-chart-1"
											}`}
										/>
									</div>
									<div className="min-w-0 flex-1">
										<p
											className={`text-xs ${
												data.summary.netCashFlow >= 0
													? "text-success"
													: "text-chart-1"
											}`}
										>
											{t("finance.reports.cashFlow.netCashFlow")}
										</p>
										<p
											className={`truncate text-lg font-semibold ${
												data.summary.netCashFlow >= 0
													? "text-success"
													: "text-chart-1"
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
										<TableHead className="text-end text-success">
											{t("finance.reports.cashFlow.inflows")}
										</TableHead>
										<TableHead className="text-end text-destructive">
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
									<TableRow className="bg-muted/50">
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

									{data.periods.map((period: any) => (
										<TableRow key={period.periodStart}>
											<TableCell className="font-medium whitespace-nowrap">
												{period.periodStart} → {period.periodEnd}
											</TableCell>
											<TableCell className="text-end text-success">
												<Currency amount={period.inflows.total} />
											</TableCell>
											<TableCell className="text-end text-destructive">
												<Currency amount={period.outflows.total} />
											</TableCell>
											<TableCell
												className={`text-end font-medium ${
													period.netFlow >= 0
														? "text-success"
														: "text-destructive"
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
									<TableRow className="bg-muted/50 font-semibold">
										<TableCell>
											{t("finance.reports.cashFlow.closingBalance")}
										</TableCell>
										<TableCell className="text-end text-success">
											<Currency amount={data.summary.totalInflows} />
										</TableCell>
										<TableCell className="text-end text-destructive">
											<Currency amount={data.summary.totalOutflows} />
										</TableCell>
										<TableCell
											className={`text-end ${
												data.summary.netCashFlow >= 0
													? "text-success"
													: "text-destructive"
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
								<Target className="h-4 w-4 text-chart-4" />
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
										<TableCell className="text-end text-success">
											<Currency amount={data.projected.expectedInflows} />
										</TableCell>
									</TableRow>
									<TableRow>
										<TableCell className="font-medium">
											{t("finance.reports.cashFlow.expectedOutflows")}
										</TableCell>
										<TableCell className="text-end text-destructive">
											<Currency amount={data.projected.expectedOutflows} />
										</TableCell>
									</TableRow>
									<TableRow className="bg-muted/50 font-semibold">
										<TableCell>
											{t("finance.reports.cashFlow.projectedBalance")}
										</TableCell>
										<TableCell
											className={`text-end ${
												data.projected.projectedBalance >= 0
													? "text-success"
													: "text-destructive"
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
