"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

/**
 * The Recharts donut of ProjectsDonutCard, split into its own chunk (same
 * pattern as FinancePanelChart) so recharts stays out of the initial bundle.
 * Botly Audiences donut (Figma 69:3173): thick ring, rounded segment ends.
 */
export default function ProjectsDonutChart({
	data,
}: {
	data: Array<{ name: string; value: number; color: string }>;
}) {
	return (
		<ResponsiveContainer width="100%" height="100%">
			<PieChart>
				<Pie
					data={data}
					dataKey="value"
					nameKey="name"
					innerRadius="42%"
					outerRadius="100%"
					paddingAngle={2}
					cornerRadius={6}
					stroke="none"
				>
					{data.map((entry) => (
						<Cell key={entry.name} fill={entry.color} />
					))}
				</Pie>
			</PieChart>
		</ResponsiveContainer>
	);
}
