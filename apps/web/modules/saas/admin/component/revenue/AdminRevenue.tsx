"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { DollarSignIcon, TrendingUpIcon } from "lucide-react";
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
import { StatsCard } from "../dashboard/StatsCard";

export function AdminRevenue() {
	const t = useTranslations();

	const { data: summary, isLoading } = useQuery(
		orpc.superAdmin.revenue.getSummary.queryOptions({ input: undefined }),
	);

	const { data: byPeriod } = useQuery(
		orpc.superAdmin.revenue.getByPeriod.queryOptions({
			input: { months: 12 },
		}),
	);

	const { data: byPlan } = useQuery(
		orpc.superAdmin.revenue.getByPlan.queryOptions({ input: undefined }),
	);

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-28 rounded-lg" />
					))}
				</div>
				<Skeleton className="h-80 rounded-lg" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h2 className="font-semibold text-2xl">
				{t("admin.revenue.title")}
			</h2>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<StatsCard
					title={t("admin.revenue.totalRevenue")}
					value={`${(summary?.totalRevenue ?? 0).toLocaleString()} SAR`}
					icon={DollarSignIcon}
				/>
				<StatsCard
					title={t("admin.revenue.mrr")}
					value={`${(summary?.mrr ?? 0).toLocaleString()} SAR`}
					icon={TrendingUpIcon}
				/>
				<StatsCard
					title={t("admin.revenue.arr")}
					value={`${(summary?.arr ?? 0).toLocaleString()} SAR`}
					icon={TrendingUpIcon}
					description={`${summary?.activeSubscriptions ?? 0} ${t("admin.revenue.activeSubscriptions")}`}
				/>
			</div>

			<Card className="p-6">
				<h3 className="font-semibold text-lg mb-4">
					{t("admin.revenue.byPeriod")}
				</h3>
				<ResponsiveContainer width="100%" height={300}>
					<BarChart data={byPeriod ?? []}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="month" />
						<YAxis />
						<Tooltip
							formatter={(value: number) =>
								`${value.toLocaleString()} SAR`
							}
						/>
						<Bar
							dataKey="amount"
							fill="hsl(var(--primary))"
							radius={[4, 4, 0, 0]}
						/>
					</BarChart>
				</ResponsiveContainer>
			</Card>

			{byPlan && byPlan.length > 0 && (
				<Card className="p-6">
					<h3 className="font-semibold text-lg mb-4">
						{t("admin.revenue.byPlan")}
					</h3>
					<div className="space-y-3">
						{byPlan.map((item) => (
							<div
								key={item.plan}
								className="flex items-center justify-between rounded-lg border p-3"
							>
								<div>
									<p className="font-medium">{item.plan}</p>
									<p className="text-muted-foreground text-sm">
										{item.count}{" "}
										{t("admin.revenue.organizations")}
									</p>
								</div>
								<p className="font-bold">
									{item.revenue.toLocaleString()} SAR
								</p>
							</div>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}
