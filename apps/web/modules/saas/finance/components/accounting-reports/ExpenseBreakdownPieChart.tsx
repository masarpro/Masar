"use client";

import { CHART_PALETTE } from "@saas/shared/lib/chart-colors";
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from "recharts";

// 10 slices: the 5 platform palette colors followed by 40%-lighter
// variants so adjacent slices never repeat the exact same color.
const EXPENSE_COLORS = [
	...CHART_PALETTE,
	...CHART_PALETTE.map(
		(color) => `color-mix(in srgb, ${color} 60%, white)`,
	),
];

interface ExpenseBreakdownPieChartProps {
	data: Array<{ name: string; value: number }>;
}

/**
 * مخطط توزيع المصروفات لقائمة الدخل — مفصول في ملف مستقل حتى تُحمَّل
 * recharts ديناميكياً (next/dynamic) بدل تضمينها في الحزمة الرئيسية.
 */
export function ExpenseBreakdownPieChart({
	data,
}: ExpenseBreakdownPieChartProps) {
	return (
		<ResponsiveContainer width="100%" height={300}>
			<PieChart>
				<Pie
					data={data}
					cx="50%"
					cy="50%"
					innerRadius={60}
					outerRadius={100}
					dataKey="value"
					nameKey="name"
					paddingAngle={2}
				>
					{data.map((_, index) => (
						<Cell
							key={`cell-${index}`}
							fill={
								EXPENSE_COLORS[
									index % EXPENSE_COLORS.length
								]
							}
						/>
					))}
				</Pie>
				<Tooltip
					formatter={(value: number) =>
						new Intl.NumberFormat("en-US", {
							style: "currency",
							currency: "SAR",
						}).format(value)
					}
				/>
				<Legend />
			</PieChart>
		</ResponsiveContainer>
	);
}
