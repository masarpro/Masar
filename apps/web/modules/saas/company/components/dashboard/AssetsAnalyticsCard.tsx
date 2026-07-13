"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell } from "recharts";
import {
	CHART_PALETTE,
	CHART_SEMANTIC,
} from "@saas/shared/lib/chart-colors";
import { ChartContainer } from "@ui/components/chart";
import { Package } from "lucide-react";

interface AssetsAnalyticsCardProps {
	assets: {
		total: number;
		available: number;
		inUse: number;
		maintenance: number;
		retired: number;
		totalValue: number;
		totalMonthlyRent: number;
	};
	formatCurrency: (amount: number) => string;
}

const COLORS = {
	available: CHART_PALETTE[0], // sky
	inUse: CHART_SEMANTIC.primary,
	maintenance: CHART_PALETTE[2], // amber
	retired: CHART_SEMANTIC.neutral,
};

export function AssetsAnalyticsCard({
	assets,
	formatCurrency,
}: AssetsAnalyticsCardProps) {
	const t = useTranslations();

	const chartData = [
		{ name: "available", value: assets.available, color: COLORS.available },
		{ name: "inUse", value: assets.inUse, color: COLORS.inUse },
		{
			name: "maintenance",
			value: assets.maintenance,
			color: COLORS.maintenance,
		},
		{ name: "retired", value: assets.retired, color: COLORS.retired },
	].filter((d) => d.value > 0);

	const legendItems = [
		{
			label: t("company.dashboard.available"),
			value: assets.available,
			color: COLORS.available,
		},
		{
			label: t("company.dashboard.inUse"),
			value: assets.inUse,
			color: COLORS.inUse,
		},
		{
			label: t("company.dashboard.maintenance"),
			value: assets.maintenance,
			color: COLORS.maintenance,
		},
		{
			label: t("company.dashboard.retired"),
			value: assets.retired,
			color: COLORS.retired,
		},
	];

	const isEmpty = assets.total === 0;

	return (
		<div className="bg-card border-2 rounded-2xl p-5">
			{/* Header */}
			<div className="flex items-center gap-3 mb-5">
				<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
					<Package className="h-5 w-5" />
				</div>
				<h3 className="text-sm font-semibold text-card-foreground">
					{t("company.dashboard.assetAnalytics")}
				</h3>
			</div>

			{isEmpty ? (
				<div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
					{t("company.dashboard.noData")}
				</div>
			) : (
				<>
					{/* Chart */}
					<div className="flex justify-center mb-4">
						<ChartContainer
							config={{}}
							className="h-[160px] w-[160px] !aspect-square"
						>
							<PieChart>
								<Pie
									data={chartData}
									cx="50%"
									cy="50%"
									innerRadius={40}
									outerRadius={70}
									paddingAngle={2}
									dataKey="value"
									strokeWidth={0}
								>
									{chartData.map((entry) => (
										<Cell key={entry.name} fill={entry.color} />
									))}
								</Pie>
								<text
									x="50%"
									y="46%"
									textAnchor="middle"
									dominantBaseline="middle"
									className="fill-foreground text-2xl font-bold"
									style={{ fontSize: "24px", fontWeight: 700 }}
								>
									{assets.total}
								</text>
								<text
									x="50%"
									y="60%"
									textAnchor="middle"
									dominantBaseline="middle"
									className="fill-muted-foreground"
									style={{ fontSize: "11px" }}
								>
									{t("company.dashboard.totalAssets")}
								</text>
							</PieChart>
						</ChartContainer>
					</div>

					{/* Legend */}
					<div className="space-y-2 mb-4">
						{legendItems.map((item) => (
							<div
								key={item.label}
								className="flex items-center justify-between text-sm"
							>
								<div className="flex items-center gap-2">
									<div
										className="w-2.5 h-2.5 rounded-full shrink-0"
										style={{ backgroundColor: item.color }}
									/>
									<span className="text-muted-foreground">
										{item.label}
									</span>
								</div>
								<span className="font-semibold text-card-foreground">
									{item.value}
								</span>
							</div>
						))}
					</div>

					{/* Footer */}
					<div className="border-t-2 pt-3 space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">
								{t("company.dashboard.monthlyRentLabel")}
							</span>
							<span
								className="font-semibold text-card-foreground"
								dir="ltr"
							>
								{formatCurrency(Number(assets.totalMonthlyRent))}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm mt-2">
							<span className="font-bold text-card-foreground">
								{t("company.dashboard.totalAssetValue")}
							</span>
							<span
								className="font-bold text-card-foreground"
								dir="ltr"
							>
								{formatCurrency(Number(assets.totalValue))}
							</span>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
