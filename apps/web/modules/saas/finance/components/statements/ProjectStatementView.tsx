"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Button } from "@ui/components/button";
import {
	Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ui/components/table";
import { ArrowRight, Printer, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { Currency } from "../shared/Currency";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface ProjectStatementViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
}

export function ProjectStatementView({
	organizationId,
	organizationSlug,
	projectId,
}: ProjectStatementViewProps) {
	const t = useTranslations();
	const router = useRouter();

	const now = new Date();
	const [dateFrom, setDateFrom] = useState<string>("");
	const [dateTo, setDateTo] = useState<string>("");

	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance`;

	const { data, isLoading } = useQuery(
		orpc.accounting.statements.project.queryOptions({
			input: {
				organizationId,
				projectId,
				dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
				dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
			},
		}),
	);

	if (isLoading) return <ListTableSkeleton rows={10} cols={5} />;

	return (
		<div className="space-y-4 print:space-y-2">
			{/* Header */}
			<div className="flex items-center justify-between print:hidden">
				<div className="flex items-center gap-3">
					<Button variant="ghost" size="icon" onClick={() => router.push(basePath)}>
						<ArrowRight className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="text-2xl font-bold">{t("accountStatement.projectStatement")}</h1>
						{data && <p className="text-sm text-muted-foreground">{data.project.name}</p>}
					</div>
				</div>
				<Button variant="outline" onClick={() => window.print()}>
					<Printer className="me-2 h-4 w-4" />{t("accountStatement.print")}
				</Button>
			</div>

			{/* Print header */}
			<div className="hidden print:block text-center mb-4">
				<h1 className="text-xl font-bold">{t("accountStatement.projectStatement")}</h1>
				{data && <p className="text-sm">{data.project.name}</p>}
			</div>

			{/* Date filters */}
			<div className="flex gap-3 print:hidden">
				<div>
					<label className="text-sm text-muted-foreground">{t("accountStatement.dateFrom")}</label>
					<Input
						type="date"
						value={dateFrom}
						onChange={(e) => setDateFrom(e.target.value)}
					/>
				</div>
				<div>
					<label className="text-sm text-muted-foreground">{t("accountStatement.dateTo")}</label>
					<Input
						type="date"
						value={dateTo}
						onChange={(e) => setDateTo(e.target.value)}
					/>
				</div>
			</div>

			{data && (
				<>
					{/* Profitability Summary */}
					<div className="grid grid-cols-2 gap-4 md:grid-cols-4 print:grid-cols-4">
						<Card className="print:shadow-none print:border">
							<CardContent className="pt-4">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<TrendingUp className="h-4 w-4 text-green-600" />
									{t("accountStatement.projectSummary.revenue")}
								</div>
								<div className="mt-1 text-2xl font-bold text-green-600">
									<Currency amount={data.revenue.total} />
								</div>
							</CardContent>
						</Card>
						<Card className="print:shadow-none print:border">
							<CardContent className="pt-4">
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<TrendingDown className="h-4 w-4 text-red-600" />
									{t("accountStatement.projectSummary.costs")}
								</div>
								<div className="mt-1 text-2xl font-bold text-red-600">
									<Currency amount={data.costs.total} />
								</div>
							</CardContent>
						</Card>
						<Card className="print:shadow-none print:border">
							<CardContent className="pt-4">
								<div className="text-sm text-muted-foreground">{t("accountStatement.projectSummary.grossProfit")}</div>
								<div className={`mt-1 text-2xl font-bold ${data.profitability.grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
									<Currency amount={data.profitability.grossProfit} />
								</div>
							</CardContent>
						</Card>
						<Card className="print:shadow-none print:border">
							<CardContent className="pt-4">
								<div className="text-sm text-muted-foreground">{t("accountStatement.projectSummary.profitMargin")}</div>
								<div className={`mt-1 text-2xl font-bold ${data.profitability.profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
									{data.profitability.profitMargin}%
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Revenue Breakdown */}
					{data.revenue.breakdown.length > 0 && (
						<Card className="print:shadow-none print:border">
							<CardHeader><CardTitle>{t("accountStatement.projectSummary.revenue")}</CardTitle></CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>{t("accountStatement.description")}</TableHead>
											<TableHead className="text-end">{t("accountStatement.projectSummary.revenue")}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data.revenue.breakdown.map((item) => (
											<TableRow key={item.accountCode}>
												<TableCell>{item.accountName} ({item.accountCode})</TableCell>
												<TableCell className="text-end"><Currency amount={item.amount} /></TableCell>
											</TableRow>
										))}
										<TableRow className="font-bold bg-muted/50">
											<TableCell>{t("accountStatement.projectSummary.revenue")}</TableCell>
											<TableCell className="text-end"><Currency amount={data.revenue.total} /></TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					)}

					{/* Costs Breakdown */}
					{data.costs.breakdown.length > 0 && (
						<Card className="print:shadow-none print:border">
							<CardHeader><CardTitle>{t("accountStatement.projectSummary.costs")}</CardTitle></CardHeader>
							<CardContent>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>{t("accountStatement.description")}</TableHead>
											<TableHead className="text-end">{t("accountStatement.projectSummary.costs")}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data.costs.breakdown.map((item) => (
											<TableRow key={item.accountCode}>
												<TableCell>{item.accountName} ({item.accountCode})</TableCell>
												<TableCell className="text-end"><Currency amount={item.amount} /></TableCell>
											</TableRow>
										))}
										<TableRow className="font-bold bg-muted/50">
											<TableCell>{t("accountStatement.projectSummary.costs")}</TableCell>
											<TableCell className="text-end"><Currency amount={data.costs.total} /></TableCell>
										</TableRow>
									</TableBody>
								</Table>
							</CardContent>
						</Card>
					)}

					{/* Cash Flow */}
					<Card className="print:shadow-none print:border">
						<CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />{t("accountStatement.projectSummary.netCash")}</CardTitle></CardHeader>
						<CardContent>
							<div className="grid grid-cols-3 gap-4">
								<div>
									<div className="text-sm text-muted-foreground">{t("accountStatement.projectSummary.cashIn")}</div>
									<div className="mt-1 text-xl font-bold text-green-600"><Currency amount={data.cashFlow.totalIn} /></div>
								</div>
								<div>
									<div className="text-sm text-muted-foreground">{t("accountStatement.projectSummary.cashOut")}</div>
									<div className="mt-1 text-xl font-bold text-red-600"><Currency amount={data.cashFlow.totalOut} /></div>
								</div>
								<div>
									<div className="text-sm text-muted-foreground">{t("accountStatement.projectSummary.netCash")}</div>
									<div className={`mt-1 text-xl font-bold ${data.cashFlow.netCash >= 0 ? "text-green-600" : "text-red-600"}`}>
										<Currency amount={data.cashFlow.netCash} />
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
