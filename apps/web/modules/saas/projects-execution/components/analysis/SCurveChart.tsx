"use client";

import { useTranslations } from "next-intl";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	Legend,
} from "recharts";

interface SCurveDataPoint {
	date: string;
	planned: number;
	actual: number;
}

interface SCurveChartProps {
	data: SCurveDataPoint[];
}

export function SCurveChart({ data }: SCurveChartProps) {
	const t = useTranslations();

	if (data.length === 0) {
		return (
			<div className="flex items-center justify-center h-[300px] text-muted-foreground">
				{t("execution.analysis.sCurve.noData")}
			</div>
		);
	}

	return (
		<div className="h-[400px] w-full">
			<ResponsiveContainer width="100%" height="100%">
				<AreaChart data={data}>
					<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
					<XAxis
						dataKey="date"
						tick={{ fontSize: 11 }}
						tickLine={false}
					/>
					<YAxis
						tick={{ fontSize: 11 }}
						tickLine={false}
						domain={[0, 100]}
						label={{
							value: t("execution.analysis.sCurve.progress"),
							angle: -90,
							position: "insideLeft",
							style: { fontSize: 11 },
						}}
					/>
					<Tooltip />
					<Legend />
					<Area
						type="monotone"
						dataKey="planned"
						name={t("execution.analysis.sCurve.planned")}
						stroke="#94a3b8"
						fill="#94a3b8"
						fillOpacity={0.1}
						strokeWidth={2}
						strokeDasharray="8 4"
					/>
					<Area
						type="monotone"
						dataKey="actual"
						name={t("execution.analysis.sCurve.actual")}
						stroke="#14b8a6"
						fill="#14b8a6"
						fillOpacity={0.15}
						strokeWidth={2}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
}
