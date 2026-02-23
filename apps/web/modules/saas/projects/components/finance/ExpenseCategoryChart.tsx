"use client";

import { ChartContainer, ChartTooltip } from "@ui/components/chart";
import type { ChartConfig } from "@ui/components/chart";
import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell } from "recharts";

interface CategoryData {
	category: string;
	total: number;
	count: number;
}

interface ExpenseCategoryChartProps {
	data: CategoryData[];
	selectedCategory: string | undefined;
	onCategoryClick: (category: string | undefined) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
	MATERIALS: "#3b82f6",
	LABOR: "#f59e0b",
	EQUIPMENT: "#a855f7",
	SUBCONTRACTOR: "#14b8a6",
	TRANSPORT: "#f97316",
	MISC: "#64748b",
};

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("ar-SA", {
		style: "currency",
		currency: "SAR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function ExpenseCategoryChart({
	data,
	selectedCategory,
	onCategoryClick,
}: ExpenseCategoryChartProps) {
	const t = useTranslations();

	const totalAmount = data.reduce((sum, d) => sum + d.total, 0);

	if (data.length === 0) {
		return (
			<div className="flex h-48 items-center justify-center rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/30 dark:bg-slate-900/70">
				<p className="text-sm text-slate-500 dark:text-slate-400">
					{t("finance.categoryChart.noData")}
				</p>
			</div>
		);
	}

	const chartConfig: ChartConfig = {};
	for (const item of data) {
		chartConfig[item.category] = {
			label: t(`finance.category.${item.category}`),
			color: CATEGORY_COLORS[item.category] || "#64748b",
		};
	}

	const handleClick = (category: string) => {
		onCategoryClick(selectedCategory === category ? undefined : category);
	};

	return (
		<div className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-slate-700/30 dark:bg-slate-900/70">
			<h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
				{t("finance.categoryChart.title")}
			</h3>

			<ChartContainer config={chartConfig} className="mx-auto aspect-square h-48">
				<PieChart>
					<ChartTooltip
						content={({ active, payload }) => {
							if (!active || !payload?.length) return null;
							const item = payload[0];
							const percentage = totalAmount > 0
								? ((Number(item.value) / totalAmount) * 100).toFixed(1)
								: "0";
							return (
								<div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
									<p className="text-xs font-medium text-slate-600 dark:text-slate-300">
										{t(`finance.category.${item.name}`)}
									</p>
									<p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
										{formatCurrency(Number(item.value))}
									</p>
									<p className="text-xs text-slate-400">{percentage}%</p>
								</div>
							);
						}}
					/>
					<Pie
						data={data}
						dataKey="total"
						nameKey="category"
						cx="50%"
						cy="50%"
						innerRadius={45}
						outerRadius={80}
						paddingAngle={2}
						onClick={(_, index) => handleClick(data[index].category)}
						style={{ cursor: "pointer" }}
					>
						{data.map((entry) => (
							<Cell
								key={entry.category}
								fill={CATEGORY_COLORS[entry.category] || "#64748b"}
								opacity={
									selectedCategory && selectedCategory !== entry.category
										? 0.3
										: 1
								}
								stroke="transparent"
							/>
						))}
					</Pie>
					<text
						x="50%"
						y="50%"
						textAnchor="middle"
						dominantBaseline="middle"
						className="fill-slate-700 text-sm font-semibold dark:fill-slate-300"
					>
						{formatCurrency(totalAmount)}
					</text>
				</PieChart>
			</ChartContainer>

			{/* Legend */}
			<div className="mt-3 space-y-1.5">
				{data
					.sort((a, b) => b.total - a.total)
					.slice(0, 5)
					.map((item) => {
						const percentage = totalAmount > 0
							? ((item.total / totalAmount) * 100).toFixed(0)
							: "0";
						return (
							<button
								key={item.category}
								type="button"
								onClick={() => handleClick(item.category)}
								className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
									selectedCategory === item.category
										? "bg-slate-100 dark:bg-slate-800"
										: ""
								}`}
							>
								<div className="flex items-center gap-2">
									<div
										className="h-2.5 w-2.5 rounded-full"
										style={{
											backgroundColor: CATEGORY_COLORS[item.category] || "#64748b",
										}}
									/>
									<span className="text-slate-600 dark:text-slate-400">
										{t(`finance.category.${item.category}`)}
									</span>
								</div>
								<span className="font-medium text-slate-700 dark:text-slate-300">
									{percentage}%
								</span>
							</button>
						);
					})}
			</div>
		</div>
	);
}
