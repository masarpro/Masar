"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import {
	Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ui/components/table";
import { Button } from "@ui/components/button";
import { Printer } from "lucide-react";
import { formatDate } from "@shared/lib/formatters";
import { Currency } from "../shared/Currency";
import { ListTableSkeleton } from "@saas/shared/components/skeletons";

interface LedgerEntry {
	date: Date;
	entryNo: string;
	entryId: string;
	description: string;
	referenceType: string | null;
	referenceNo: string | null;
	debit: number;
	credit: number;
	runningBalance: number;
}

interface AccountStatementViewProps {
	title: string;
	subtitle?: string;
	headerInfo?: React.ReactNode;
	openingBalance: number;
	entries: LedgerEntry[];
	closingBalance: number;
	totalDebit: number;
	totalCredit: number;
	isLoading: boolean;
}

const REFERENCE_TYPE_KEYS: Record<string, string> = {
	INVOICE: "accountStatement.referenceTypes.INVOICE",
	INVOICE_PAYMENT: "accountStatement.referenceTypes.INVOICE_PAYMENT",
	ORG_PAYMENT: "accountStatement.referenceTypes.PAYMENT_RECEIVED",
	EXPENSE: "accountStatement.referenceTypes.EXPENSE",
	SUBCONTRACT_PAYMENT: "accountStatement.referenceTypes.SUBCONTRACT_PAYMENT",
	SUBCONTRACT_CLAIM_APPROVED: "accountStatement.referenceTypes.SUBCONTRACT_CLAIM",
	PROJECT_PAYMENT: "accountStatement.referenceTypes.PROJECT_PAYMENT",
	PROJECT_CLAIM_APPROVED: "accountStatement.referenceTypes.PROJECT_PAYMENT",
	RECEIPT_VOUCHER: "accountStatement.referenceTypes.RECEIPT_VOUCHER",
	PAYMENT_VOUCHER: "accountStatement.referenceTypes.PAYMENT_VOUCHER",
	HANDOVER_RETENTION_RELEASE: "accountStatement.referenceTypes.HANDOVER_RETENTION_RELEASE",
	TRANSFER: "accountStatement.referenceTypes.TRANSFER",
	PAYROLL: "accountStatement.referenceTypes.PAYROLL",
	CREDIT_NOTE: "accountStatement.referenceTypes.INVOICE",
};

export function AccountStatementView({
	title,
	subtitle,
	headerInfo,
	openingBalance,
	entries,
	closingBalance,
	totalDebit,
	totalCredit,
	isLoading,
}: AccountStatementViewProps) {
	const t = useTranslations();

	if (isLoading) return <ListTableSkeleton rows={10} cols={6} />;

	return (
		<div className="space-y-4 print:space-y-2">
			{/* Header */}
			<div className="flex items-center justify-between print:hidden">
				<div>
					<h1 className="text-2xl font-bold">{title}</h1>
					{subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
				</div>
				<Button variant="outline" onClick={() => window.print()}>
					<Printer className="me-2 h-4 w-4" />
					{t("accountStatement.print")}
				</Button>
			</div>

			{/* Print header */}
			<div className="hidden print:block text-center mb-4">
				<h1 className="text-xl font-bold">{title}</h1>
				{subtitle && <p className="text-sm">{subtitle}</p>}
			</div>

			{/* Optional header info */}
			{headerInfo}

			{/* Summary Cards */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4 print:grid-cols-4">
				<Card className="print:shadow-none print:border">
					<CardContent className="pt-4">
						<div className="text-sm text-muted-foreground">{t("accountStatement.openingBalance")}</div>
						<div className={`mt-1 text-xl font-bold ${openingBalance < 0 ? "text-red-600" : ""}`}>
							<Currency amount={openingBalance} />
						</div>
					</CardContent>
				</Card>
				<Card className="print:shadow-none print:border">
					<CardContent className="pt-4">
						<div className="text-sm text-muted-foreground">{t("accountStatement.totalDebit")}</div>
						<div className="mt-1 text-xl font-bold"><Currency amount={totalDebit} /></div>
					</CardContent>
				</Card>
				<Card className="print:shadow-none print:border">
					<CardContent className="pt-4">
						<div className="text-sm text-muted-foreground">{t("accountStatement.totalCredit")}</div>
						<div className="mt-1 text-xl font-bold"><Currency amount={totalCredit} /></div>
					</CardContent>
				</Card>
				<Card className="print:shadow-none print:border">
					<CardContent className="pt-4">
						<div className="text-sm text-muted-foreground">{t("accountStatement.closingBalance")}</div>
						<div className={`mt-1 text-xl font-bold ${closingBalance < 0 ? "text-red-600" : "text-green-600"}`}>
							<Currency amount={closingBalance} />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Transactions Table */}
			<Card className="print:shadow-none print:border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{t("accountStatement.date")}</TableHead>
							<TableHead>{t("accountStatement.reference")}</TableHead>
							<TableHead>{t("accountStatement.referenceType")}</TableHead>
							<TableHead>{t("accountStatement.description")}</TableHead>
							<TableHead className="text-end">{t("accountStatement.debit")}</TableHead>
							<TableHead className="text-end">{t("accountStatement.credit")}</TableHead>
							<TableHead className="text-end">{t("accountStatement.balance")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{/* Opening balance row */}
						<TableRow className="bg-muted/50">
							<TableCell colSpan={6} className="font-medium">{t("accountStatement.openingBalance")}</TableCell>
							<TableCell className={`text-end font-medium ${openingBalance < 0 ? "text-red-600" : ""}`}>
								<Currency amount={openingBalance} />
							</TableCell>
						</TableRow>

						{entries.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
									{t("accountStatement.noTransactions")}
								</TableCell>
							</TableRow>
						) : (
							entries.map((entry, idx) => (
								<TableRow key={`${entry.entryId}-${idx}`}>
									<TableCell>{formatDate(entry.date)}</TableCell>
									<TableCell className="font-mono text-sm">{entry.referenceNo ?? entry.entryNo}</TableCell>
									<TableCell className="text-sm">
										{entry.referenceType ? t(REFERENCE_TYPE_KEYS[entry.referenceType] ?? "accountStatement.referenceTypes.MANUAL") : "-"}
									</TableCell>
									<TableCell className="max-w-[200px] truncate">{entry.description}</TableCell>
									<TableCell className="text-end">{entry.debit > 0 ? <Currency amount={entry.debit} /> : "-"}</TableCell>
									<TableCell className="text-end">{entry.credit > 0 ? <Currency amount={entry.credit} /> : "-"}</TableCell>
									<TableCell className={`text-end font-medium ${entry.runningBalance < 0 ? "text-red-600" : ""}`}>
										<Currency amount={entry.runningBalance} />
									</TableCell>
								</TableRow>
							))
						)}

						{/* Closing balance row */}
						<TableRow className="bg-muted/50 font-bold">
							<TableCell colSpan={4}>{t("accountStatement.closingBalance")}</TableCell>
							<TableCell className="text-end"><Currency amount={totalDebit} /></TableCell>
							<TableCell className="text-end"><Currency amount={totalCredit} /></TableCell>
							<TableCell className={`text-end ${closingBalance < 0 ? "text-red-600" : "text-green-600"}`}>
								<Currency amount={closingBalance} />
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</Card>

			<div className="text-sm text-muted-foreground print:hidden">
				{t("accountStatement.transactionCount")}: {entries.length}
			</div>
		</div>
	);
}
