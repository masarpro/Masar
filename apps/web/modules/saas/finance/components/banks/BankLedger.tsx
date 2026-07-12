"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import { Card, CardContent } from "@ui/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@ui/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Printer, Download, Search, FileText } from "lucide-react";
import { Currency } from "../shared/Currency";
import {
	exportBankLedgerToExcel,
	type BankLedgerLabels,
} from "../../lib/accounting-excel-export";

export const LEDGER_TYPES = [
	"PAYMENT",
	"INVOICE_PAYMENT",
	"PROJECT_PAYMENT",
	"CAPITAL_CONTRIBUTION",
	"TRANSFER_IN",
	"EXPENSE",
	"SUBCONTRACT_PAYMENT",
	"OWNER_DRAWING",
	"TRANSFER_OUT",
] as const;

type LedgerType = (typeof LEDGER_TYPES)[number];

interface LedgerEntry {
	id: string;
	type: LedgerType;
	direction: "IN" | "OUT";
	date: string | Date;
	amount: number;
	description: string;
	counterparty: string | null;
	referenceNo: string | null;
	sourceId: string;
	sourceLink: string | null;
	runningBalance: number;
}

export interface BankLedgerData {
	account: {
		id: string;
		name: string;
		accountType: "BANK" | "CASH_BOX";
		balance: number;
		openingBalance: number;
		currency: string;
	};
	entries: LedgerEntry[];
	periodOpeningBalance: number;
	closingBalance: number;
	totalCount: number;
	truncated: boolean;
	isFiltered: boolean;
	summary: {
		totalIn: number;
		totalOut: number;
		netChange: number;
		totalTransfersIn: number;
		totalTransfersOut: number;
		totalDepositsIn: number;
		totalExpensesOut: number;
		storedBalance: number;
		computedBalance: number;
		delta: number;
		isBalanced: boolean;
	};
}

interface BankLedgerProps {
	data: BankLedgerData | undefined;
	isLoading: boolean;
	basePath: string; // e.g. /app/{slug}
	orgName?: string;
	dateFrom: string;
	dateTo: string;
	onDateFromChange: (v: string) => void;
	onDateToChange: (v: string) => void;
}

// Color accent per movement type
const TYPE_BADGE: Record<LedgerType, string> = {
	PAYMENT: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
	INVOICE_PAYMENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
	PROJECT_PAYMENT: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
	CAPITAL_CONTRIBUTION: "bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4",
	TRANSFER_IN: "bg-chart-4/15 text-chart-4 dark:bg-chart-4/20 dark:text-chart-4",
	EXPENSE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
	SUBCONTRACT_PAYMENT: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
	OWNER_DRAWING: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
	TRANSFER_OUT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
};

