"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell } from "recharts";
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
	available: "#10b981",
	inUse: "#3b82f6",
	maintenance: "#f97316",
	retired: "#64748b",
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
		<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-5">
			{/* Header */}
			<div className="flex items-center gap-3 mb-5">
				<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
					<Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
				</div>
				<h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
					{t("company.dashboard.assetAnalytics")}
				</h3>
			</div>

			{isEmpty ? (
				<div className="flex items-center justify-center h-[180px] text-sm text-slate-400 dark:text-slate-500">
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
									className="fill-slate-900 dark:fill-slate-100 text-2xl font-bold"
									style={{ fontSize: "24px", fontWeight: 700 }}
								>
									{assets.total}
								</text>
								<text
									x="50%"
									y="60%"
									textAnchor="middle"
									dominantBaseline="middle"
									className="fill-slate-500 dark:fill-slate-400"
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
									<span className="text-slate-600 dark:text-slate-400">
										{item.label}
									</span>
								</div>
								<span className="font-semibold text-slate-900 dark:text-slate-100">
									{item.value}
								</span>
							</div>
						))}
					</div>

					{/* Footer */}
					<div className="border-t border-slate-200/60 dark:border-slate-700/40 pt-3 space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-slate-500 dark:text-slate-400">
								{t("company.dashboard.monthlyRentLabel")}
							</span>
							<span
								className="font-semibold text-slate-700 dark:text-slate-300"
								dir="ltr"
							>
								{formatCurrency(assets.totalMonthlyRent)}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm mt-2">
							<span className="font-bold text-slate-900 dark:text-slate-100">
								{t("company.dashboard.totalAssetValue")}
							</span>
							<span
								className="font-bold text-slate-900 dark:text-slate-100"
								dir="ltr"
							>
								{formatCurrency(assets.totalValue)}
							</span>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
