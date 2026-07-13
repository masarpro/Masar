"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@ui/components/chart";
import { Skeleton } from "@ui/components/skeleton";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { formatCurrency } from "../../lib/utils";

const WEEKS = 8;

interface CashFlowCardProps {
	organizationId: string;
}

export function CashFlowCard({ organizationId }: CashFlowCardProps) {
	const t = useTranslations();

	// Stable ISO range (start of today − 8 weeks → end of today) so the
	// query key doesn't change on every render
	const { dateFrom, dateTo } = useMemo(() => {
		const to = new Date();
		to.setHours(23, 59, 59, 999);
		const from = new Date();
		from.setHours(0, 0, 0, 0);
		from.setDate(from.getDate() - WEEKS * 7 + 1);
		return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
	}, []);

	const { data, isLoading, isError } = useQuery(
		orpc.finance.reports.cashFlow.queryOptions({
			input: {
				organizationId,
				periodType: "weekly",
				dateFrom,
				dateTo,
			},
		}),
	);

	const chartData = useMemo(
		() =>
			(data?.periods ?? []).map((period) => ({
				week: new Intl.DateTimeFormat("en-US", {
					day: "numeric",
					month: "numeric",
				}).format(new Date(period.periodStart)),
				amount: period.netFlow,
			})),
		[data],
	);

	const chartConfig: ChartConfig = {
		amount: {
			label: t("finance.dashboard.overview.cashFlow"),
			color: "var(--primary)",
		},
	};

	return (
		<div className="bg-card border-2 rounded-2xl p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-sm font-medium text-card-foreground">
					{t("finance.dashboard.overview.cashFlow")}
				</h3>
				<span className="text-xs text-muted-foreground">
					{t("finance.dashboard.overview.last8Weeks")}
				</span>
			</div>
			{isLoading ? (
				<Skeleton className="h-32 w-full rounded-xl" />
			) : isError ? (
				<div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
					{t("finance.dashboard.overview.cashFlowUnavailable")}
				</div>
			) : chartData.length === 0 ? (
				<div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
					{t("finance.dashboard.overview.cashFlowEmpty")}
				</div>
			) : (
				<ChartContainer config={chartConfig} className="h-32 w-full">
					<AreaChart
						accessibilityLayer
						data={chartData}
						margin={{ top: 0, right: 5, left: 5, bottom: 20 }}
					>
						<defs>
							<linearGradient id="cashFlowGradient" x1="0" y1="0" x2="0" y2="1">
								<stop
									offset="0%"
									stopColor="var(--chart-4)"
									stopOpacity={0.4}
								/>
								<stop
									offset="100%"
									stopColor="var(--chart-4)"
									stopOpacity={0}
								/>
							</linearGradient>
						</defs>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="week"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							fontSize={10}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									formatter={(value: number | string) => formatCurrency(Number(value))}
								/>
							}
						/>
						<Area
							dataKey="amount"
							type="natural"
							fill="url(#cashFlowGradient)"
							stroke="var(--chart-4)"
							strokeWidth={2}
						/>
					</AreaChart>
				</ChartContainer>
			)}
		</div>
	);
}