export function BankLedger({
	data,
	isLoading,
	basePath,
	orgName,
	dateFrom,
	dateTo,
	onDateFromChange,
	onDateToChange,
}: BankLedgerProps) {
	const t = useTranslations();
	const [typeFilter, setTypeFilter] = useState<"ALL" | LedgerType>("ALL");
	const [search, setSearch] = useState("");

	const allEntries = data?.entries ?? [];

	// Client-side type + search filtering (running balance stays globally correct)
	const visible = useMemo(() => {
		const q = search.trim().toLowerCase();
		return allEntries.filter((e) => {
			if (typeFilter !== "ALL" && e.type !== typeFilter) return false;
			if (q) {
				const hay = `${e.description} ${e.counterparty ?? ""} ${e.referenceNo ?? ""}`.toLowerCase();
				if (!hay.includes(q)) return false;
			}
			return true;
		});
	}, [allEntries, typeFilter, search]);

	// Totals over the visible set
	const visibleTotals = useMemo(() => {
		let totalIn = 0;
		let totalOut = 0;
		for (const e of visible) {
			if (e.direction === "IN") totalIn += e.amount;
			else totalOut += e.amount;
		}
		return { totalIn, totalOut };
	}, [visible]);

	const openingBalance = data?.periodOpeningBalance ?? 0;
	const closingBalance =
		visible.length > 0 ? visible[visible.length - 1].runningBalance : openingBalance;

	const typeLabel = (type: LedgerType) => t(`finance.banks.ledger.types.${type}`);

	const handleExport = () => {
		if (!data) return;
		const typeNames: Record<string, string> = {};
		for (const tp of LEDGER_TYPES) typeNames[tp] = typeLabel(tp);
		const labels: BankLedgerLabels = {
			sheetName: t("finance.banks.ledger.title"),
			ledgerPrefix: t("finance.banks.ledger.title"),
			headers: [
				t("finance.banks.ledger.columns.date"),
				t("finance.banks.ledger.columns.type"),
				t("finance.banks.ledger.columns.description"),
				t("finance.banks.ledger.columns.counterparty"),
				t("finance.banks.ledger.columns.reference"),
				t("finance.banks.ledger.columns.in"),
				t("finance.banks.ledger.columns.out"),
				t("finance.banks.ledger.columns.balance"),
			],
			openingBalance: t("finance.banks.ledger.openingBalance"),
			closingBalance: t("finance.banks.ledger.closingBalance"),
			typeNames,
		};
		exportBankLedgerToExcel(
			data.account.name,
			openingBalance,
			visible,
			{ totalIn: visibleTotals.totalIn, totalOut: visibleTotals.totalOut, closingBalance },
			labels,
			orgName,
		);
	};

	return (
		<div className="space-y-4">
			{/* Toolbar */}
			<div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
				<div className="flex flex-wrap items-center gap-2">
					<Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
						<SelectTrigger className="rounded-xl w-48">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="ALL">{t("finance.banks.ledger.allTypes")}</SelectItem>
							{LEDGER_TYPES.map((tp) => (
								<SelectItem key={tp} value={tp}>
									{typeLabel(tp)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="relative">
						<Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-slate-400" />
						<Input
							value={search}
							onChange={(e: any) => setSearch(e.target.value)}
							placeholder={t("finance.banks.ledger.searchPlaceholder")}
							className="rounded-xl ps-9 w-56"
						/>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Input
						type="date"
						value={dateFrom}
						onChange={(e: any) => onDateFromChange(e.target.value)}
						className="rounded-xl w-40"
					/>
					<span className="text-slate-400">—</span>
					<Input
						type="date"
						value={dateTo}
						onChange={(e: any) => onDateToChange(e.target.value)}
						className="rounded-xl w-40"
					/>
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl"
						onClick={() => window.print()}
					>
						<Printer className="h-4 w-4 me-1" />
						{t("finance.banks.ledger.print")}
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="rounded-xl"
						disabled={!data}
						onClick={handleExport}
					>
						<Download className="h-4 w-4 me-1" />
						Excel
					</Button>
				</div>
			</div>

			{data?.truncated && (
				<p className="text-xs text-amber-600 dark:text-amber-400 print:hidden">
					{t("finance.banks.ledger.truncatedNote")}
				</p>
			)}

			{/* Print header */}
			<div className="hidden print:block text-center mb-4">
				<h1 className="text-xl font-bold">{t("finance.banks.ledger.title")}</h1>
				{data && <p className="text-lg">{data.account.name}</p>}
				<p className="text-sm text-slate-500">{dateFrom || "—"} — {dateTo || "—"}</p>
			</div>

			{/* Table */}
			<Card className="rounded-2xl print:rounded-none print:shadow-none print:border">
				<CardContent className="p-0">
					{isLoading ? (
						<div className="text-center py-12 text-slate-500">{t("common.loading")}</div>
					) : visible.length === 0 ? (
						<div className="text-center py-12 text-slate-500">
							<FileText className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
							{t("finance.banks.ledger.noMovements")}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("finance.banks.ledger.columns.date")}</TableHead>
									<TableHead>{t("finance.banks.ledger.columns.type")}</TableHead>
									<TableHead>{t("finance.banks.ledger.columns.description")}</TableHead>
									<TableHead>{t("finance.banks.ledger.columns.counterparty")}</TableHead>
									<TableHead>{t("finance.banks.ledger.columns.reference")}</TableHead>
									<TableHead className="text-end">{t("finance.banks.ledger.columns.in")}</TableHead>
									<TableHead className="text-end">{t("finance.banks.ledger.columns.out")}</TableHead>
									<TableHead className="text-end">{t("finance.banks.ledger.columns.balance")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{/* Opening balance row */}
								<TableRow className="bg-slate-50 dark:bg-slate-800/50 font-medium">
									<TableCell colSpan={7}>{t("finance.banks.ledger.openingBalance")}</TableCell>
									<TableCell className="text-end font-bold">
										<Currency amount={openingBalance} />
									</TableCell>
								</TableRow>

								{visible.map((e) => {
									const href = e.sourceLink ? `${basePath}${e.sourceLink}` : null;
									return (
										<TableRow key={e.id}>
											<TableCell className="text-sm text-slate-500 whitespace-nowrap">
												{new Date(e.date).toLocaleDateString("en-SA")}
											</TableCell>
											<TableCell>
												<Badge className={`rounded-lg border-0 ${TYPE_BADGE[e.type]}`}>
													{typeLabel(e.type)}
												</Badge>
											</TableCell>
											<TableCell className="text-sm max-w-[240px] truncate">
												{href ? (
													<Link href={href} className="text-primary hover:underline">
														{e.description || t("finance.banks.ledger.viewSource")}
													</Link>
												) : (
													e.description || "—"
												)}
											</TableCell>
											<TableCell className="text-sm text-slate-600 dark:text-slate-300 max-w-[180px] truncate">
												{e.counterparty || "—"}
											</TableCell>
											<TableCell className="text-sm text-slate-500 font-mono">
												{e.referenceNo || "—"}
											</TableCell>
											<TableCell className="text-end text-green-600 dark:text-green-400">
												{e.direction === "IN" ? <Currency amount={e.amount} /> : "—"}
											</TableCell>
											<TableCell className="text-end text-red-600 dark:text-red-400">
												{e.direction === "OUT" ? <Currency amount={e.amount} /> : "—"}
											</TableCell>
											<TableCell className="text-end font-medium">
												<Currency amount={e.runningBalance} />
											</TableCell>
										</TableRow>
									);
								})}

								{/* Closing balance row */}
								<TableRow className="bg-slate-50 dark:bg-slate-800/50 font-medium border-t-2">
									<TableCell colSpan={5}>{t("finance.banks.ledger.closingBalance")}</TableCell>
									<TableCell className="text-end font-bold text-green-600 dark:text-green-400">
										<Currency amount={visibleTotals.totalIn} />
									</TableCell>
									<TableCell className="text-end font-bold text-red-600 dark:text-red-400">
										<Currency amount={visibleTotals.totalOut} />
									</TableCell>
									<TableCell className="text-end font-bold text-primary">
										<Currency amount={closingBalance} />
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
