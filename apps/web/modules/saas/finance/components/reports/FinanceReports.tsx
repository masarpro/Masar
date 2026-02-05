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
} from "lucide-react";
import { Currency } from "../shared/Currency";

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
		revenueByPeriod?.reduce((sum, item) => sum + Number(item.revenue), 0) ?? 0;

	// Calculate max revenue for chart scaling
	const maxRevenue =
		revenueByPeriod?.reduce(
			(max, item) => Math.max(max, Number(item.revenue)),
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
						onChange={(e) => setStartDate(e.target.value)}
						className="rounded-xl h-9 w-36"
					/>
				</div>
				<div>
					<Label className="text-xs">{t("finance.reports.to")}</Label>
					<Input
						type="date"
						value={endDate}
						onChange={(e) => setEndDate(e.target.value)}
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
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.reports.totalRevenue")}
								</p>
								<p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
									<Currency amount={totalRevenue} />
								</p>
							</div>
							<div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
								<DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.reports.conversionRate")}
								</p>
								<p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
									{conversionRate?.conversionRate?.toFixed(1) ?? "0"}%
								</p>
								<p className="text-xs text-slate-400 mt-1">
									{conversionRate?.converted ?? 0} / {conversionRate?.total ?? 0}
								</p>
							</div>
							<div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
								<Percent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.reports.totalQuotations")}
								</p>
								<p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
									{quotationStats?.reduce((sum, s) => sum + s.count, 0) ?? 0}
								</p>
							</div>
							<div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
								<FileSignature className="h-6 w-6 text-purple-600 dark:text-purple-400" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="rounded-2xl">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-slate-500 dark:text-slate-400">
									{t("finance.reports.totalInvoices")}
								</p>
								<p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
									{invoiceStats?.reduce((sum, s) => sum + s.count, 0) ?? 0}
								</p>
							</div>
							<div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
								<Receipt className="h-6 w-6 text-amber-600 dark:text-amber-400" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Reports Tabs */}
			<Tabs defaultValue="revenue" className="space-y-6">
				<TabsList className="rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
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
								<div className="flex items-center justify-center py-20">
									<div className="relative">
										<div className="w-10 h-10 border-4 border-primary/20 rounded-full" />
										<div className="absolute top-0 left-0 w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
									</div>
								</div>
							) : !revenueByPeriod || revenueByPeriod.length === 0 ? (
								<div className="text-center py-10 text-slate-500">
									{t("finance.reports.noData")}
								</div>
							) : (
								<div className="space-y-4">
									{/* Simple Bar Chart */}
									<div className="space-y-3">
										{revenueByPeriod.map((item) => (
											<div key={item.month} className="flex items-center gap-4">
												<div className="w-20 text-sm text-slate-500 dark:text-slate-400">
													{item.month}
												</div>
												<div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-8 overflow-hidden">
													<div
														className="bg-primary h-full rounded-full flex items-center justify-end pe-3"
														style={{
															width: `${Math.max((Number(item.revenue) / maxRevenue) * 100, 5)}%`,
														}}
													>
														<span className="text-xs font-medium text-white">
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
								<div className="flex items-center justify-center py-20">
									<div className="relative">
										<div className="w-10 h-10 border-4 border-primary/20 rounded-full" />
										<div className="absolute top-0 left-0 w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
									</div>
								</div>
							) : !revenueByProject || revenueByProject.length === 0 ? (
								<div className="text-center py-10 text-slate-500">
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
										{revenueByProject.map((item) => (
											<TableRow key={item.project?.id || "no-project"}>
												<TableCell className="font-medium">
													{item.project?.name || t("finance.reports.noProject")}
												</TableCell>
												<TableCell className="text-center">
													<Currency amount={Number(item.totalPaid)} />
												</TableCell>
												<TableCell className="text-end font-medium text-green-600 dark:text-green-400">
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
								<div className="flex items-center justify-center py-20">
									<div className="relative">
										<div className="w-10 h-10 border-4 border-primary/20 rounded-full" />
										<div className="absolute top-0 left-0 w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
									</div>
								</div>
							) : !revenueByClient || revenueByClient.length === 0 ? (
								<div className="text-center py-10 text-slate-500">
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
										{revenueByClient.map((item, index) => (
											<TableRow key={item.client?.id || index}>
												<TableCell className="text-slate-400">
													{index + 1}
												</TableCell>
												<TableCell className="font-medium">
													{item.client?.name || t("finance.reports.unknown")}
												</TableCell>
												<TableCell className="text-center">
													{item.invoiceCount}
												</TableCell>
												<TableCell className="text-end font-medium text-green-600 dark:text-green-400">
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
									<div className="flex items-center justify-center py-10">
										<div className="relative">
											<div className="w-10 h-10 border-4 border-primary/20 rounded-full" />
											<div className="absolute top-0 left-0 w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
										</div>
									</div>
								) : !quotationStats || quotationStats.length === 0 ? (
									<div className="text-center py-10 text-slate-500">
										{t("finance.reports.noData")}
									</div>
								) : (
									<div className="space-y-3">
										{quotationStats.map((stat) => (
											<div
												key={stat.status}
												className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
											>
												<div className="flex items-center gap-3">
													<StatusIndicator status={stat.status} type="quotation" />
													<span className="text-slate-700 dark:text-slate-300">
														{t(`finance.quotations.status.${stat.status.toLowerCase()}`)}
													</span>
												</div>
												<div className="flex items-center gap-4">
													<span className="text-sm text-slate-500">
														<Currency amount={Number(stat.totalValue ?? 0)} />
													</span>
													<span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-lg">
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
									<div className="flex items-center justify-center py-10">
										<div className="relative">
											<div className="w-10 h-10 border-4 border-primary/20 rounded-full" />
											<div className="absolute top-0 left-0 w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
										</div>
									</div>
								) : !invoiceStats || invoiceStats.length === 0 ? (
									<div className="text-center py-10 text-slate-500">
										{t("finance.reports.noData")}
									</div>
								) : (
									<div className="space-y-3">
										{invoiceStats.map((stat) => (
											<div
												key={stat.status}
												className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"
											>
												<div className="flex items-center gap-3">
													<StatusIndicator status={stat.status} type="invoice" />
													<span className="text-slate-700 dark:text-slate-300">
														{t(`finance.invoices.status.${stat.status.toLowerCase()}`)}
													</span>
												</div>
												<div className="flex items-center gap-4">
													<span className="text-sm text-slate-500">
														<Currency amount={Number(stat.totalValue ?? 0)} />
													</span>
													<span className="font-bold text-slate-900 dark:text-slate-100 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-lg">
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
		DRAFT: "bg-slate-400",
		SENT: "bg-blue-500",
		VIEWED: "bg-purple-500",
		ACCEPTED: "bg-green-500",
		REJECTED: "bg-red-500",
		EXPIRED: "bg-amber-500",
		CONVERTED: "bg-teal-500",
		// Invoice statuses
		PARTIALLY_PAID: "bg-amber-500",
		PAID: "bg-green-500",
		OVERDUE: "bg-red-500",
		CANCELLED: "bg-slate-400",
	};

	return <div className={`w-3 h-3 rounded-full ${colors[status] || "bg-slate-400"}`} />;
}
