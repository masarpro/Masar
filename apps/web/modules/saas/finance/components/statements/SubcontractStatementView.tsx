"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Button } from "@ui/components/button";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Currency } from "../shared/Currency";
import { AccountStatementView } from "./AccountStatementView";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface SubcontractStatementViewProps {
	organizationId: string;
	organizationSlug: string;
	projectId: string;
	contractId: string;
}

export function SubcontractStatementView({
	organizationId,
	organizationSlug,
	projectId,
	contractId,
}: SubcontractStatementViewProps) {
	const t = useTranslations();
	const router = useRouter();

	// Default date range: current year
	const now = new Date();
	const [dateFrom, setDateFrom] = useState(
		new Date(now.getFullYear(), 0, 1).toISOString(),
	);
	const [dateTo, setDateTo] = useState(now.toISOString());

	const { data, isLoading } = useQuery(
		orpc.accounting.statements.subcontract.queryOptions({
			input: {
				organizationId,
				contractId,
				dateFrom,
				dateTo,
			},
		}),
	);

	if (isLoading) return <ListTableSkeleton rows={10} cols={6} />;

	const basePath = `/app/${organizationSlug}/projects/${projectId}/finance/subcontracts/${contractId}`;

	return (
		<div className="space-y-4">
			{/* Back button */}
			<div className="flex items-center gap-3 print:hidden">
				<Button variant="ghost" size="icon" onClick={() => router.push(basePath)}>
					<ArrowRight className="h-4 w-4" />
				</Button>
				<h1 className="text-2xl font-bold">{t("accountStatement.subcontractStatement")}</h1>
			</div>

			{/* Date filters */}
			<div className="flex gap-3 print:hidden">
				<div>
					<label className="text-sm text-muted-foreground">{t("accountStatement.dateFrom")}</label>
					<Input
						type="date"
						value={dateFrom.split("T")[0]}
						onChange={(e) => setDateFrom(new Date(e.target.value).toISOString())}
					/>
				</div>
				<div>
					<label className="text-sm text-muted-foreground">{t("accountStatement.dateTo")}</label>
					<Input
						type="date"
						value={dateTo.split("T")[0]}
						onChange={(e) => setDateTo(new Date(e.target.value).toISOString())}
					/>
				</div>
			</div>

			{data && (
				<AccountStatementView
					title={t("accountStatement.subcontractStatement")}
					subtitle={`${data.contract.name} — ${data.contract.contractNo ?? ""}`}
					headerInfo={
						<div className="grid grid-cols-2 gap-4 md:grid-cols-5 print:grid-cols-5">
							<Card className="print:shadow-none print:border">
								<CardContent className="pt-4">
									<div className="text-xs text-muted-foreground">{t("accountStatement.contractSummary.contractValue")}</div>
									<div className="mt-1 text-lg font-bold"><Currency amount={data.summary.totalContractValue} /></div>
								</CardContent>
							</Card>
							<Card className="print:shadow-none print:border">
								<CardContent className="pt-4">
									<div className="text-xs text-muted-foreground">{t("accountStatement.contractSummary.totalClaimed")}</div>
									<div className="mt-1 text-lg font-bold"><Currency amount={data.summary.totalClaimed} /></div>
								</CardContent>
							</Card>
							<Card className="print:shadow-none print:border">
								<CardContent className="pt-4">
									<div className="text-xs text-muted-foreground">{t("accountStatement.contractSummary.totalPaid")}</div>
									<div className="mt-1 text-lg font-bold"><Currency amount={data.summary.totalPaid} /></div>
								</CardContent>
							</Card>
							<Card className="print:shadow-none print:border">
								<CardContent className="pt-4">
									<div className="text-xs text-muted-foreground">{t("accountStatement.contractSummary.remainingBalance")}</div>
									<div className="mt-1 text-lg font-bold"><Currency amount={data.summary.remainingBalance} /></div>
								</CardContent>
							</Card>
							<Card className="print:shadow-none print:border">
								<CardContent className="pt-4">
									<div className="text-xs text-muted-foreground">{t("accountStatement.contractSummary.retentionHeld")}</div>
									<div className="mt-1 text-lg font-bold"><Currency amount={data.summary.retentionHeld} /></div>
								</CardContent>
							</Card>
						</div>
					}
					openingBalance={data.vendorStatement.openingBalance}
					entries={data.vendorStatement.lines.map((l, idx) => ({
						date: l.date,
						entryNo: l.referenceNo,
						entryId: `line-${idx}`,
						description: l.description,
						referenceType: null,
						referenceNo: l.referenceNo,
						debit: l.debit,
						credit: l.credit,
						runningBalance: l.runningBalance,
					}))}
					closingBalance={data.vendorStatement.closingBalance}
					totalDebit={data.vendorStatement.totalDebit}
					totalCredit={data.vendorStatement.totalCredit}
					isLoading={false}
				/>
			)}
		</div>
	);
}
