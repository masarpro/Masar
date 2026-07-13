"use client";

import { formatSAR } from "@shared/lib/formatters";
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
import { ProfitabilityReportSkeleton } from "@saas/shared/components/skeletons";

interface ProfitabilityReportProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
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
		return <ProfitabilityReportSkeleton />;
	}

	if (!data) {
		return (
			<div className="flex items-center justify-center py-12 text-muted-foreground">
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
				<Card className="rounded-2xl">
					<CardContent className="p-5">
						<div className="flex items-center gap-3">
							<div className="shrink-0 rounded-xl bg-success/15 p-2.5">
								<TrendingUp className="h-5 w-5 text-success" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-muted-foreground">
									{t("finance.profitability.revenue")}
								</p>
								<p className="truncate text-lg font-semibold text-card-foreground">
									{formatSAR(revenue.totalContractValue)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Total Costs */}
				<Card className="rounded-2xl">
					<CardContent className="p-5">
						<div className="flex items-center gap-3">
							<div className="shrink-0 rounded-xl bg-destructive/15 p-2.5">
								<TrendingDown className="h-5 w-5 text-destructive" />
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-muted-foreground">
									{t("finance.profitability.totalCosts")}
								</p>
								<p className="truncate text-lg font-semibold text-card-foreground">
									{formatSAR(costs.totalCosts)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Net Profit */}
				<Card className="rounded-2xl">
					<CardContent className="p-5">
						<div className="flex items-center gap-3">
							<div
								className={`shrink-0 rounded-xl p-2.5 ${
									isProfitable
										? "bg-success/15"
										: "bg-chart-1/15"
								}`}
							>
								<DollarSign
									className={`h-5 w-5 ${
										isProfitable
											? "text-success"
											: "text-chart-1"
									}`}
								/>
							</div>
							<div className="min-w-0 flex-1">
								<p className="text-xs text-muted-foreground">
									{t("finance.profitability.grossProfit")}
								</p>
								<p
									className={`truncate text-lg font-semibold ${
										isProfitable
											? "text-success"
											: "text-chart-1"
									}`}
								>
									{formatSAR(profitability.grossProfit)}
								</p>
								<p
									className={`text-xs ${
										isProfitable
											? "text-success"
											: "text-chart-1"
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
						<ArrowUpRight className="h-4 w-4 text-success" />
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
									{formatSAR(revenue.baseContractValue)}
								</TableCell>
							</TableRow>
							{revenue.changeOrders.length > 0 && (
								<TableRow>
									<TableCell className="font-medium">
										{t("finance.profitability.changeOrders")} ({revenue.changeOrders.length})
									</TableCell>
									<TableCell className="text-end">
										{formatSAR(revenue.changeOrdersTotal)}
									</TableCell>
								</TableRow>
							)}
							<TableRow className="bg-muted/50 font-semibold">
								<TableCell>
									{t("finance.profitability.totalContractValue")}
								</TableCell>
								<TableCell className="text-end">
									{formatSAR(revenue.totalContractValue)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.invoicedTotal")} ({revenue.invoiceCount})
								</TableCell>
								<TableCell className="text-end">
									{formatSAR(revenue.invoicedTotal)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.collectedTotal")} ({revenue.paymentCount})
								</TableCell>
								<TableCell className="text-end">
									{formatSAR(revenue.collectedTotal)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.outstandingAmount")}
								</TableCell>
								<TableCell className="text-end text-chart-1">
									{formatSAR(revenue.outstandingAmount)}
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>

					{/* Collection Progress Bar */}
					<div className="mt-4 space-y-2">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								{t("finance.profitability.collectionRate")}
							</span>
							<span className="font-medium">
								{formatPercent(revenue.collectionRate)}
							</span>
						</div>
						<div className="h-2.5 w-full overflow-hidden rounded-[4px] bg-muted">
							<div
								className="h-full rounded-[4px] bg-success transition-all"
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
						<ArrowDownRight className="h-4 w-4 text-destructive" />
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
									{formatSAR(costs.directExpenses.total)}
								</TableCell>
							</TableRow>

							{/* Category Breakdown */}
							{costs.directExpenses.byCategory.map((cat: any) => (
								<TableRow key={cat.category} className="text-muted-foreground">
									<TableCell className="ps-8 text-sm">
										{t(`finance.category.${cat.category}` as any) ?? cat.category} ({cat.count})
									</TableCell>
									<TableCell className="text-end text-sm">
										{formatSAR(cat.total)}
									</TableCell>
								</TableRow>
							))}

							{/* Subcontract Costs */}
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.subcontractCosts")} ({costs.subcontracts.contracts.length})
								</TableCell>
								<TableCell className="text-end">
									{formatSAR(costs.subcontracts.totalPaid)}
								</TableCell>
							</TableRow>

							{/* Subcontract Details */}
							{costs.subcontracts.contracts.map((sc: any) => (
								<TableRow key={sc.id} className="text-muted-foreground">
									<TableCell className="ps-8 text-sm">
										{sc.name} ({sc.contractNo})
									</TableCell>
									<TableCell className="text-end text-sm">
										{formatSAR(sc.value)}
									</TableCell>
								</TableRow>
							))}

							{/* Labor Costs */}
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.laborCosts")}
								</TableCell>
								<TableCell className="text-end">
									{formatSAR(costs.laborCosts)}
								</TableCell>
							</TableRow>

							{/* Distributed Expenses */}
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.distributedExpenses")}
								</TableCell>
								<TableCell className="text-end">
									{formatSAR(costs.distributedExpenses)}
								</TableCell>
							</TableRow>

							{/* Total */}
							<TableRow className="bg-muted/50 font-semibold">
								<TableCell>
									{t("finance.profitability.totalCosts")}
								</TableCell>
								<TableCell className="text-end">
									{formatSAR(costs.totalCosts)}
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
						<DollarSign className="h-4 w-4 text-success" />
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
										isProfitable ? "text-success" : "text-destructive"
									}`}
								>
									{formatSAR(profitability.grossProfit)}
								</TableCell>
							</TableRow>
							<TableRow>
								<TableCell className="font-medium">
									{t("finance.profitability.profitMargin")}
								</TableCell>
								<TableCell
									className={`text-end font-semibold ${
										isProfitable ? "text-success" : "text-destructive"
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
											? "text-success"
											: "text-destructive"
									}`}
								>
									{formatSAR(profitability.realizedProfit)}
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
										{formatSAR(retention.retentionAmount)}
									</TableCell>
								</TableRow>
								{retention.retentionCap > 0 && (
									<TableRow>
										<TableCell className="font-medium">
											{t("finance.profitability.retentionCap")}
										</TableCell>
										<TableCell className="text-end">
											{formatSAR(retention.retentionCap)}
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
