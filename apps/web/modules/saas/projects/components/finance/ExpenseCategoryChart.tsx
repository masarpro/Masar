"use client";

import {
	CHART_PALETTE,
	CHART_SEMANTIC,
} from "@saas/shared/lib/chart-colors";
import { formatSAR } from "@shared/lib/formatters";
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
	MATERIALS: CHART_PALETTE[0], // sky
	LABOR: CHART_PALETTE[2], // amber
	EQUIPMENT: CHART_PALETTE[1], // violet
	SUBCONTRACTOR: CHART_PALETTE[4], // cyan
	TRANSPORT: CHART_PALETTE[3], // red
	MISC: CHART_SEMANTIC.neutral,
};

export function ExpenseCategoryChart({
	data,
	selectedCategory,
	onCategoryClick,
}: ExpenseCategoryChartProps) {
	const t = useTranslations();

	const totalAmount = data.reduce((sum, d) => sum + d.total, 0);

	if (data.length === 0) {
		return (
			<div className="flex h-48 items-center justify-center rounded-2xl border-2 bg-card">
				<p className="text-sm text-muted-foreground">
					{t("finance.categoryChart.noData")}
				</p>
			</div>
		);
	}

	const chartConfig: ChartConfig = {};
	for (const item of data) {
		chartConfig[item.category] = {
			label: t(`finance.category.${item.category}`),
			color: CATEGORY_COLORS[item.category] || CHART_SEMANTIC.neutral,
		};
	}

	const handleClick = (category: string) => {
		onCategoryClick(selectedCategory === category ? undefined : category);
	};

	return (
		<div className="rounded-2xl border-2 bg-card p-4">
			<h3 className="mb-3 text-sm font-semibold text-card-foreground">
				{t("finance.categoryChart.title")}
			</h3>

			<div role="img" aria-label={`${t("finance.categoryChart.title")} - ${data.map(d => `${t(`finance.category.${d.category}`)}: ${totalAmount > 0 ? ((d.total / totalAmount) * 100).toFixed(0) : 0}%`).join(', ')}`}>
			<ChartContainer config={chartConfig} className="mx-auto aspect-square h-48">
				<PieChart>
					<ChartTooltip
						content={({ active, payload }: any) => {
							if (!active || !payload?.length) return null;
							const item = payload[0];
							const percentage = totalAmount > 0
								? ((Number(item.value) / totalAmount) * 100).toFixed(1)
								: "0";
							return (
								<div className="rounded-lg border bg-popover px-3 py-2 shadow-[0px_8px_32px_12px_rgba(0,0,0,0.06)]">
									<p className="text-xs font-medium text-muted-foreground">
										{t(`finance.category.${item.name}`)}
									</p>
									<p className="text-sm font-semibold text-popover-foreground">
										{formatSAR(Number(item.value))}
									</p>
									<p className="text-xs text-muted-foreground">{percentage}%</p>
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
								fill={CATEGORY_COLORS[entry.category] || CHART_SEMANTIC.neutral}
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
						className="fill-foreground text-sm font-semibold"
					>
						{formatSAR(totalAmount)}
					</text>
				</PieChart>
			</ChartContainer>
			</div>

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
								className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs transition-colors hover:bg-accent hover:text-accent-foreground ${
									selectedCategory === item.category
										? "bg-accent"
										: ""
								}`}
							>
								<div className="flex items-center gap-2">
									<div
										className="h-2.5 w-2.5 rounded-full"
										style={{
											backgroundColor: CATEGORY_COLORS[item.category] || CHART_SEMANTIC.neutral,
										}}
									/>
									<span className="text-muted-foreground">
										{t(`finance.category.${item.category}`)}
									</span>
								</div>
								<span className="font-medium text-card-foreground">
									{percentage}%
								</span>
							</button>
						);
					})}
			</div>
		</div>
	);
}
