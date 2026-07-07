"use client";

import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from "recharts";

interface AgingPieChartProps {
	data: Array<{ name: string; value: number; color: string }>;
}

/**
 * مخطط توزيع أعمار الذمم — مفصول في ملف مستقل حتى تُحمَّل recharts
 * ديناميكياً (next/dynamic) بدل تضمينها في الحزمة الرئيسية للتقرير.
 */
export function AgingPieChart({ data }: AgingPieChartProps) {
	return (
		<ResponsiveContainer width="100%" height={280}>
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
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={entry.color}
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
