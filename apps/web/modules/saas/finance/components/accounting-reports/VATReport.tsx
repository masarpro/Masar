"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import {
	ArrowDownCircle,
	ArrowUpCircle,
	FileText,
	Minus,
} from "lucide-react";
import { Currency } from "../shared/Currency";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";

interface VATReportProps {
	organizationId: string;
	organizationSlug: string;
}

export function VATReport({ organizationId }: VATReportProps) {
	const t = useTranslations();
	const now = new Date();
	const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
	const currentYear = now.getFullYear();

	const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
	const [selectedYear, setSelectedYear] = useState(currentYear);

	const { dateFrom, dateTo } = useMemo(() => {
		const startMonth = (selectedQuarter - 1) * 3;
		return {
			dateFrom: new Date(selectedYear, startMonth, 1),
			dateTo: new Date(selectedYear, startMonth + 3, 0, 23, 59, 59),
		};
	}, [selectedQuarter, selectedYear]);

	const { data, isLoading } = useQuery(
		orpc.finance.accountingReports.vatReport.queryOptions({
			input: {
				organizationId,
				dateFrom: dateFrom.toISOString(),
				dateTo: dateTo.toISOString(),
				quarter: selectedQuarter,
				year: selectedYear,
			},
		}),
	);

	if (isLoading) return <DashboardSkeleton />;

	const years = [currentYear - 1, currentYear, currentYear + 1];

	return (
		<div className="space-y-6">
			{/* Period Selector */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
					{[1, 2, 3, 4].map((q) => (
						<Button
							key={q}
							variant={selectedQuarter === q ? "default" : "ghost"}
							size="sm"
							className="rounded-lg"
							onClick={() => setSelectedQuarter(q)}
						>
							Q{q}
						</Button>
					))}
				</div>
				<div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
					{years.map((y) => (
						<Button
							key={y}
							variant={selectedYear === y ? "default" : "ghost"}
							size="sm"
							className="rounded-lg"
							onClick={() => setSelectedYear(y)}
						>
							{y}
						</Button>
					))}
				</div>
			</div>

			{/* KPI Cards */}
			{data && (
				<>
					<div className="grid gap-4 sm:grid-cols-3">
						<Card className="rounded-2xl">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{t("finance.accountingReports.vat.outputVat")}
										</p>
										<p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
											<Currency
												amount={
													data.outputVAT.total
														.vatAmount
												}
											/>
										</p>
									</div>
									<div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
										<ArrowUpCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-2xl">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{t("finance.accountingReports.vat.inputVat")}
										</p>
										<p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
											<Currency
												amount={
													data.inputVAT.total
														.vatAmount
												}
											/>
										</p>
									</div>
									<div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
										<ArrowDownCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="rounded-2xl">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-slate-500 dark:text-slate-400">
											{t("finance.accountingReports.vat.netVat")}
										</p>
										<p
											className={`text-2xl font-bold mt-1 ${
												data.isPayable
													? "text-red-600 dark:text-red-400"
													: "text-blue-600 dark:text-blue-400"
											}`}
										>
											<Currency amount={Math.abs(data.netVAT)} />
										</p>
										<p className="text-xs text-slate-400 mt-1">
											{data.isPayable
												? t("finance.accountingReports.vat.payable")
												: t("finance.accountingReports.vat.refundable")}
										</p>
									</div>
									<div
										className={`p-3 rounded-xl ${
											data.isPayable
												? "bg-red-100 dark:bg-red-900/30"
												: "bg-blue-100 dark:bg-blue-900/30"
										}`}
									>
										<Minus
											className={`h-6 w-6 ${
												data.isPayable
													? "text-red-600 dark:text-red-400"
													: "text-blue-600 dark:text-blue-400"
											}`}
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* VAT Statement */}
					<Card className="rounded-2xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<FileText className="h-5 w-5" />
								{t("finance.accountingReports.vat.statement")} — Q
								{selectedQuarter} {selectedYear}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								{/* Output VAT Section */}
								<div>
									<h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
										{t("finance.accountingReports.vat.outputVat")}
									</h3>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>
													{t("finance.accountingReports.vat.type")}
												</TableHead>
												<TableHead className="text-center">
													{t("finance.accountingReports.vat.count")}
												</TableHead>
												<TableHead className="text-end">
													{t("finance.accountingReports.vat.taxableAmount")}
												</TableHead>
												<TableHead className="text-end">
													{t("finance.accountingReports.vat.vatAmount")}
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											<VATRow
												label={t("finance.accountingReports.vat.taxInvoices")}
												count={data.outputVAT.taxInvoices.count}
												taxable={data.outputVAT.taxInvoices.taxableAmount}
												vat={data.outputVAT.taxInvoices.vatAmount}
											/>
											<VATRow
												label={t("finance.accountingReports.vat.simplifiedInvoices")}
												count={data.outputVAT.simplifiedInvoices.count}
												taxable={data.outputVAT.simplifiedInvoices.taxableAmount}
												vat={data.outputVAT.simplifiedInvoices.vatAmount}
											/>
											<VATRow
												label={t("finance.accountingReports.vat.standardInvoices")}
												count={data.outputVAT.standardInvoices.count}
												taxable={data.outputVAT.standardInvoices.taxableAmount}
												vat={data.outputVAT.standardInvoices.vatAmount}
											/>
											<VATRow
												label={t("finance.accountingReports.vat.creditNotes")}
												count={data.outputVAT.creditNotes.count}
												taxable={data.outputVAT.creditNotes.taxableAmount}
												vat={data.outputVAT.creditNotes.vatAmount}
												isNegative
											/>
											<TableRow className="border-t-2 font-bold bg-green-50 dark:bg-green-950/20">
												<TableCell>
													{t("finance.accountingReports.vat.totalOutput")}
												</TableCell>
												<TableCell />
												<TableCell className="text-end">
													<Currency
														amount={
															data.outputVAT.total
																.taxableAmount
														}
													/>
												</TableCell>
												<TableCell className="text-end text-green-600 dark:text-green-400">
													<Currency
														amount={
															data.outputVAT.total
																.vatAmount
														}
													/>
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</div>

								{/* Input VAT Section */}
								<div>
									<h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
										{t("finance.accountingReports.vat.inputVat")}
									</h3>
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>
													{t("finance.accountingReports.vat.type")}
												</TableHead>
												<TableHead className="text-center">
													{t("finance.accountingReports.vat.count")}
												</TableHead>
												<TableHead className="text-end">
													{t("finance.accountingReports.vat.taxableAmount")}
												</TableHead>
												<TableHead className="text-end">
													{t("finance.accountingReports.vat.vatAmount")}
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											<VATRow
												label={t("finance.accountingReports.vat.expenses")}
												count={data.inputVAT.expenses.count}
												taxable={data.inputVAT.expenses.taxableAmount}
												vat={data.inputVAT.expenses.vatAmount}
											/>
											<VATRow
												label={t("finance.accountingReports.vat.subcontractors")}
												count={data.inputVAT.subcontractors.count}
												taxable={data.inputVAT.subcontractors.taxableAmount}
												vat={data.inputVAT.subcontractors.vatAmount}
											/>
											<TableRow className="border-t-2 font-bold bg-red-50 dark:bg-red-950/20">
												<TableCell>
													{t("finance.accountingReports.vat.totalInput")}
												</TableCell>
												<TableCell />
												<TableCell className="text-end">
													<Currency
														amount={
															data.inputVAT.total
																.taxableAmount
														}
													/>
												</TableCell>
												<TableCell className="text-end text-red-600 dark:text-red-400">
													<Currency
														amount={
															data.inputVAT.total
																.vatAmount
														}
													/>
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</div>

								{/* Net VAT */}
								<div
									className={`p-4 rounded-xl border-2 ${
										data.isPayable
											? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20"
											: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20"
									}`}
								>
									<div className="flex items-center justify-between">
										<span className="text-lg font-bold text-slate-900 dark:text-slate-100">
											{t("finance.accountingReports.vat.netVat")}
										</span>
										<span
											className={`text-2xl font-bold ${
												data.isPayable
													? "text-red-600 dark:text-red-400"
													: "text-blue-600 dark:text-blue-400"
											}`}
										>
											<Currency amount={Math.abs(data.netVAT)} />{" "}
											{t("finance.accountingReports.sar")}
										</span>
									</div>
									<p className="text-sm text-slate-500 mt-1">
										{data.isPayable
											? t("finance.accountingReports.vat.payableNote")
											: t("finance.accountingReports.vat.refundableNote")}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}

function VATRow({
	label,
	count,
	taxable,
	vat,
	isNegative,
}: {
	label: string;
	count: number;
	taxable: number;
	vat: number;
	isNegative?: boolean;
}) {
	if (count === 0) {
		return (
			<TableRow>
				<TableCell className="text-slate-500">{label}</TableCell>
				<TableCell className="text-center text-slate-300">0</TableCell>
				<TableCell className="text-end text-slate-300">-</TableCell>
				<TableCell className="text-end text-slate-300">-</TableCell>
			</TableRow>
		);
	}

	return (
		<TableRow>
			<TableCell className={isNegative ? "text-red-500" : ""}>{label}</TableCell>
			<TableCell className="text-center">{count}</TableCell>
			<TableCell className={`text-end ${isNegative ? "text-red-500" : ""}`}>
				{isNegative && taxable !== 0 ? "(" : ""}
				<Currency amount={Math.abs(taxable)} />
				{isNegative && taxable !== 0 ? ")" : ""}
			</TableCell>
			<TableCell className={`text-end ${isNegative ? "text-red-500" : ""}`}>
				{isNegative && vat !== 0 ? "(" : ""}
				<Currency amount={Math.abs(vat)} />
				{isNegative && vat !== 0 ? ")" : ""}
			</TableCell>
		</TableRow>
	);
}
