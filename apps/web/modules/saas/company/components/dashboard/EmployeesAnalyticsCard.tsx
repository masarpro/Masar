"use client";

import { useTranslations } from "next-intl";
import { PieChart, Pie, Cell } from "recharts";
import {
	CHART_PALETTE,
	CHART_SEMANTIC,
} from "@saas/shared/lib/chart-colors";
import { ChartContainer } from "@ui/components/chart";
import { Users } from "lucide-react";

interface EmployeesAnalyticsCardProps {
	employees: {
		totalActive: number;
		totalTerminated: number;
		totalOnLeave: number;
		totalMonthlySalaries: number;
		totalMonthlyGosi: number;
		totalMonthlyCost: number;
	};
	formatCurrency: (amount: number) => string;
}

const COLORS = {
	active: CHART_PALETTE[0], // sky
	onLeave: CHART_PALETTE[2], // amber
	terminated: CHART_SEMANTIC.neutral,
};

export function EmployeesAnalyticsCard({
	employees,
	formatCurrency,
}: EmployeesAnalyticsCardProps) {
	const t = useTranslations();

	const total =
		employees.totalActive + employees.totalOnLeave + employees.totalTerminated;

	const chartData = [
		{ name: "active", value: employees.totalActive, color: COLORS.active },
		{ name: "onLeave", value: employees.totalOnLeave, color: COLORS.onLeave },
		{
			name: "terminated",
			value: employees.totalTerminated,
			color: COLORS.terminated,
		},
	].filter((d) => d.value > 0);

	const legendItems = [
		{
			label: t("company.employees.active"),
			value: employees.totalActive,
			color: COLORS.active,
		},
		{
			label: t("company.employees.onLeave"),
			value: employees.totalOnLeave,
			color: COLORS.onLeave,
		},
		{
			label: t("company.employees.terminated"),
			value: employees.totalTerminated,
			color: COLORS.terminated,
		},
	];

	const isEmpty = total === 0;

	return (
		<div className="bg-card border-2 rounded-2xl p-5">
			{/* Header */}
			<div className="flex items-center gap-3 mb-5">
				<div className="flex size-9 items-center justify-center rounded-xl bg-chart-4/15 text-chart-4">
					<Users className="h-5 w-5" />
				</div>
				<h3 className="text-sm font-semibold text-card-foreground">
					{t("company.dashboard.employeeAnalytics")}
				</h3>
			</div>

			{isEmpty ? (
				<div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
					{t("company.dashboard.noData")}
				</div>
			) : (
				<>
					{/* Chart */}
					<div className="flex justify-center mb-4">
						<ChartContainer
							config={{}}
							className="h-[160px] w-[160px] !aspect-square"
						>
							<PieChart>
								<Pie
									data={chartData}
									cx="50%"
									cy="50%"
									innerRadius={40}
									outerRadius={70}
									paddingAngle={2}
									dataKey="value"
									strokeWidth={0}
								>
									{chartData.map((entry) => (
										<Cell key={entry.name} fill={entry.color} />
									))}
								</Pie>
								<text
									x="50%"
									y="46%"
									textAnchor="middle"
									dominantBaseline="middle"
									className="fill-foreground text-2xl font-bold"
									style={{ fontSize: "24px", fontWeight: 700 }}
								>
									{total}
								</text>
								<text
									x="50%"
									y="60%"
									textAnchor="middle"
									dominantBaseline="middle"
									className="fill-muted-foreground"
									style={{ fontSize: "11px" }}
								>
									{t("company.dashboard.employee")}
								</text>
							</PieChart>
						</ChartContainer>
					</div>

					{/* Legend */}
					<div className="space-y-2 mb-4">
						{legendItems.map((item) => (
							<div
								key={item.label}
								className="flex items-center justify-between text-sm"
							>
								<div className="flex items-center gap-2">
									<div
										className="w-2.5 h-2.5 rounded-full shrink-0"
										style={{ backgroundColor: item.color }}
									/>
									<span className="text-muted-foreground">
										{item.label}
									</span>
								</div>
								<span className="font-semibold text-card-foreground">
									{item.value}
								</span>
							</div>
						))}
					</div>

					{/* Footer */}
					<div className="border-t-2 pt-3 space-y-1.5">
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">
								{t("company.dashboard.salaries")}
							</span>
							<span
								className="font-semibold text-card-foreground"
								dir="ltr"
							>
								{formatCurrency(Number(employees.totalMonthlySalaries))}
							</span>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span className="text-muted-foreground">
								{t("company.dashboard.gosi")}
							</span>
							<span
								className="font-semibold text-card-foreground"
								dir="ltr"
							>
								{formatCurrency(Number(employees.totalMonthlyGosi))}
							</span>
						</div>
						<div className="flex items-center justify-between text-sm mt-2">
							<span className="font-bold text-card-foreground">
								{t("company.dashboard.totalMonthlyCost")}
							</span>
							<span
								className="font-bold text-card-foreground"
								dir="ltr"
							>
								{formatCurrency(Number(employees.totalMonthlyCost))}
							</span>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
