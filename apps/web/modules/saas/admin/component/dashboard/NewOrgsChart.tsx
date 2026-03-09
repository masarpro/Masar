"use client";

import { Card } from "@ui/components/card";
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

export function NewOrgsChart({
	data,
}: {
	data: Array<{ month: string; count: number }>;
}) {
	const t = useTranslations();

	return (
		<Card className="p-6">
			<h3 className="font-semibold text-lg mb-4">
				{t("admin.dashboard.newOrgs")}
			</h3>
			<div role="img" aria-label={`${t("admin.dashboard.newOrgs")} - ${data.length} شهر`}>
			<ResponsiveContainer width="100%" height={300}>
				<BarChart data={data}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="month" />
					<YAxis />
					<Tooltip />
					<Bar
						dataKey="count"
						fill="hsl(var(--primary))"
						radius={[4, 4, 0, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
			</div>
		</Card>
	);
}
