"use client";

import { Card } from "@ui/components/card";
import { useTranslations } from "next-intl";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

export function MrrChart({
	data,
}: {
	data: Array<{ month: string; amount: number }>;
}) {
	const t = useTranslations();

	return (
		<Card className="p-6">
			<h3 className="font-semibold text-lg mb-4">
				{t("admin.dashboard.mrrTrend")}
			</h3>
			<div role="img" aria-label={`${t("admin.dashboard.mrrTrend")} - ${data.length} نقطة بيانات`}>
			<ResponsiveContainer width="100%" height={300}>
				<LineChart data={data}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="month" />
					<YAxis />
					<Tooltip
						formatter={(value: number) =>
							`${value.toLocaleString("en-US")} SAR`
						}
					/>
					<Line
						type="monotone"
						dataKey="amount"
						stroke="hsl(var(--primary))"
						strokeWidth={2}
						dot={{ fill: "hsl(var(--primary))" }}
					/>
				</LineChart>
			</ResponsiveContainer>
			</div>
		</Card>
	);
}
