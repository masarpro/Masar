"use client";

import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from "recharts";

const EXPENSE_COLORS = [
	"#3b82f6",
	"#ef4444",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#8b5cf6",
	"#ec4899",
	"#06b6d4",
	"#84cc16",
	"#f43f5e",
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
