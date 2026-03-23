"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	TrendingUp,
	TrendingDown,
	DollarSign,
	ArrowUp,
	ArrowDown,
} from "lucide-react";
import { Currency } from "../shared/Currency";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from "recharts";

interface IncomeStatementReportProps {
	organizationId: string;
	organizationSlug: string;
}

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

type PeriodType = "month" | "quarter" | "year" | "custom";

export function IncomeStatementReport({
	organizationId,
}: IncomeStatementReportProps) {
	const t = useTranslations();
	const now = new Date();

	const [periodType, setPeriodType] = useState<PeriodType>("quarter");
	const [customFrom, setCustomFrom] = useState(() => {
		const d = new Date();
		d.setMonth(d.getMonth() - 3);
		return d.toISOString().split("T")[0];
	});
	const [customTo, setCustomTo] = useState(
		() => new Date().toISOString().split("T")[0],
	);

	const { dateFrom, dateTo } = useMemo(() => {
		const today = new Date();
		switch (periodType) {
			case "month": {
				const from = new Date(today.getFullYear(), today.getMonth(), 1);
				const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
				return { dateFrom: from, dateTo: to };
			}
			case "quarter": {
				const q = Math.floor(today.getMonth() / 3);
				const from = new Date(today.getFullYear(), q * 3, 1);
				const to = new Date(today.getFullYear(), q * 3 + 3, 0);
				return { dateFrom: from, dateTo: to };
			}
			case "year": {
				const from = new Date(today.getFullYear(), 0, 1);
				const to = new Date(today.getFullYear(), 11, 31);
				return { dateFrom: from, dateTo: to };
			}
			case "custom":
				return {
					dateFrom: new Date(customFrom),
					dateTo: new Date(customTo),
				};
		}
	}, [periodType, customFrom, customTo]);

	const { data, isLoading } = useQuery(
		orpc.finance.accountingReports.incomeStatement.queryOptions({
			input: {
				organizationId,
				dateFrom: dateFrom.toISOString(),
				dateTo: dateTo.toISOString(),
				includeComparison: true,
			},
		}),
	);

	if (isLoading) return <DashboardSkeleton />;

	// Expense pie chart data
	const expensePieData = data
		? [
				...data.expenses.byCategory.map((c) => ({
					name: c.categoryLabel,
					value: c.amount,
				})),
				...(data.expenses.subcontractorPayments > 0
					? [
							{
								name: t("finance.accountingReports.income.subcontractors"),
								value: data.expenses.subcontractorPayments,
							},
						]
					: []),
				...(data.expenses.payroll > 0
					? [
							{
								name: t("finance.accountingReports.income.payroll"),
								value: data.expenses.payroll,
							},
						]
					: []),
				...(data.expenses.companyExpenses > 0
					? [
							{
								name: t("finance.accountingReports.income.companyExpenses"),
								value: data.expenses.companyExpenses,
							},
						]
					: []),
			].filter((d) => d.value > 0)
		: [];

	return (
		<div className="space-y-6">
			{/* Period Selector */}
			<div className="flex flex-wrap items-end gap-3">
				<div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
					{(
						[
							{ key: "month", label: t("finance.accountingReports.income.month") },
							{ key: "quarter", label: t("finance.accountingReports.income.quarter") },
							{ key: "year", label: t("finance.accountingReports.income.year") },
							{ key: "custom", label: t("finance.accountingReports.income.custom") },
						] as const
					).map((p) => (
						<Button
							key={p.key}
							variant={periodType === p.key ? "primary" : "ghost"}
							size="sm"
							className="rounded-lg"
							onClick={() => setPeriodType(p.key)}
						>
							{p.label}
						</Button>
					))}
				</div>

				{periodType === "custom" && (
					<div className="flex items-center gap-2">
						<div>
							<Label className="text-xs">
								{t("finance.reports.from")}
							</Label>
							<Input
								type="date"
								value={customFrom}
								onChange={(e) => setCustomFrom(e.target.value)}
								className="rounded-xl h-9 w-36"
							/>
						</div>
						<div>
							<Label className="text-xs">
								{t("finance.reports.to")}
							</Label>
							<Input
								type="date"
								value={customTo}
								onChange={(e) => setCustomTo(e.target.value)}
								className="rounded-xl h-9 w-36"
							/>
						</div>
					</div>
				)}
			</div>

			{data && (
				<>
					{/* KPI Cards */}
					<div className="grid gap-4 sm:grid-cols-3">
						<KPICard
							label={t("finance.accountingReports.income.totalRevenue")}
							value={data.revenue.totalRevenue}
							change={data.comparison?.revenueChange}
							color="green"
						/>
						<KPICard
							label={t("finance.accountingReports.income.totalExpenses")}
							value={data.expenses.totalExpenses}
							change={data.comparison?.expensesChange}
							color="red"
							invertChange
						/>
						<KPICard
							label={t("finance.accountingReports.income.netProfit")}
							value={data.summary.netProfit}
							change={data.comparison?.profitChange}
							color={data.summary.netProfit >= 0 ? "blue" : "red"}
							subtitle={`${t("finance.accountingReports.income.profitMargin")}: ${data.summary.profitMargin.toFixed(1)}%`}
						/>
					</div>

					{/* Income Statement - Accounting Format */}
					<Card className="rounded-2xl">
						<CardHeader>
							<CardTitle>
								{t("finance.accountingReports.incomeStatement")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-mono text-sm space-y-1">
								{/* Revenue Section */}
								<div className="font-bold text-slate-700 dark:text-slate-300 pb-2 border-b">
									{t("finance.accountingReports.income.revenue")}
								</div>
								<StatementLine
									label={t("finance.accountingReports.income.invoiceRevenue")}
									amount={data.revenue.invoiceRevenue}
									indent={1}
								/>
								<StatementLine
									label={t("finance.accountingReports.income.directPayments")}
									amount={data.revenue.directPayments}
									indent={1}
								/>
								{data.revenue.creditNotes > 0 && (
									<StatementLine
										label={t("finance.accountingReports.income.creditNotes")}
										amount={-data.revenue.creditNotes}
										indent={1}
										isNegative
									/>
								)}
								<StatementLine
									label={t("finance.accountingReports.income.totalRevenue")}
									amount={data.revenue.totalRevenue}
									isBold
									isSubtotal
								/>

								{/* Expenses Section */}
								<div className="font-bold text-slate-700 dark:text-slate-300 pb-2 pt-4 border-b">
									{t("finance.accountingReports.income.expenses")}
								</div>
								{data.expenses.byCategory.map((cat) => (
									<StatementLine
										key={cat.category}
										label={cat.categoryLabel}
										amount={cat.amount}
										indent={1}
									/>
								))}
								{data.expenses.subcontractorPayments > 0 && (
									<StatementLine
										label={t("finance.accountingReports.income.subcontractors")}
										amount={data.expenses.subcontractorPayments}
										indent={1}
									/>
								)}
								{data.expenses.payroll > 0 && (
									<StatementLine
										label={t("finance.accountingReports.income.payroll")}
										amount={data.expenses.payroll}
										indent={1}
									/>
								)}
								{data.expenses.companyExpenses > 0 && (
									<StatementLine
										label={t("finance.accountingReports.income.companyExpenses")}
										amount={data.expenses.companyExpenses}
										indent={1}
									/>
								)}
								<StatementLine
									label={t("finance.accountingReports.income.totalExpenses")}
									amount={data.expenses.totalExpenses}
									isBold
									isSubtotal
								/>

								{/* Net Profit */}
								<div className="pt-2">
									<StatementLine
										label={t("finance.accountingReports.income.netProfit")}
										amount={data.summary.netProfit}
										isBold
										isTotal
									/>
								</div>
								<div className="flex justify-between pt-1 text-xs text-slate-400">
									<span>
										{t("finance.accountingReports.income.profitMargin")}
									</span>
									<span>{data.summary.profitMargin.toFixed(1)}%</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Charts */}
					{expensePieData.length > 0 && (
						<div className="grid gap-6 lg:grid-cols-2">
							{/* Expense Breakdown Pie */}
							<Card className="rounded-2xl">
								<CardHeader>
									<CardTitle className="text-sm">
										{t("finance.accountingReports.income.expenseBreakdown")}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ResponsiveContainer
										width="100%"
										height={300}
									>
										<PieChart>
											<Pie
												data={expensePieData}
												cx="50%"
												cy="50%"
												innerRadius={60}
												outerRadius={100}
												dataKey="value"
												nameKey="name"
												paddingAngle={2}
											>
												{expensePieData.map(
													(_, index) => (
														<Cell
															key={`cell-${index}`}
															fill={
																EXPENSE_COLORS[
																	index %
																		EXPENSE_COLORS.length
																]
															}
														/>
													),
												)}
											</Pie>
											<Tooltip
												formatter={(value: number) =>
													new Intl.NumberFormat(
														"en-US",
														{
															style: "currency",
															currency: "SAR",
														},
													).format(value)
												}
											/>
											<Legend />
										</PieChart>
									</ResponsiveContainer>
								</CardContent>
							</Card>

							{/* Revenue by Project */}
							{data.revenue.byProject.length > 0 && (
								<Card className="rounded-2xl">
									<CardHeader>
										<CardTitle className="text-sm">
											{t("finance.accountingReports.income.revenueByProject")}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{data.revenue.byProject
												.sort(
													(a, b) =>
														b.amount - a.amount,
												)
												.slice(0, 8)
												.map((proj) => {
													const pct =
														data.revenue
															.totalRevenue > 0
															? (proj.amount /
																	data.revenue
																		.totalRevenue) *
																100
															: 0;
													return (
														<div
															key={
																proj.projectId
															}
															className="space-y-1"
														>
															<div className="flex items-center justify-between text-sm">
																<span className="text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
																	{
																		proj.projectName
																	}
																</span>
																<span className="font-medium">
																	<Currency
																		amount={
																			proj.amount
																		}
																	/>
																</span>
															</div>
															<div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
																<div
																	className="h-full bg-primary rounded-full"
																	style={{
																		width: `${Math.max(pct, 2)}%`,
																	}}
																/>
															</div>
														</div>
													);
												})}
										</div>
									</CardContent>
								</Card>
							)}
						</div>
					)}
				</>
			)}
		</div>
	);
}

