"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Button } from "@ui/components/button";
import { Input } from "@ui/components/input";
import { Badge } from "@ui/components/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@ui/components/table";
import { Save, AlertTriangle } from "lucide-react";
import { DashboardSkeleton } from "@saas/shared/components/skeletons";
import { formatAccounting, ACCOUNT_TYPE_COLORS } from "./formatters";
import { toast } from "sonner";

interface OpeningBalancesPageProps {
	organizationId: string;
	organizationSlug: string;
}

const TYPE_ORDER = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];
const TYPE_LABELS: Record<string, string> = {
	ASSET: "أصول",
	LIABILITY: "خصوم",
	EQUITY: "حقوق ملكية",
	REVENUE: "إيرادات",
	EXPENSE: "مصروفات",
};

export function OpeningBalancesPage({
	organizationId,
}: OpeningBalancesPageProps) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	const { data, isLoading } = useQuery(
		orpc.accounting.openingBalances.get.queryOptions({
			input: { organizationId },
		}),
	);

	// Local state for amounts
	const [amounts, setAmounts] = useState<Map<string, { debit: number; credit: number }>>(new Map());
	const [initialized, setInitialized] = useState(false);

	// Initialize amounts from server data
	if (data && !initialized) {
		const map = new Map<string, { debit: number; credit: number }>();
		for (const acc of data.accounts) {
			if (acc.debit > 0 || acc.credit > 0) {
				map.set(acc.accountId, { debit: acc.debit, credit: acc.credit });
			}
		}
		setAmounts(map);
		setInitialized(true);
	}

	const saveMutation = useMutation(
		orpc.accounting.openingBalances.save.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["orpc", "accounting"] });
				toast.success(t("finance.accounting.openingBalances.saveSuccess"));
			},
			onError: (err) => toast.error(err.message),
		}),
	);

	// Calculate totals
	const totals = useMemo(() => {
		let totalDebit = 0;
		let totalCredit = 0;
		for (const [, v] of amounts) {
			totalDebit += v.debit;
			totalCredit += v.credit;
		}
		return { totalDebit, totalCredit, difference: totalDebit - totalCredit };
	}, [amounts]);

	// Group accounts by type
	const groupedAccounts = useMemo(() => {
		if (!data) return [];
		const groups: Array<{ type: string; label: string; accounts: typeof data.accounts }> = [];
		for (const type of TYPE_ORDER) {
			const accs = data.accounts.filter((a) => a.type === type);
			if (accs.length > 0) {
				groups.push({ type, label: TYPE_LABELS[type] ?? type, accounts: accs });
			}
		}
		return groups;
	}, [data]);

	const handleAmountChange = (accountId: string, field: "debit" | "credit", value: string) => {
		const num = Number.parseFloat(value) || 0;
		setAmounts((prev) => {
			const next = new Map(prev);
			const current = next.get(accountId) ?? { debit: 0, credit: 0 };
			// When entering debit, clear credit and vice versa
			if (field === "debit") {
				next.set(accountId, { debit: num, credit: num > 0 ? 0 : current.credit });
			} else {
				next.set(accountId, { debit: num > 0 ? 0 : current.debit, credit: num });
			}
			// Remove if both zero
			const entry = next.get(accountId)!;
			if (entry.debit === 0 && entry.credit === 0) next.delete(accountId);
			return next;
		});
	};

	const handleSave = () => {
		const lines = Array.from(amounts.entries()).map(([accountId, { debit, credit }]) => ({
			accountId,
			debit,
			credit,
		}));
		saveMutation.mutate({ input: { organizationId, lines } });
	};

	if (isLoading) return <DashboardSkeleton />;

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-lg font-bold">{t("finance.accounting.openingBalances.title")}</h2>
					<p className="text-sm text-slate-500">{t("finance.accounting.openingBalances.description")}</p>
				</div>
				<Button
					onClick={handleSave}
					disabled={saveMutation.isPending || amounts.size === 0}
					className="rounded-xl"
				>
					<Save className="h-4 w-4 me-1" />
					{t("finance.accounting.openingBalances.save")}
				</Button>
			</div>

			{/* Warning if existing */}
			{data?.entryId && (
				<div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
					<AlertTriangle className="h-4 w-4 text-amber-600" />
					<span className="text-sm text-amber-700 dark:text-amber-300">
						{t("finance.accounting.openingBalances.existingWarning")}
					</span>
				</div>
			)}

			{/* Totals */}
			<Card className="rounded-2xl">
				<CardContent className="p-4">
					<div className="flex items-center justify-between gap-4">
						<div className="text-center">
							<p className="text-xs text-slate-500">{t("finance.accounting.totalDebit")}</p>
							<p className="text-lg font-bold text-emerald-600">{formatAccounting(totals.totalDebit)}</p>
						</div>
						<div className="text-center">
							<p className="text-xs text-slate-500">{t("finance.accounting.totalCredit")}</p>
							<p className="text-lg font-bold text-red-600">{formatAccounting(totals.totalCredit)}</p>
						</div>
						<div className="text-center">
							<p className="text-xs text-slate-500">{t("finance.accounting.difference")}</p>
							<p className={`text-lg font-bold ${Math.abs(totals.difference) < 0.01 ? "text-emerald-600" : "text-red-600"}`}>
								{formatAccounting(totals.difference)}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Account Groups */}
			{groupedAccounts.map((group) => {
				const colors = ACCOUNT_TYPE_COLORS[group.type] ?? ACCOUNT_TYPE_COLORS.ASSET;
				return (
					<Card key={group.type} className="rounded-2xl">
						<CardHeader className={`py-3 ${colors.bg} rounded-t-2xl`}>
							<CardTitle className={`text-sm font-semibold ${colors.text}`}>
								{group.label}
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-20">{t("finance.accounting.accountCode")}</TableHead>
										<TableHead>{t("finance.accounting.accountName")}</TableHead>
										<TableHead className="w-40 text-end">{t("finance.accounting.debit")}</TableHead>
										<TableHead className="w-40 text-end">{t("finance.accounting.credit")}</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{group.accounts.map((acc) => {
										const current = amounts.get(acc.accountId) ?? { debit: 0, credit: 0 };
										return (
											<TableRow key={acc.accountId}>
												<TableCell className="font-mono text-xs text-slate-400">{acc.code}</TableCell>
												<TableCell className="text-sm">{acc.nameAr}</TableCell>
												<TableCell>
													<Input
														type="number"
														min={0}
														step={0.01}
														value={current.debit || ""}
														onChange={(e) => handleAmountChange(acc.accountId, "debit", e.target.value)}
														className="rounded-lg text-end h-8 text-sm"
														placeholder="0.00"
													/>
												</TableCell>
												<TableCell>
													<Input
														type="number"
														min={0}
														step={0.01}
														value={current.credit || ""}
														onChange={(e) => handleAmountChange(acc.accountId, "credit", e.target.value)}
														className="rounded-lg text-end h-8 text-sm"
														placeholder="0.00"
													/>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
