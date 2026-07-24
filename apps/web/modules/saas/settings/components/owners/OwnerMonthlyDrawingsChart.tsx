"use client";

import { CHART_SEMANTIC } from "@saas/shared/lib/chart-colors";
import { formatSARPrecise } from "@shared/lib/formatters";
import { useTranslations } from "next-intl";
import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface OwnerMonthlyDrawingsChartProps {
	data: { name: string; amount: number }[];
}

/**
 * Chart leaf split into its own chunk so recharts stays out of the
 * settings/owners route's initial JS (loaded via next/dynamic).
 */
export function OwnerMonthlyDrawingsChart({
	data,
}: OwnerMonthlyDrawingsChartProps) {
	const t = useTranslations();

	return (
		<ResponsiveContainer width="100%" height="100%">
			<BarChart data={data}>
				<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
				<XAxis
					dataKey="name"
					tick={{
						fontSize: 11,
					}}
					className="text-muted-foreground"
				/>
				<YAxis
					tick={{
						fontSize: 11,
					}}
					className="text-muted-foreground"
				/>
				<Tooltip
					formatter={(value: number) => [
						formatSARPrecise(value),
						t("dashboard.totalDrawingsYTD"),
					]}
				/>
				<Bar
					dataKey="amount"
					fill={CHART_SEMANTIC.negative}
					radius={[4, 4, 0, 0]}
				/>
			</BarChart>
		</ResponsiveContainer>
	);
}
