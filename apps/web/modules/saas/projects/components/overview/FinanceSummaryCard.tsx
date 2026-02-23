"use client";

import { formatCurrencyCompact } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { Button } from "@ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { Banknote, ArrowLeft, Receipt, ClipboardList } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

const glassCard =
	"backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-xl shadow-sm";

interface FinanceSummaryCardProps {
	organizationId: string;
	projectId: string;
	basePath: string;
}

export function FinanceSummaryCard({
	organizationId,
	projectId,
	basePath,
}: FinanceSummaryCardProps) {
	const t = useTranslations();

	const { data: expensesData } = useQuery(
		orpc.projectFinance.listExpenses.queryOptions({
			input: { organizationId, projectId, limit: 100 },
		}),
	);

	const { data: pendingClaimsData } = useQuery(
		orpc.projectFinance.listClaims.queryOptions({
			input: { organizationId, projectId, limit: 20 },
		}),
	);

	const thisMonthExpenses = useMemo(() => {
		if (!expensesData?.expenses?.length) return 0;
		const now = new Date();
		const currentMonth = now.getMonth();
		const currentYear = now.getFullYear();
		return expensesData.expenses
			.filter((exp: any) => {
				const date = new Date(exp.date ?? exp.createdAt);
				return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
			})
			.reduce((sum: number, exp: any) => sum + exp.amount, 0);
	}, [expensesData]);

	const pendingClaims = useMemo(() => {
		if (!pendingClaimsData?.claims?.length) return { count: 0, total: 0 };
		const pending = pendingClaimsData.claims.filter(
			(c: any) => c.status === "SUBMITTED" || c.status === "APPROVED",
		);
		return {
			count: pending.length,
			total: pending.reduce((sum: number, c: any) => sum + c.amount, 0),
		};
	}, [pendingClaimsData]);

	return (
		<div className={`${glassCard} p-4 flex flex-col h-full`}>
			<div className="flex items-center gap-2 mb-3">
				<Banknote className="h-4 w-4 text-emerald-500" />
				<h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
					{t("projects.commandCenter.financeSummary")}
				</h3>
			</div>

			<div className="flex-1 space-y-3">
				{/* This Month Expenses */}
				<div className="rounded-lg bg-red-50/50 dark:bg-red-950/20 p-3">
					<div className="flex items-center gap-2 mb-1">
						<Receipt className="h-3.5 w-3.5 text-red-500" />
						<span className="text-[11px] font-medium text-red-600 dark:text-red-400">
							{t("projects.commandCenter.thisMonthExpenses")}
						</span>
					</div>
					<p className="text-sm font-bold text-slate-700 dark:text-slate-300">
						{formatCurrencyCompact(thisMonthExpenses)}
					</p>
				</div>

				{/* Pending Claims */}
				<div className="rounded-lg bg-amber-50/50 dark:bg-amber-950/20 p-3">
					<div className="flex items-center gap-2 mb-1">
						<ClipboardList className="h-3.5 w-3.5 text-amber-500" />
						<span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
							{t("projects.commandCenter.pendingClaims")}
						</span>
					</div>
					<p className="text-sm font-bold text-slate-700 dark:text-slate-300">
						{pendingClaims.count > 0
							? `${pendingClaims.count} (${formatCurrencyCompact(pendingClaims.total)})`
							: "-"}
					</p>
				</div>
			</div>

			<Button variant="ghost" size="sm" asChild className="mt-3 w-full rounded-lg">
				<Link href={`${basePath}/finance`} className="flex items-center gap-2">
					{t("projects.commandCenter.openFinance")}
					<ArrowLeft className="h-3.5 w-3.5" />
				</Link>
			</Button>
		</div>
	);
}