function KPICard({
	label,
	value,
	change,
	color,
	subtitle,
	invertChange,
}: {
	label: string;
	value: number;
	change?: number;
	color: "green" | "red" | "blue";
	subtitle?: string;
	invertChange?: boolean;
}) {
	const colorClasses = {
		green: {
			text: "text-green-600 dark:text-green-400",
			bg: "bg-green-100 dark:bg-green-900/30",
			icon: TrendingUp,
		},
		red: {
			text: "text-red-600 dark:text-red-400",
			bg: "bg-red-100 dark:bg-red-900/30",
			icon: TrendingDown,
		},
		blue: {
			text: "text-blue-600 dark:text-blue-400",
			bg: "bg-blue-100 dark:bg-blue-900/30",
			icon: DollarSign,
		},
	};

	const c = colorClasses[color];
	const Icon = c.icon;

	// For expenses, increasing is bad (invertChange)
	const isPositiveChange = invertChange
		? change !== undefined && change < 0
		: change !== undefined && change > 0;

	return (
		<Card className="rounded-2xl">
			<CardContent className="p-4">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							{label}
						</p>
						<p className={`text-2xl font-bold ${c.text} mt-1`}>
							{value < 0 ? "(" : ""}
							<Currency amount={Math.abs(value)} />
							{value < 0 ? ")" : ""}
						</p>
						{change !== undefined && change !== 0 && (
							<div
								className={`flex items-center gap-1 mt-1 text-xs ${
									isPositiveChange
										? "text-green-500"
										: "text-red-500"
								}`}
							>
								{isPositiveChange ? (
									<ArrowUp className="h-3 w-3" />
								) : (
									<ArrowDown className="h-3 w-3" />
								)}
								{Math.abs(change).toFixed(1)}%
							</div>
						)}
						{subtitle && (
							<p className="text-xs text-slate-400 mt-1">
								{subtitle}
							</p>
						)}
					</div>
					<div className={`p-3 ${c.bg} rounded-xl`}>
						<Icon className={`h-6 w-6 ${c.text}`} />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

function StatementLine({
	label,
	amount,
	indent = 0,
	isBold,
	isSubtotal,
	isTotal,
	isNegative,
}: {
	label: string;
	amount: number;
	indent?: number;
	isBold?: boolean;
	isSubtotal?: boolean;
	isTotal?: boolean;
	isNegative?: boolean;
}) {
	const formatted =
		amount < 0
			? `(${new Intl.NumberFormat("en-US").format(Math.abs(amount))})`
			: new Intl.NumberFormat("en-US").format(amount);

	return (
		<div
			className={`flex items-center justify-between py-1 ${
				isBold ? "font-bold" : ""
			} ${isSubtotal ? "border-t border-slate-200 dark:border-slate-700" : ""} ${
				isTotal
					? "border-t-2 border-b-2 border-slate-400 dark:border-slate-500 py-2"
					: ""
			}`}
			style={{ paddingInlineStart: `${indent * 1.5}rem` }}
		>
			<span
				className={
					isBold
						? "text-slate-900 dark:text-slate-100"
						: "text-slate-600 dark:text-slate-400"
				}
			>
				{label}
			</span>
			<span
				className={`${isNegative || amount < 0 ? "text-red-500" : ""} ${
					isBold
						? "text-slate-900 dark:text-slate-100"
						: "text-slate-600 dark:text-slate-400"
				}`}
			>
				{formatted}
			</span>
		</div>
	);
}
