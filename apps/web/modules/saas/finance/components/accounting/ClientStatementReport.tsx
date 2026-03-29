"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { ArrowLeft, Printer } from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { formatAccounting } from "./formatters";
import { useRouter } from "next/navigation";

interface ClientStatementReportProps {
	organizationId: string;
	organizationSlug: string;
	clientId: string;
}

export function ClientStatementReport({
	organizationId,
	organizationSlug,
	clientId,
}: ClientStatementReportProps) {
	const t = useTranslations();
	const router = useRouter();

	const now = new Date();
	const defaultFrom = new Date(now.getFullYear(), 0, 1);
	const [dateFrom, setDateFrom] = useState(defaultFrom.toISOString().split("T")[0]);
	const [dateTo, setDateTo] = useState(now.toISOString().split("T")[0]);

	const { data, isLoading } = useQuery(
		orpc.accounting.statements.client.queryOptions({
			input: {
				organizationId,
				clientId,
				dateFrom: new Date(dateFrom).toISOString(),
				dateTo: new Date(dateTo).toISOString(),
			},
		}),
	);

	if (isLoading) return <DashboardSkeleton />;

	const client = data?.client;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
				<div className="flex items-center gap-3">
					<Button variant="outline" size="sm" className="rounded-xl" onClick={() => router.back()}>
						<ArrowLeft className="h-4 w-4 me-1" />
						{t("common.back")}
					</Button>
					<h2 className="text-lg font-bold">{t("finance.accounting.statement.clientStatement")}</h2>
				</div>
				<div className="flex items-center gap-2">
					<Input
						type="date"
						value={dateFrom}
						onChange={(e) => setDateFrom(e.target.value)}
						className="rounded-xl w-40"
					/>
					<span className="text-slate-400">—</span>
					<Input
						type="date"
						value={dateTo}
						onChange={(e) => setDateTo(e.target.value)}
						className="rounded-xl w-40"
					/>
					<Button variant="outline" size="sm" className="rounded-xl" onClick={() => window.print()}>
						<Printer className="h-4 w-4 me-1" />
						{t("finance.accounting.statement.printStatement")}
					</Button>
				</div>
			</div>

			{/* Print Header */}
			<div className="hidden print:block text-center mb-6">
				<h1 className="text-xl font-bold">{t("finance.accounting.statement.clientStatement")}</h1>
				{client && (
					<div className="mt-2">
						<p className="text-lg font-semibold">{client.name}</p>
						{client.businessName && <p className="text-sm">{client.businessName}</p>}
						{client.taxNumber && <p className="text-sm">{t("finance.clients.taxNumber")}: {client.taxNumber}</p>}
					</div>
				)}
				<p className="text-sm text-slate-500 mt-2">{dateFrom} — {dateTo}</p>
			</div>

			{/* Client Info Card */}
			{client && (
				<Card className="rounded-2xl print:hidden">
					<CardContent className="p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-semibold">{client.name}</p>
								{client.businessName && <p className="text-sm text-slate-500">{client.businessName}</p>}
							</div>
							{client.taxNumber && (
								<p className="text-sm text-slate-500">{t("finance.clients.taxNumber")}: {client.taxNumber}</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Statement Table */}
			<Card className="rounded-2xl print:rounded-none print:shadow-none print:border">
				<CardContent className="p-0">
					{(data?.lines.length ?? 0) === 0 ? (
						<div className="text-center py-12 text-slate-500">
							{t("finance.accounting.statement.noTransactions")}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("finance.accounting.entryDate")}</TableHead>
									<TableHead>{t("finance.accounting.statement.reference")}</TableHead>
									<TableHead>{t("finance.accounting.description")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.debit")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.credit")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.balance")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{/* Opening Balance */}
								<TableRow className="bg-slate-50 dark:bg-slate-800/50 font-medium">
									<TableCell colSpan={3}>{t("finance.accounting.statement.openingBalance")}</TableCell>
									<TableCell className="text-end">—</TableCell>
									<TableCell className="text-end">—</TableCell>
									<TableCell className="text-end font-bold">
										{formatAccounting(data?.openingBalance ?? 0)}
									</TableCell>
								</TableRow>

								{data?.lines.map((line, idx) => (
									<TableRow key={idx}>
										<TableCell className="text-sm text-slate-500">
											{new Date(line.date).toLocaleDateString("en-SA")}
										</TableCell>
										<TableCell className="text-sm font-mono">{line.referenceNo}</TableCell>
										<TableCell className="text-sm">{line.description}</TableCell>
										<TableCell className="text-end">
											{line.debit > 0 ? formatAccounting(line.debit) : "—"}
										</TableCell>
										<TableCell className="text-end">
											{line.credit > 0 ? formatAccounting(line.credit) : "—"}
										</TableCell>
										<TableCell className="text-end font-medium">
											{formatAccounting(line.runningBalance)}
										</TableCell>
									</TableRow>
								))}

								{/* Closing Balance */}
								<TableRow className="bg-slate-50 dark:bg-slate-800/50 font-medium border-t-2">
									<TableCell colSpan={3}>
										{t("finance.accounting.statement.balanceDue")}
									</TableCell>
									<TableCell className="text-end font-bold">
										{formatAccounting(data?.totalDebit ?? 0)}
									</TableCell>
									<TableCell className="text-end font-bold">
										{formatAccounting(data?.totalCredit ?? 0)}
									</TableCell>
									<TableCell className="text-end font-bold text-primary">
										{formatAccounting(data?.closingBalance ?? 0)}
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
