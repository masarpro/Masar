"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import { Badge } from "@ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Printer, ChevronDown, ChevronLeft } from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { formatAccounting } from "./formatters";
import { ReportPrintHeader } from "../shared/ReportPrintHeader";

interface Props {
	organizationId: string;
	organizationSlug: string;
}

export function CostCenterReport({ organizationId }: Props) {
	const t = useTranslations();
	const now = new Date();
	const [dateFrom, setDateFrom] = useState(new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]);
	const [dateTo, setDateTo] = useState(now.toISOString().split("T")[0]);
	const [expandedProjects, setExpandedProjects] = useState<Set<string | null>>(new Set());

	const { data, isLoading } = useQuery(
		orpc.accounting.reports.costCenter.queryOptions({
			input: {
				organizationId,
				dateFrom: new Date(dateFrom).toISOString(),
				dateTo: new Date(dateTo).toISOString(),
			},
		}),
	);

	const toggleExpand = (projectId: string | null) => {
		setExpandedProjects((prev) => {
			const next = new Set(prev);
			if (next.has(projectId)) next.delete(projectId);
			else next.add(projectId);
			return next;
		});
	};

	if (isLoading) return <DashboardSkeleton />;

	const projects = data?.projects ?? [];
	const totals = data?.totals ?? { totalRevenue: 0, totalExpenses: 0, netProfit: 0 };

	return (
		<div className="space-y-4">
			<ReportPrintHeader reportTitle={t("finance.accountingReports.costCenter")} dateRange={`${dateFrom} — ${dateTo}`} />

			{/* Filters */}
			<div className="flex flex-wrap items-end gap-3 print:hidden">
				<div>
					<Label className="text-xs">{t("finance.accounting.ledger.dateFrom")}</Label>
					<Input type="date" value={dateFrom} onChange={(e: any) => setDateFrom(e.target.value)} className="rounded-xl h-9 w-40" />
				</div>
				<div>
					<Label className="text-xs">{t("finance.accounting.ledger.dateTo")}</Label>
					<Input type="date" value={dateTo} onChange={(e: any) => setDateTo(e.target.value)} className="rounded-xl h-9 w-40" />
				</div>
				<Button variant="outline" size="sm" className="rounded-xl ms-auto" onClick={() => window.print()}>
					<Printer className="h-4 w-4 me-1" />
					{t("common.print")}
				</Button>
			</div>

			{/* Totals */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card className="rounded-2xl bg-green-50 dark:bg-green-950/20 border-green-200">
					<CardContent className="p-4 text-center">
						<p className="text-xs text-green-600">{t("finance.accounting.incomeStatement.totalRevenue")}</p>
						<p className="text-xl font-bold text-green-700">{formatAccounting(totals.totalRevenue)}</p>
					</CardContent>
				</Card>
				<Card className="rounded-2xl bg-red-50 dark:bg-red-950/20 border-red-200">
					<CardContent className="p-4 text-center">
						<p className="text-xs text-red-600">{t("finance.accounting.expenses")}</p>
						<p className="text-xl font-bold text-red-700">{formatAccounting(totals.totalExpenses)}</p>
					</CardContent>
				</Card>
				<Card className="rounded-2xl bg-blue-50 dark:bg-blue-950/20 border-blue-200">
					<CardContent className="p-4 text-center">
						<p className="text-xs text-blue-600">{t("finance.accounting.incomeStatement.netProfit")}</p>
						<p className="text-xl font-bold text-blue-700">{formatAccounting(totals.netProfit)}</p>
					</CardContent>
				</Card>
			</div>

			{/* Projects Table */}
			<Card className="rounded-2xl">
				<CardContent className="p-0">
					{projects.length === 0 ? (
						<div className="text-center py-12 text-slate-500">
							{t("finance.accounting.noEntries")}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-8" />
									<TableHead>{t("finance.accountingReports.costCenter")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.incomeStatement.revenue")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.expenses")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.incomeStatement.netProfit")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.incomeStatement.netProfitMargin")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{projects.map((project: any) => {
									const isExpanded = expandedProjects.has(project.projectId);
									const marginColor = project.profitMargin >= 20 ? "text-green-600" : project.profitMargin >= 0 ? "text-amber-600" : "text-red-600";
									return (
										<>
											<TableRow
												key={project.projectId ?? "unassigned"}
												className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium"
												onClick={() => toggleExpand(project.projectId)}
											>
												<TableCell>
													{isExpanded ? (
														<ChevronDown className="h-4 w-4 text-slate-400" />
													) : (
														<ChevronLeft className="h-4 w-4 text-slate-400" />
													)}
												</TableCell>
												<TableCell>{project.projectName}</TableCell>
												<TableCell className="text-end text-green-600">{formatAccounting(project.totalRevenue)}</TableCell>
												<TableCell className="text-end text-red-600">{formatAccounting(project.totalExpenses)}</TableCell>
												<TableCell className="text-end font-bold">{formatAccounting(project.netProfit)}</TableCell>
												<TableCell className={`text-end ${marginColor}`}>
													{project.profitMargin.toFixed(1)}%
												</TableCell>
											</TableRow>
											{isExpanded && project.accounts.map((acc: any) => (
												<TableRow key={`${project.projectId}-${acc.code}`} className="bg-slate-50/50 dark:bg-slate-800/30">
													<TableCell />
													<TableCell className="ps-8 text-sm">
														<span className="text-slate-400 font-mono me-2">{acc.code}</span>
														{acc.nameAr}
														<Badge variant="outline" className="ms-2 text-[9px]">
															{acc.type === "REVENUE" ? t("finance.accounting.revenue") : t("finance.accounting.expenses")}
														</Badge>
													</TableCell>
													<TableCell className="text-end text-sm">{acc.type === "REVENUE" ? formatAccounting(acc.amount) : "—"}</TableCell>
													<TableCell className="text-end text-sm">{acc.type === "EXPENSE" ? formatAccounting(acc.amount) : "—"}</TableCell>
													<TableCell />
													<TableCell />
												</TableRow>
											))}
										</>
									);
								})}
								{/* Grand Total */}
								<TableRow className="border-t-2 font-bold bg-slate-100 dark:bg-slate-800">
									<TableCell />
									<TableCell>{t("finance.accounting.aging.total")}</TableCell>
									<TableCell className="text-end text-green-700">{formatAccounting(totals.totalRevenue)}</TableCell>
									<TableCell className="text-end text-red-700">{formatAccounting(totals.totalExpenses)}</TableCell>
									<TableCell className="text-end">{formatAccounting(totals.netProfit)}</TableCell>
									<TableCell className="text-end">
										{totals.totalRevenue > 0 ? ((totals.netProfit / totals.totalRevenue) * 100).toFixed(1) : "0.0"}%
									</TableCell>
								</TableRow>
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
