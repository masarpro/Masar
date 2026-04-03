"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { ArrowLeft, CheckCircle, Save } from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { formatAccounting } from "../accounting/formatters";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface BankReconciliationProps {
	organizationId: string;
	organizationSlug: string;
	bankAccountId: string;
}

export function BankReconciliation({
	organizationId,
	organizationSlug,
	bankAccountId,
}: BankReconciliationProps) {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const now = new Date();
	const [dateFrom, setDateFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
	const [dateTo, setDateTo] = useState(now.toISOString().split("T")[0]);
	const [statementBalance, setStatementBalance] = useState("");
	const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());

	const { data: bankData } = useQuery(
		orpc.finance.banks.getById.queryOptions({
			input: { organizationId, id: bankAccountId },
		}),
	);

	const { data: lines, isLoading } = useQuery(
		orpc.finance.banks.reconciliation.getLines.queryOptions({
			input: {
				organizationId,
				bankAccountId,
				dateFrom: new Date(dateFrom).toISOString(),
				dateTo: new Date(dateTo).toISOString(),
			},
		}),
	);

	const { data: history } = useQuery(
		orpc.finance.banks.reconciliation.history.queryOptions({
			input: { organizationId, bankAccountId },
		}),
	);

	const saveMutation = useMutation(
		orpc.finance.banks.reconciliation.create.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["orpc", "finance"] });
				toast.success(t("finance.accounting.reconciliation.saved"));
			},
			onError: (err: any) => toast.error(err.message),
		}),
	);

	const toggleMatch = useCallback((lineId: string) => {
		setMatchedIds((prev) => {
			const next = new Set(prev);
			if (next.has(lineId)) next.delete(lineId);
			else next.add(lineId);
			return next;
		});
	}, []);

	const toggleAll = useCallback(() => {
		if (!lines) return;
		setMatchedIds((prev) => {
			if (prev.size === lines.length) return new Set();
			return new Set(lines.map((l: any) => l.id));
		});
	}, [lines]);

	// Calculate balances
	const calculations = useMemo(() => {
		if (!lines) return { bookBalance: 0, matchedTotal: 0, unmatchedTotal: 0, difference: 0 };
		const bookBalance = lines.reduce((s: number, l: any) => s + l.net, 0);
		const matchedTotal = lines
			.filter((l: any) => matchedIds.has(l.id))
			.reduce((s: number, l: any) => s + l.net, 0);
		const unmatchedTotal = bookBalance - matchedTotal;
		const stmtBal = Number(statementBalance) || 0;
		const difference = stmtBal - bookBalance;
		return { bookBalance, matchedTotal, unmatchedTotal, difference };
	}, [lines, matchedIds, statementBalance]);

	const handleSave = () => {
		saveMutation.mutate({
			organizationId,
			bankAccountId,
			reconciliationDate: new Date(dateTo).toISOString(),
			statementBalance: Number(statementBalance) || 0,
			bookBalance: calculations.bookBalance,
			matchedLineIds: Array.from(matchedIds),
		});
	};

	if (isLoading) return <DashboardSkeleton />;

	const basePath = `/app/${organizationSlug}/finance`;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Button variant="outline" size="sm" className="rounded-xl" onClick={() => router.back()}>
						<ArrowLeft className="h-4 w-4 me-1" />
						{t("common.back")}
					</Button>
					<div>
						<h2 className="text-lg font-bold">{t("finance.accounting.reconciliation.title")}</h2>
						{bankData && <p className="text-sm text-slate-500">{bankData.name}</p>}
					</div>
				</div>
				<Button
					size="sm"
					className="rounded-xl"
					onClick={handleSave}
					disabled={saveMutation.isPending || !statementBalance}
				>
					<Save className="h-4 w-4 me-1" />
					{t("finance.accounting.reconciliation.save")}
				</Button>
			</div>

			{/* Filters + Summary */}
			<div className="grid gap-4 sm:grid-cols-2">
				{/* Filters */}
				<Card className="rounded-2xl">
					<CardContent className="p-4 space-y-3">
						<div className="grid grid-cols-2 gap-3">
							<div>
								<Label className="text-xs">{t("finance.accounting.ledger.dateFrom")}</Label>
								<Input type="date" value={dateFrom} onChange={(e: any) => setDateFrom(e.target.value)} className="rounded-xl h-8 text-sm" />
							</div>
							<div>
								<Label className="text-xs">{t("finance.accounting.ledger.dateTo")}</Label>
								<Input type="date" value={dateTo} onChange={(e: any) => setDateTo(e.target.value)} className="rounded-xl h-8 text-sm" />
							</div>
						</div>
						<div>
							<Label className="text-xs">{t("finance.accounting.reconciliation.statementBalance")}</Label>
							<Input
								type="number"
								step="0.01"
								value={statementBalance}
								onChange={(e: any) => setStatementBalance(e.target.value)}
								className="rounded-xl h-8 text-sm"
								placeholder="0.00"
							/>
						</div>
					</CardContent>
				</Card>

				{/* Summary */}
				<Card className="rounded-2xl">
					<CardContent className="p-4 space-y-2">
						<div className="flex justify-between text-sm">
							<span className="text-slate-500">{t("finance.accounting.reconciliation.bookBalance")}</span>
							<span className="font-medium">{formatAccounting(calculations.bookBalance)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-slate-500">{t("finance.accounting.reconciliation.statementBalance")}</span>
							<span className="font-medium">{formatAccounting(Number(statementBalance) || 0)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span className="text-slate-500">{t("finance.accounting.reconciliation.matched")}</span>
							<span className="font-medium text-green-600">{matchedIds.size}</span>
						</div>
						<div className="flex justify-between text-sm border-t pt-2 mt-2">
							<span className="font-medium">{t("finance.accounting.difference")}</span>
							<span className={`font-bold ${Math.abs(calculations.difference) < 0.01 ? "text-green-600" : "text-red-600"}`}>
								{formatAccounting(calculations.difference)}
								{Math.abs(calculations.difference) < 0.01 && <CheckCircle className="h-4 w-4 inline ms-1" />}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Lines Table */}
			<Card className="rounded-2xl">
				<CardHeader className="py-3">
					<CardTitle className="text-sm">{t("finance.accounting.reconciliation.bankMovements")}</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{(!lines || lines.length === 0) ? (
						<div className="text-center py-12 text-slate-500">
							{t("finance.accounting.ledger.noMovements")}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-10">
										<input type="checkbox" checked={matchedIds.size === lines.length} onChange={toggleAll} className="rounded" />
									</TableHead>
									<TableHead>{t("finance.accounting.entryDate")}</TableHead>
									<TableHead>{t("finance.accounting.entryNo")}</TableHead>
									<TableHead>{t("finance.accounting.description")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.debit")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.credit")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{lines.map((line: any) => (
									<TableRow key={line.id} className={matchedIds.has(line.id) ? "bg-green-50/50 dark:bg-green-900/10" : ""}>
										<TableCell>
											<input
												type="checkbox"
												checked={matchedIds.has(line.id)}
												onChange={() => toggleMatch(line.id)}
												className="rounded"
											/>
										</TableCell>
										<TableCell className="text-sm text-slate-500">
											{new Date(line.date).toLocaleDateString("en-SA")}
										</TableCell>
										<TableCell>
											<Link href={`${basePath}/journal-entries/${line.entryId}`} className="font-mono text-sm text-primary hover:underline">
												{line.entryNo}
											</Link>
										</TableCell>
										<TableCell className="text-sm">{line.description}</TableCell>
										<TableCell className="text-end">{line.debit > 0 ? formatAccounting(line.debit) : "—"}</TableCell>
										<TableCell className="text-end">{line.credit > 0 ? formatAccounting(line.credit) : "—"}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* History */}
			{history && history.length > 0 && (
				<Card className="rounded-2xl">
					<CardHeader className="py-3">
						<CardTitle className="text-sm">{t("finance.accounting.reconciliation.history")}</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>{t("finance.accounting.entryDate")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.reconciliation.statementBalance")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.reconciliation.bookBalance")}</TableHead>
									<TableHead className="text-end">{t("finance.accounting.difference")}</TableHead>
									<TableHead>{t("finance.accounting.posted")}</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{history.map((rec: any) => (
									<TableRow key={rec.id}>
										<TableCell className="text-sm">{new Date(rec.reconciliationDate).toLocaleDateString("en-SA")}</TableCell>
										<TableCell className="text-end">{formatAccounting(rec.statementBalance)}</TableCell>
										<TableCell className="text-end">{formatAccounting(rec.bookBalance)}</TableCell>
										<TableCell className={`text-end ${Math.abs(rec.difference) < 0.01 ? "text-green-600" : "text-red-600"}`}>
											{formatAccounting(rec.difference)}
										</TableCell>
										<TableCell>
											<Badge variant={rec.status === "COMPLETED" ? "default" : "secondary"} className="text-[10px]">
												{rec.status === "COMPLETED" ? t("common.completed") : t("finance.accounting.draft")}
											</Badge>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
