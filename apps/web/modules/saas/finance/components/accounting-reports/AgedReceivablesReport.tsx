"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	AlertTriangle,
	ChevronDown,
	ChevronUp,
	Users,
	Clock,
	DollarSign,
} from "lucide-react";
import { Currency } from "../shared/Currency";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { Skeleton } from "@ui/components/skeleton";
import dynamic from "next/dynamic";

// تحميل recharts ديناميكياً — يُبقيها خارج حزمة التقرير الرئيسية
const ChartSkeleton = () => <Skeleton className="h-[280px] w-full rounded-lg" />;
const AgingPieChart = dynamic(
	() => import("./AgingPieChart").then((m) => ({ default: m.AgingPieChart })),
	{ loading: ChartSkeleton, ssr: false },
);

interface AgedReceivablesReportProps {
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

export function AgedReceivablesReport({
	organizationId,
}: AgedReceivablesReportProps) {
	const t = useTranslations();
	const [expandedClients, setExpandedClients] = useState<Set<string>>(
		new Set(),
	);

	const { data, isLoading } = useQuery(
		orpc.finance.accountingReports.agedReceivables.queryOptions({
			input: { organizationId },
		}),
	);

	const toggleClient = (key: string) => {
		setExpandedClients((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};

	if (isLoading) return <DashboardSkeleton />;
	if (!data) return null;

	const { rows, totals } = data;
	const uninvoicedClaims = (data as any).uninvoicedClaims as
		| {
				items: Array<{
					id: string;
					claimNo: number;
					projectName: string;
					clientName: string | null;
					amount: number;
					dueDate: string | null;
					approvedAt: string | null;
				}>;
				total: number;
		  }
		| undefined;

	// KPI calculations
	const overdueClients = rows.filter((r: any) => r.over90 > 0).length;
	const maxDebt = rows.length > 0 ? Math.max(...rows.map((r: any) => r.total)) : 0;
	const totalInvoices = rows.reduce((sum: any, r: any) => sum + r.invoices.length, 0);
	const avgAgingDays =
		totalInvoices > 0
			? Math.round(
					rows.reduce(
						(sum: any, r: any) =>
							sum +
							r.invoices.reduce((s: any, inv: any) => s + inv.agingDays, 0),
						0,
					) / totalInvoices,
				)
			: 0;

	// Pie chart data
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
								<p className="text-sm text-muted-foreground dark:text-muted-foreground">
									{t("finance.accountingReports.totalOutstanding")}
								</p>
								<p className="text-2xl font-bold text-muted-foreground dark:text-muted-foreground mt-1">
									<Currency amount={totals.total} />
								</p>
							</div>
							<div className="p-3 bg-destructive/15 dark:bg-destructive/20 rounded-xl">
								<DollarSign className="h-6 w-6 text-destructive dark:text-destructive" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground dark:text-muted-foreground">
									{t("finance.accountingReports.overdueClients")}
								</p>
								<p className="text-2xl font-bold text-muted-foreground dark:text-muted-foreground mt-1">
									{overdueClients}
								</p>
							</div>
							<div className="p-3 bg-chart-1/20 dark:bg-chart-1/25 rounded-xl">
								<Users className="h-6 w-6 text-chart-1 dark:text-chart-1" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground dark:text-muted-foreground">
									{t("finance.accountingReports.largestDebt")}
								</p>
								<p className="text-2xl font-bold text-muted-foreground dark:text-muted-foreground mt-1">
									<Currency amount={maxDebt} />
								</p>
							</div>
							<div className="p-3 bg-chart-4/15 dark:bg-chart-4/20 rounded-xl">
								<AlertTriangle className="h-6 w-6 text-chart-4 dark:text-chart-4" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground dark:text-muted-foreground">
									{t("finance.accountingReports.avgAgingDays")}
								</p>
								<p className="text-2xl font-bold text-muted-foreground dark:text-muted-foreground mt-1">
									{avgAgingDays}{" "}
									<span className="text-sm font-normal text-muted-foreground">
										{t("finance.accountingReports.days")}
									</span>
								</p>
							</div>
							<div className="p-3 bg-chart-4/15 dark:bg-chart-4/20 rounded-xl">
								<Clock className="h-6 w-6 text-chart-4 dark:text-chart-4" />
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
							{t("finance.accountingReports.agedReceivables")}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{rows.length === 0 ? (
							<div className="text-center py-10 text-muted-foreground">
								{t("finance.accountingReports.noOutstandingReceivables")}
							</div>
						) : (
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="min-w-[180px]">
												{t("finance.accountingReports.client")}
											</TableHead>
											<TableHead className="text-end bg-success/15 dark:bg-success/20">
												{t("finance.accountingReports.aging.current")}
											</TableHead>
											<TableHead className="text-end bg-chart-1/20 dark:bg-chart-1/25">
												{t("finance.accountingReports.aging.days1to30")}
											</TableHead>
											<TableHead className="text-end bg-chart-1/20 dark:bg-chart-1/25">
												{t("finance.accountingReports.aging.days31to60")}
											</TableHead>
											<TableHead className="text-end bg-destructive/15 dark:bg-destructive/20">
												{t("finance.accountingReports.aging.days61to90")}
											</TableHead>
											<TableHead className="text-end bg-destructive/15 dark:bg-destructive/20">
												{t("finance.accountingReports.aging.over90")}
											</TableHead>
											<TableHead className="text-end font-bold">
												{t("finance.accountingReports.aging.total")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{rows.map((row: any) => {
											const key =
												row.clientId ?? row.clientName;
											const isExpanded =
												expandedClients.has(key);
											return (
												<>
													<TableRow
														key={key}
														className="cursor-pointer hover:bg-muted dark:hover:bg-muted"
														onClick={() =>
															toggleClient(key)
														}
													>
														<TableCell className="font-medium">
															<div className="flex items-center gap-2">
																{isExpanded ? (
																	<ChevronUp className="h-4 w-4 text-muted-foreground" />
																) : (
																	<ChevronDown className="h-4 w-4 text-muted-foreground" />
																)}
																{row.clientName}
																<span className="text-xs text-muted-foreground">
																	(
																	{
																		row
																			.invoices
																			.length
																	}
																	)
																</span>
															</div>
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
														row.invoices.map(
															(inv: any) => (
																<TableRow
																	key={inv.id}
																	className="bg-muted dark:bg-muted"
																>
																	<TableCell className="ps-10 text-sm text-muted-foreground">
																		{
																			inv.number
																		}
																		{inv.projectName && (
																			<span className="text-xs text-muted-foreground ms-2">
																				{
																					inv.projectName
																				}
																			</span>
																		)}
																	</TableCell>
																	<TableCell
																		colSpan={
																			5
																		}
																		className="text-sm text-muted-foreground text-end"
																	>
																		{t(
																			"finance.accountingReports.dueDate",
																		)}
																		:{" "}
																		{new Date(
																			inv.dueDate,
																		).toLocaleDateString(
																			"en-SA",
																		)}{" "}
																		·{" "}
																		{
																			inv.agingDays
																		}{" "}
																		{t(
																			"finance.accountingReports.days",
																		)}
																	</TableCell>
																	<TableCell className="text-end text-sm font-medium">
																		<Currency
																			amount={
																				inv.outstanding
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
										<TableRow className="border-t-2 border-border dark:border-border bg-muted dark:bg-muted font-bold">
											<TableCell>
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
							<AgingPieChart data={pieData} />
						</CardContent>
					</Card>
				)}
			</div>

			{/* مستخلصات معتمدة غير مفوترة — قسم منفصل عن الذمم المفوترة */}
			{uninvoicedClaims && uninvoicedClaims.items.length > 0 && (
				<Card className="rounded-2xl">
					<CardHeader>
						<CardTitle className="text-sm">
							{t("finance.accountingReports.uninvoicedClaims")}
						</CardTitle>
						<p className="text-xs text-muted-foreground dark:text-muted-foreground">
							{t("finance.accountingReports.uninvoicedClaimsHint")}
						</p>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="text-start">
											{t("finance.accountingReports.project")}
										</TableHead>
										<TableHead className="text-start">
											{t("finance.accountingReports.client")}
										</TableHead>
										<TableHead className="text-start">
											{t("finance.accountingReports.claim")}
										</TableHead>
										<TableHead className="text-start">
											{t("finance.accountingReports.approvedOn")}
										</TableHead>
										<TableHead className="text-start">
											{t("finance.accountingReports.dueDate")}
										</TableHead>
										<TableHead className="text-end">
											{t("finance.accountingReports.aging.total")}
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{uninvoicedClaims.items.map((claim) => (
										<TableRow key={claim.id}>
											<TableCell className="font-medium">
												{claim.projectName}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{claim.clientName ?? "—"}
											</TableCell>
											<TableCell>#{claim.claimNo}</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{claim.approvedAt
													? new Date(
															claim.approvedAt,
														).toLocaleDateString("en-SA")
													: "—"}
											</TableCell>
											<TableCell className="text-sm text-muted-foreground">
												{claim.dueDate
													? new Date(
															claim.dueDate,
														).toLocaleDateString("en-SA")
													: "—"}
											</TableCell>
											<TableCell className="text-end font-medium">
												<Currency amount={claim.amount} />
											</TableCell>
										</TableRow>
									))}
									<TableRow className="border-t-2 font-bold bg-muted dark:bg-muted">
										<TableCell colSpan={5}>
											{t("finance.accountingReports.aging.total")}
										</TableCell>
										<TableCell className="text-end">
											<Currency amount={uninvoicedClaims.total} />
										</TableCell>
									</TableRow>
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}
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
			<TableCell className="text-end text-muted-foreground dark:text-muted-foreground">
				-
			</TableCell>
		);
	}

	const colorClasses = {
		green: "text-success dark:text-success",
		yellow: "text-chart-1 dark:text-chart-1",
		orange: "text-chart-1 dark:text-chart-1",
		red: "text-destructive dark:text-destructive",
		darkred: "text-destructive dark:text-destructive font-semibold",
	};

	return (
		<TableCell className={`text-end ${colorClasses[color]}`}>
			<Currency amount={value} />
		</TableCell>
	);
}
