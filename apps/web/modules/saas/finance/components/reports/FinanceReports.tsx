"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	BarChart3,
	TrendingUp,
	Users,
	FileSignature,
	Receipt,
	DollarSign,
	Percent,
	Calendar,
	Building2,
	ArrowUpDown,
} from "lucide-react";
import Link from "next/link";
import { Currency } from "../shared/Currency";
import { Skeleton } from "@ui/components/skeleton";

interface FinanceReportsProps {
	organizationId: string;
	organizationSlug: string;
}

export function FinanceReports({
	organizationId,
	organizationSlug,
}: FinanceReportsProps) {
	const t = useTranslations();

	// Date range state
	const [startDate, setStartDate] = useState(() => {
		const date = new Date();
		date.setMonth(date.getMonth() - 12);
		return date.toISOString().split("T")[0];
	});
	const [endDate, setEndDate] = useState(() => {
		return new Date().toISOString().split("T")[0];
	});

	// Fetch revenue by period
	const { data: revenueByPeriod, isLoading: isLoadingRevenue } = useQuery(
		orpc.finance.reports.revenueByPeriod.queryOptions({
			input: {
				organizationId,
				startDate: new Date(startDate).toISOString(),
				endDate: new Date(endDate).toISOString(),
			},
		}),
	);

	// Fetch revenue by project
	const { data: revenueByProject, isLoading: isLoadingProject } = useQuery(
		orpc.finance.reports.revenueByProject.queryOptions({
			input: { organizationId },
		}),
	);

	// Fetch revenue by client
	const { data: revenueByClient, isLoading: isLoadingClient } = useQuery(
		orpc.finance.reports.revenueByClient.queryOptions({
			input: { organizationId, limit: 10 },
		}),
	);

	// Fetch conversion rate
	const { data: conversionRate, isLoading: isLoadingConversion } = useQuery(
		orpc.finance.reports.conversionRate.queryOptions({
			input: {
				organizationId,
				startDate: new Date(startDate).toISOString(),
				endDate: new Date(endDate).toISOString(),
			},
		}),
	);

	// Fetch quotation stats
	const { data: quotationStats, isLoading: isLoadingQuotationStats } = useQuery(
		orpc.finance.reports.quotationStats.queryOptions({
			input: { organizationId },
		}),
	);

	// Fetch invoice stats
	const { data: invoiceStats, isLoading: isLoadingInvoiceStats } = useQuery(
		orpc.finance.reports.invoiceStats.queryOptions({
			input: { organizationId },
		}),
	);

	// Calculate totals from revenue by period
	const totalRevenue =
		revenueByPeriod?.reduce((sum: any, item: any) => sum + Number(item.revenue), 0) ?? 0;

	// Calculate max revenue for chart scaling
	const maxRevenue =
		revenueByPeriod?.reduce(
			(max: any, item: any) => Math.max(max, Number(item.revenue)),
			0,
		) ?? 1;

	return (
		<div className="space-y-6">
			{/* Date Range Filter */}
			<div className="flex items-center justify-end gap-4">
				<div>
					<Label className="text-xs">{t("finance.reports.from")}</Label>
					<Input
						type="date"
						value={startDate}
						onChange={(e: any) => setStartDate(e.target.value)}
						className="rounded-xl h-9 w-36"
					/>
				</div>
				<div>
					<Label className="text-xs">{t("finance.reports.to")}</Label>
					<Input
						type="date"
						value={endDate}
						onChange={(e: any) => setEndDate(e.target.value)}
						className="rounded-xl h-9 w-36"
					/>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									{t("finance.reports.totalRevenue")}
								</p>
								<p className="text-2xl font-bold text-card-foreground mt-1">
									<Currency amount={totalRevenue} />
								</p>
							</div>
							<div className="p-3 bg-success/15 rounded-xl">
								<DollarSign className="h-6 w-6 text-success" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									{t("finance.reports.conversionRate")}
								</p>
								<p className="text-2xl font-bold text-card-foreground mt-1">
									{conversionRate?.conversionRate?.toFixed(1) ?? "0"}%
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									{conversionRate?.converted ?? 0} / {conversionRate?.total ?? 0}
								</p>
							</div>
							<div className="p-3 bg-chart-4/15 dark:bg-chart-4/20 rounded-xl">
								<Percent className="h-6 w-6 text-chart-4 dark:text-chart-4" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									{t("finance.reports.totalQuotations")}
								</p>
								<p className="text-2xl font-bold text-card-foreground mt-1">
									{quotationStats?.reduce((sum: any, s: any) => sum + s.count, 0) ?? 0}
								</p>
							</div>
							<div className="p-3 bg-chart-4/15 rounded-xl">
								<FileSignature className="h-6 w-6 text-chart-4" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">
									{t("finance.reports.totalInvoices")}
								</p>
								<p className="text-2xl font-bold text-card-foreground mt-1">
									{invoiceStats?.reduce((sum: any, s: any) => sum + s.count, 0) ?? 0}
								</p>
							</div>
							<div className="p-3 bg-chart-1/15 rounded-xl">
								<Receipt className="h-6 w-6 text-chart-1" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Detailed Reports */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Link href={`/app/${organizationSlug}/finance/reports/cash-flow`}>
					<Card className="rounded-2xl hover:border-primary/40 transition-colors cursor-pointer">
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-3 bg-chart-4/15 dark:bg-chart-4/20 rounded-xl">
									<ArrowUpDown className="h-6 w-6 text-chart-4 dark:text-chart-4" />
								</div>
								<div>
									<p className="font-medium text-card-foreground">
										{t("finance.reports.cashFlow.title")}
									</p>
									<p className="text-sm text-muted-foreground">
										{t("finance.reports.cashFlow.subtitle")}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</Link>
			</div>

			{/* Reports Tabs */}
			<Tabs defaultValue="revenue" className="space-y-6">
				<TabsList className="rounded-xl bg-muted p-1">
					<TabsTrigger value="revenue" className="rounded-lg">
						<TrendingUp className="h-4 w-4 me-2" />
						{t("finance.reports.revenueByPeriod")}
					</TabsTrigger>
					<TabsTrigger value="projects" className="rounded-lg">
						<Building2 className="h-4 w-4 me-2" />
						{t("finance.reports.revenueByProject")}
					</TabsTrigger>
					<TabsTrigger value="clients" className="rounded-lg">
						<Users className="h-4 w-4 me-2" />
						{t("finance.reports.revenueByClient")}
					</TabsTrigger>
					<TabsTrigger value="status" className="rounded-lg">
						<BarChart3 className="h-4 w-4 me-2" />
						{t("finance.reports.statusStats")}
					</TabsTrigger>
				</TabsList>

				{/* Revenue by Period Tab */}
				<TabsContent value="revenue">
					<Card className="rounded-2xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Calendar className="h-5 w-5" />
								{t("finance.reports.monthlyRevenue")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isLoadingRevenue ? (
								<Skeleton className="h-64 w-full rounded-lg" />
							) : !revenueByPeriod || revenueByPeriod.length === 0 ? (
								<div className="text-center py-10 text-muted-foreground">
									{t("finance.reports.noData")}
								</div>
							) : (
								<div className="space-y-4">
									{/* Simple Bar Chart */}
									<div className="space-y-3">
										{revenueByPeriod.map((item: any) => (
											<div key={item.month} className="flex items-center gap-4">
												<div className="w-20 text-sm text-muted-foreground">
													{item.month}
												</div>
												<div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
													<div
														className="bg-primary h-full rounded-full flex items-center justify-end pe-3"
														style={{
															width: `${Math.max((Number(item.revenue) / maxRevenue) * 100, 5)}%`,
														}}
													>
														<span className="text-xs font-medium text-primary-foreground">
															<Currency amount={Number(item.revenue)} />
														</span>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Revenue by Project Tab */}
				<TabsContent value="projects">
					<Card className="rounded-2xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Building2 className="h-5 w-5" />
								{t("finance.reports.projectRevenue")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isLoadingProject ? (
								<Skeleton className="h-64 w-full rounded-lg" />
							) : !revenueByProject || revenueByProject.length === 0 ? (
								<div className="text-center py-10 text-muted-foreground">
									{t("finance.reports.noData")}
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>{t("finance.reports.project")}</TableHead>
											<TableHead className="text-center">
												{t("finance.reports.paidAmount")}
											</TableHead>
											<TableHead className="text-end">
												{t("finance.reports.totalInvoiced")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{revenueByProject.map((item: any) => (
											<TableRow key={item.project?.id || "no-project"}>
												<TableCell className="font-medium">
													{item.project?.name || t("finance.reports.noProject")}
												</TableCell>
												<TableCell className="text-center">
													<Currency amount={Number(item.totalPaid)} />
												</TableCell>
												<TableCell className="text-end font-medium text-success">
													<Currency amount={Number(item.totalInvoiced)} />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Revenue by Client Tab */}
				<TabsContent value="clients">
					<Card className="rounded-2xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								{t("finance.reports.topClients")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isLoadingClient ? (
								<Skeleton className="h-64 w-full rounded-lg" />
							) : !revenueByClient || revenueByClient.length === 0 ? (
								<div className="text-center py-10 text-muted-foreground">
									{t("finance.reports.noData")}
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="w-10">#</TableHead>
											<TableHead>{t("finance.reports.client")}</TableHead>
											<TableHead className="text-center">
												{t("finance.reports.invoiceCount")}
											</TableHead>
											<TableHead className="text-end">
												{t("finance.reports.revenue")}
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{revenueByClient.map((item: any, index: any) => (
											<TableRow key={item.client?.id || index}>
												<TableCell className="text-muted-foreground">
													{index + 1}
												</TableCell>
												<TableCell className="font-medium">
													{item.client?.name || t("finance.reports.unknown")}
												</TableCell>
												<TableCell className="text-center">
													{item.invoiceCount}
												</TableCell>
												<TableCell className="text-end font-medium text-success">
													<Currency amount={Number(item.totalPaid)} />
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Status Stats Tab */}
				<TabsContent value="status">
					<div className="grid gap-6 lg:grid-cols-2">
						{/* Quotation Stats */}
						<Card className="rounded-2xl">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<FileSignature className="h-5 w-5" />
									{t("finance.reports.quotationStats")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{isLoadingQuotationStats ? (
									<Skeleton className="h-64 w-full rounded-lg" />
								) : !quotationStats || quotationStats.length === 0 ? (
									<div className="text-center py-10 text-muted-foreground">
										{t("finance.reports.noData")}
									</div>
								) : (
									<div className="space-y-3">
										{quotationStats.map((stat: any) => (
											<div
												key={stat.status}
												className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
											>
												<div className="flex items-center gap-3">
													<StatusIndicator status={stat.status} type="quotation" />
													<span className="text-foreground">
														{t(`finance.quotations.status.${stat.status.toLowerCase()}`)}
													</span>
												</div>
												<div className="flex items-center gap-4">
													<span className="text-sm text-muted-foreground">
														<Currency amount={Number(stat.totalValue ?? 0)} />
													</span>
													<span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-lg">
														{stat.count}
													</span>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Invoice Stats */}
						<Card className="rounded-2xl">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Receipt className="h-5 w-5" />
									{t("finance.reports.invoiceStats")}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{isLoadingInvoiceStats ? (
									<Skeleton className="h-64 w-full rounded-lg" />
								) : !invoiceStats || invoiceStats.length === 0 ? (
									<div className="text-center py-10 text-muted-foreground">
										{t("finance.reports.noData")}
									</div>
								) : (
									<div className="space-y-3">
										{invoiceStats.map((stat: any) => (
											<div
												key={stat.status}
												className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
											>
												<div className="flex items-center gap-3">
													<StatusIndicator status={stat.status} type="invoice" />
													<span className="text-foreground">
														{t(`finance.invoices.status.${stat.status.toLowerCase()}`)}
													</span>
												</div>
												<div className="flex items-center gap-4">
													<span className="text-sm text-muted-foreground">
														<Currency amount={Number(stat.totalValue ?? 0)} />
													</span>
													<span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-lg">
														{stat.count}
													</span>
												</div>
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}

// Status indicator component
function StatusIndicator({
	status,
	type,
}: {
	status: string;
	type: "quotation" | "invoice";
}) {
	const colors: Record<string, string> = {
		// Quotation statuses
		DRAFT: "bg-muted-foreground",
		SENT: "bg-chart-4",
		VIEWED: "bg-chart-4",
		ACCEPTED: "bg-success",
		REJECTED: "bg-destructive",
		EXPIRED: "bg-chart-1",
		CONVERTED: "bg-chart-4",
		// Invoice statuses
		PARTIALLY_PAID: "bg-chart-1",
		PAID: "bg-success",
		OVERDUE: "bg-destructive",
		CANCELLED: "bg-muted-foreground",
	};

	return <div className={`w-3 h-3 rounded-full ${colors[status] || "bg-muted-foreground"}`} />;
}
