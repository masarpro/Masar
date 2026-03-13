"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
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
	DollarSign,
	ArrowUpRight,
	ArrowDownRight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";

interface ProfitabilityReportProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

function formatPercent(value: number): string {
	return `${value.toFixed(1)}%`;
}

export function ProfitabilityReport({
	organizationId,
	organizationSlug,
	projectId,
}: ProfitabilityReportProps) {
	const t = useTranslations();

	const { data, isLoading } = useQuery(
		orpc.finance.reports.profitability.queryOptions({
			input: { organizationId, projectId },
		}),
	);

	if (isLoading) {
		return <DashboardSkeleton />;
	}

	if (!data) {
		return (
			<div className="flex items-center justify-center py-12 text-slate-500">
				{t("finance.profitability.noData")}
			</div>
		);
	}

	const { revenue, costs, profitability, retention } = data;
	const isProfitable = profitability.grossProfit >= 0;

	return (
		<div className="space-y-6">
			{/* KPI Cards */}
			<div className="grid gap-4 sm:grid-cols-3">
				{/* Total Revenue */}
				<Card className="rounded-2xl border-slate-200/60 shadow-lg shadow-black/5 bg-green-50 dark:bg-green-950/30 dark:border-slate-700/50">
					<CardContent className="p-5">
						<div className="flex items-center gap-3">
							<div className="shrink-0 rounded-xl bg-green-100 dark:bg-green-900/50 p-2.5">
								<TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-green-600 dark:text-green-400">
									{t("finance.profitability.revenue")}
								</p>
								<p className="truncate text-lg font-semibold text-green-700 dark:text-green-300">
									{formatCurrency(revenue.totalContractValue)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Total Costs */}
				<Card className="rounded-2xl border-slate-200/60 shadow-lg shadow-black/5 bg-red-50 dark:bg-red-950/30 dark:border-slate-700/50">
					<CardContent className="p-5">
						<div className="flex items-center gap-3">
							<div className="shrink-0 rounded-xl bg-red-100 dark:bg-red-900/50 p-2.5">
								<TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-red-600 dark:text-red-400">
									{t("finance.profitability.totalCosts")}
								</p>
								<p className="truncate text-lg font-semibold text-red-700 dark:text-red-300">
									{formatCurrency(costs.totalCosts)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Net Profit */}
				<Card
					className={`rounded-2xl border-slate-200/60 shadow-lg shadow-black/5 dark:border-slate-700/50 ${
						isProfitable
							? "bg-emerald-50 dark:bg-emerald-950/30"
							: "bg-orange-50 dark:bg-orange-950/30"
					}`}
				>
					<CardContent className="p-5">
						<div className="flex items-center gap-3">
							<div
								className={`shrink-0 rounded-xl p-2.5 ${
									isProfitable
										? "bg-emerald-100 dark:bg-emerald-900/50"
										: "bg-orange-100 dark:bg-orange-900/50"
								}`}
							>
								<DollarSign
									className={`h-5 w-5 ${
										isProfitable
											? "text-emerald-600 dark:text-emerald-400"
											: "text-orange-600 dark:text-orange-400"
									}`}
								/>
							</div>
							<div className="min-w-0 flex-1">
								<p
									className={`text-xs ${
										isProfitable
											? "text-emerald-600 dark:text-emerald-400"
											: "text-orange-600 dark:text-orange-400"
									}`}
								>
									{t("finance.profitability.grossProfit")}
								</p>
								<p
									className={`truncate text-lg font-semibold ${
										isProfitable
											? "text-emerald-700 dark:text-emerald-300"
											: "text-orange-700 dark:text-orange-300"
									}`}
								>
									{formatCurrency(profitability.grossProfit)}
								</p>
								<p
									className={`text-xs ${
										isProfitable
											? "text-emerald-600 dark:text-emerald-400"
											: "text-orange-600 dark:text-orange-400"
									}`}
								>
									{formatPercent(profitability.profitMargin)}{" "}
									{t("finance.profitability.profitMargin")}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Revenue Details */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<ArrowUpRight className="h-4 w-4 text-green-500" />
						{t("finance.profitability.revenue")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableBody>
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.baseContractValue")}
								</TableCell>
								<TableCell className="text-end">
									{formatCurrency(revenue.baseContractValue)}
								</TableCell>
							</TableRow>
							{revenue.changeOrders.length > 0 && (
								<TableRow>
									<TableCell className="font-medium">
										{t("finance.profitability.changeOrders")} ({revenue.changeOrders.length})
									</TableCell>
									<TableCell className="text-end">
										{formatCurrency(revenue.changeOrdersTotal)}
									</TableCell>
								</TableRow>
							)}
							<TableRow className="bg-slate-50 dark:bg-slate-800/50 font-semibold">
								<TableCell>
									{t("finance.profitability.totalContractValue")}
								</TableCell>
								<TableCell className="text-end">
									{formatCurrency(revenue.totalContractValue)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.invoicedTotal")} ({revenue.invoiceCount})
								</TableCell>
								<TableCell className="text-end">
									{formatCurrency(revenue.invoicedTotal)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.collectedTotal")} ({revenue.paymentCount})
								</TableCell>
								<TableCell className="text-end">
									{formatCurrency(revenue.collectedTotal)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.outstandingAmount")}
								</TableCell>
								<TableCell className="text-end text-amber-600">
									{formatCurrency(revenue.outstandingAmount)}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>

					{/* Collection Progress Bar */}
					<div className="mt-4 space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="text-slate-600 dark:text-slate-400">
								{t("finance.profitability.collectionRate")}
							</span>
							<span className="font-medium">
								{formatPercent(revenue.collectionRate)}
							</span>
						</div>
						<div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
							<div
								className="h-full rounded-full bg-green-500 transition-all"
								style={{
									width: `${Math.min(revenue.collectionRate, 100)}%`,
								}}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Costs Details */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<ArrowDownRight className="h-4 w-4 text-red-500" />
						{t("finance.profitability.costs")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableBody>
							{/* Direct Expenses */}
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.directExpenses")} ({costs.directExpenses.count})
								</TableCell>
								<TableCell className="text-end">
									{formatCurrency(costs.directExpenses.total)}
								</TableCell>
							</TableRow>

							{/* Category Breakdown */}
							{costs.directExpenses.byCategory.map((cat) => (
								<TableRow key={cat.category} className="text-slate-500 dark:text-slate-400">
									<TableCell className="ps-8 text-sm">
										{t(`finance.category.${cat.category}` as any) ?? cat.category} ({cat.count})
									</TableCell>
									<TableCell className="text-end text-sm">
										{formatCurrency(cat.total)}
									</TableCell>
								</TableRow>
							))}

							{/* Subcontract Costs */}
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.subcontractCosts")} ({costs.subcontracts.contracts.length})
								</TableCell>
								<TableCell className="text-end">
									{formatCurrency(costs.subcontracts.totalPaid)}
								</TableCell>
							</TableRow>

							{/* Subcontract Details */}
							{costs.subcontracts.contracts.map((sc) => (
								<TableRow key={sc.id} className="text-slate-500 dark:text-slate-400">
									<TableCell className="ps-8 text-sm">
										{sc.name} ({sc.contractNo})
									</TableCell>
									<TableCell className="text-end text-sm">
										{formatCurrency(sc.value)}
									</TableCell>
								</TableRow>
							))}

							{/* Labor Costs */}
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.laborCosts")}
								</TableCell>
								<TableCell className="text-end">
									{formatCurrency(costs.laborCosts)}
								</TableCell>
							</TableRow>

							{/* Distributed Expenses */}
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.distributedExpenses")}
								</TableCell>
								<TableCell className="text-end">
									{formatCurrency(costs.distributedExpenses)}
								</TableCell>
							</TableRow>

							{/* Total */}
							<TableRow className="bg-slate-50 dark:bg-slate-800/50 font-semibold">
								<TableCell>
									{t("finance.profitability.totalCosts")}
								</TableCell>
								<TableCell className="text-end">
									{formatCurrency(costs.totalCosts)}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Profitability Summary */}
			<Card className="rounded-2xl">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<DollarSign className="h-4 w-4 text-emerald-500" />
						{t("finance.profitability.profit")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableBody>
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.grossProfit")}
								</TableCell>
								<TableCell
									className={`text-end font-semibold ${
										isProfitable ? "text-green-600" : "text-red-600"
									}`}
								>
									{formatCurrency(profitability.grossProfit)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.profitMargin")}
								</TableCell>
								<TableCell
									className={`text-end font-semibold ${
										isProfitable ? "text-green-600" : "text-red-600"
									}`}
								>
									{formatPercent(profitability.profitMargin)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.realizedProfit")}
								</TableCell>
								<TableCell
									className={`text-end ${
										profitability.realizedProfit >= 0
											? "text-green-600"
											: "text-red-600"
									}`}
								>
									{formatCurrency(profitability.realizedProfit)}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Retention */}
			{retention.retentionPercent > 0 && (
				<Card className="rounded-2xl">
					<CardHeader>
						<CardTitle className="text-base">
							{t("finance.profitability.retention")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<Table>
							<TableBody>
								<TableRow>
									<TableCell className="font-medium">
										{t("finance.profitability.retentionPercent")}
									</TableCell>
									<TableCell className="text-end">
										{formatPercent(retention.retentionPercent)}
									</TableCell>
								</TableRow>
								<TableRow>
									<TableCell className="font-medium">
										{t("finance.profitability.retentionAmount")}
									</TableCell>
									<TableCell className="text-end">
										{formatCurrency(retention.retentionAmount)}
									</TableCell>
								</TableRow>
								{retention.retentionCap > 0 && (
									<TableRow>
										<TableCell className="font-medium">
											{t("finance.profitability.retentionCap")}
										</TableCell>
										<TableCell className="text-end">
											{formatCurrency(retention.retentionCap)}
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
