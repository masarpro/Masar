"use client";

import { Card } from "@ui/components/card";
import { DollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";

interface Props {
	totalMaterialCost: number;
	totalLaborCost: number;
	totalGrossCost: number;
	totalSellAmount: number;
	totalProfitAmount: number;
	totalProfitPercent: number;
}

const fmt = (n: number) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(n);

export function MiniPnLCard({
	totalMaterialCost,
	totalLaborCost,
	totalGrossCost,
	totalSellAmount,
	totalProfitAmount,
	totalProfitPercent,
}: Props) {
	const isProfit = totalProfitAmount >= 0;
	const matPct = totalGrossCost > 0 ? (totalMaterialCost / totalGrossCost) * 100 : 0;
	const labPct = totalGrossCost > 0 ? (totalLaborCost / totalGrossCost) * 100 : 0;

	return (
		<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
			<Card className="p-4">
				<div className="flex items-start gap-3">
					<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
						<Wallet className="h-5 w-5" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-xs text-muted-foreground">إجمالي التكلفة</p>
						<p className="text-lg font-bold tabular-nums">
							{fmt(totalGrossCost)} ر.س
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							مادة {matPct.toFixed(0)}% · عمالة {labPct.toFixed(0)}%
						</p>
					</div>
				</div>
			</Card>

			<Card className="p-4">
				<div className="flex items-start gap-3">
					<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
						<DollarSign className="h-5 w-5" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-xs text-muted-foreground">إجمالي البيع</p>
						<p className="text-lg font-bold tabular-nums">
							{fmt(totalSellAmount)} ر.س
						</p>
					</div>
				</div>
			</Card>

			<Card
				className={`p-4 ${
					isProfit
						? "border-emerald-200 dark:border-emerald-900"
						: "border-red-200 dark:border-red-900"
				}`}
			>
				<div className="flex items-start gap-3">
					<div
						className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${
							isProfit
								? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
								: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
						}`}
					>
						{isProfit ? (
							<TrendingUp className="h-5 w-5" />
						) : (
							<TrendingDown className="h-5 w-5" />
						)}
					</div>
					<div className="min-w-0 flex-1">
						<p className="text-xs text-muted-foreground">
							{isProfit ? "صافي الربح" : "خسارة"}
						</p>
						<p
							className={`text-lg font-bold tabular-nums ${
								isProfit
									? "text-emerald-700 dark:text-emerald-300"
									: "text-red-700 dark:text-red-300"
							}`}
						>
							{fmt(totalProfitAmount)} ر.س
						</p>
						<p className="mt-1 text-xs text-muted-foreground tabular-nums">
							{totalProfitPercent.toFixed(1)}% من البيع
						</p>
					</div>
				</div>
			</Card>
		</div>
	);
}
