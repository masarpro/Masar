"use client";

import { Card } from "@ui/components/card";
import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#94a3b8", "#3b82f6"];

export function PlanDistributionChart({
	data,
}: {
	data: Array<{ plan: string; count: number }>;
}) {
	const t = useTranslations();

	return (
		<Card className="p-6">
			<h3 className="font-semibold text-lg mb-4">
				{t("admin.dashboard.planDistribution")}
			</h3>
			<ResponsiveContainer width="100%" height={300}>
				<PieChart>
					<Pie
						data={data}
						cx="50%"
						cy="50%"
						innerRadius={60}
						outerRadius={100}
						dataKey="count"
						nameKey="plan"
						label={({ plan, count }) => `${plan}: ${count}`}
					>
						{data.map((_, index) => (
							<Cell
								key={`cell-${index}`}
								fill={COLORS[index % COLORS.length]}
							/>
						))}
					</Pie>
					<Tooltip />
				</PieChart>
			</ResponsiveContainer>
		</Card>
	);
}
