"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	ChevronDown,
	ChevronUp,
	Clock,
	DollarSign,
	Hammer,
	Users,
} from "lucide-react";
import { Currency } from "../shared/Currency";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from "recharts";

interface AgedPayablesReportProps {
	organizationId: string;
	organizationSlug: string;
}

const AGING_COLORS = {
	current: "#22c55e",
	days1to30: "#eab308",
	days31to60: "#f97316",
	days61to90: "#ef4444",
	over90: "#991b1b",
};

export function AgedPayablesReport({
	organizationId,
}: AgedPayablesReportProps) {
	const t = useTranslations();
	const [expandedContracts, setExpandedContracts] = useState<Set<string>>(
		new Set(),
	);

	const { data, isLoading } = useQuery(
		orpc.finance.accountingReports.agedPayables.queryOptions({
			input: { organizationId },
		}),
	);

	const toggleContract = (key: string) => {
		setExpandedContracts((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	if (isLoading) return <DashboardSkeleton />;
	if (!data) return null;

	const { rows, totals } = data;

	const maxPayable =
		rows.length > 0 ? Math.max(...rows.map((r) => r.total)) : 0;
	const totalContractors = rows.length;
	const totalDetails = rows.reduce((sum, r) => sum + r.details.length, 0);
	const avgAgingDays =
		totalDetails > 0
			? Math.round(
					rows.reduce(
						(sum, r) =>
							sum +
							r.details.reduce((s, d) => s + d.agingDays, 0),
						0,
					) / totalDetails,
				)
			: 0;

	const pieData = [
		{
			name: t("finance.accountingReports.aging.current"),
			value: totals.current,
			color: AGING_COLORS.current,
		},
		{
			name: t("finance.accountingReports.aging.days1to30"),
			value: totals.days1to30,
			color: AGING_COLORS.days1to30,
		},
		{
			name: t("finance.accountingReports.aging.days31to60"),
			value: totals.days31to60,
			color: AGING_COLORS.days31to60,
		},
		{
			name: t("finance.accountingReports.aging.days61to90"),
			value: totals.days61to90,
			color: AGING_COLORS.days61to90,
		},
		{
			name: t("finance.accountingReports.aging.over90"),
			value: totals.over90,
			color: AGING_COLORS.over90,
		},
	].filter((d) => d.value > 0);

	return (
		<div className="space-y-6">
			{/* KPI Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.accountingReports.totalPayable")}
								</p>
								<p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
									<Currency amount={totals.total} />
								</p>
							</div>
							<div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
								<DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.accountingReports.contractorsCount")}
								</p>
								<p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
									{totalContractors}
								</p>
							</div>
							<div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
								<Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.accountingReports.largestPayable")}
								</p>
								<p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
									<Currency amount={maxPayable} />
								</p>
							</div>
							<div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
								<Hammer className="h-6 w-6 text-purple-600 dark:text-purple-400" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.accountingReports.avgAgingDays")}
								</p>
								<p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
									{avgAgingDays}{" "}
									<span className="text-sm font-normal text-slate-400">
										{t("finance.accountingReports.days")}
									</span>
								</p>
							</div>
							<div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
								<Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main Table */}
				<Card className="rounded-2xl lg:col-span-2">
					<CardHeader>
						<CardTitle>
							{t("finance.accountingReports.agedPayables")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{rows.length === 0 ? (
							<div className="text-center py-10 text-slate-500">
								{t("finance.accountingReports.noOutstandingPayables")}
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="min-w-[150px]">
												{t("finance.accountingReports.contractor")}
											</TableHead>
											<TableHead>
												{t("finance.accountingReports.project")}
											</TableHead>
											<TableHead className="text-end bg-green-50 dark:bg-green-950/20">
												{t("finance.accountingReports.aging.current")}
											</TableHead>
											<TableHead className="text-end bg-yellow-50 dark:bg-yellow-950/20">
												{t("finance.accountingReports.aging.days1to30")}
											</TableHead>
											<TableHead className="text-end bg-orange-50 dark:bg-orange-950/20">
												{t("finance.accountingReports.aging.days31to60")}
											</TableHead>
											<TableHead className="text-end bg-red-50 dark:bg-red-950/20">
												{t("finance.accountingReports.aging.days61to90")}
											</TableHead>
											<TableHead className="text-end bg-red-100 dark:bg-red-950/40">
												{t("finance.accountingReports.aging.over90")}
											</TableHead>
											<TableHead className="text-end font-bold">
												{t("finance.accountingReports.aging.total")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{rows.map((row) => {
											const isExpanded =
												expandedContracts.has(
													row.contractId,
												);
											return (
												<>
													<TableRow
														key={row.contractId}
														className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
														onClick={() =>
															toggleContract(
																row.contractId,
															)
														}
													>
														<TableCell className="font-medium">
															<div className="flex items-center gap-2">
																{isExpanded ? (
																	<ChevronUp className="h-4 w-4 text-slate-400" />
																) : (
																	<ChevronDown className="h-4 w-4 text-slate-400" />
																)}
																{
																	row.contractorName
																}
															</div>
														</TableCell>
														<TableCell className="text-sm text-slate-500">
															{row.projectName}
														</TableCell>
														<AgingCell
															value={row.current}
															color="green"
														/>
														<AgingCell
															value={
																row.days1to30
															}
															color="yellow"
														/>
														<AgingCell
															value={
																row.days31to60
															}
															color="orange"
														/>
														<AgingCell
															value={
																row.days61to90
															}
															color="red"
														/>
														<AgingCell
															value={row.over90}
															color="darkred"
														/>
														<TableCell className="text-end font-bold">
															<Currency
																amount={
																	row.total
																}
															/>
														</TableCell>
													</TableRow>
													{isExpanded &&
														row.details.map(
															(detail) => (
																<TableRow
																	key={
																		detail.id
																	}
																	className="bg-slate-50/50 dark:bg-slate-800/50"
																>
																	<TableCell className="ps-10 text-sm text-slate-500">
																		{detail.type ===
																		"claim"
																			? `${t("finance.accountingReports.claim")} ${detail.reference}`
																			: `${t("finance.accountingReports.contractBalance")} ${detail.reference}`}
																	</TableCell>
																	<TableCell
																		colSpan={
																			6
																		}
																		className="text-sm text-slate-500 text-end"
																	>
																		{
																			detail.agingDays
																		}{" "}
																		{t(
																			"finance.accountingReports.days",
																		)}
																	</TableCell>
																	<TableCell className="text-end text-sm font-medium">
																		<Currency
																			amount={
																				detail.outstanding
																			}
																		/>
																	</TableCell>
																</TableRow>
															),
														)}
												</>
											);
										})}
										{/* Totals Row */}
										<TableRow className="border-t-2 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 font-bold">
											<TableCell colSpan={2}>
												{t(
													"finance.accountingReports.aging.total",
												)}
											</TableCell>
											<TableCell className="text-end">
												<Currency
													amount={totals.current}
												/>
											</TableCell>
											<TableCell className="text-end">
												<Currency
													amount={totals.days1to30}
												/>
											</TableCell>
											<TableCell className="text-end">
												<Currency
													amount={totals.days31to60}
												/>
											</TableCell>
											<TableCell className="text-end">
												<Currency
													amount={totals.days61to90}
												/>
											</TableCell>
											<TableCell className="text-end">
												<Currency
													amount={totals.over90}
												/>
											</TableCell>
											<TableCell className="text-end">
												<Currency
													amount={totals.total}
												/>
											</TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Pie Chart */}
				{pieData.length > 0 && (
					<Card className="rounded-2xl">
						<CardHeader>
							<CardTitle className="text-sm">
								{t(
									"finance.accountingReports.agingDistribution",
								)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={280}>
								<PieChart>
									<Pie
										data={pieData}
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={100}
										dataKey="value"
										nameKey="name"
										paddingAngle={2}
									>
										{pieData.map((entry, index) => (
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
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}

function AgingCell({
	value,
	color,
}: {
	value: number;
	color: "green" | "yellow" | "orange" | "red" | "darkred";
}) {
	if (value === 0) {
		return (
			<TableCell className="text-end text-slate-300 dark:text-slate-600">
				-
			</TableCell>
		);
	}

	const colorClasses = {
		green: "text-green-600 dark:text-green-400",
		yellow: "text-yellow-600 dark:text-yellow-400",
		orange: "text-orange-600 dark:text-orange-400",
		red: "text-red-600 dark:text-red-400",
		darkred: "text-red-800 dark:text-red-300 font-semibold",
	};

	return (
		<TableCell className={`text-end ${colorClasses[color]}`}>
			<Currency amount={value} />
		</TableCell>
	);
}
