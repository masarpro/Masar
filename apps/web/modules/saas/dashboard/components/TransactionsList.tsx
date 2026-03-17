"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { cn } from "@ui/lib";
import { Card } from "@ui/components/card";
import { ArrowDownLeft, ArrowUpRight, FileText } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface TransactionItem {
	id: string;
	type: "PAYMENT" | "EXPENSE";
	description: string;
	date: Date | string;
	amount: number;
}

interface TransactionsListProps {
	transactions: TransactionItem[];
	organizationSlug: string;
}

export function TransactionsList({
	transactions,
	organizationSlug,
}: TransactionsListProps) {
	const t = useTranslations();

	return (
		<Card className="flex h-full flex-col p-5 dark:border-gray-800 dark:bg-gray-900">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
					{t("dashboard.transactions.title")}
				</h3>
				<Link
					href={`/app/${organizationSlug}/finance`}
					className="text-[10px] text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
				>
					{t("dashboard.viewAll")}
				</Link>
			</div>

			{transactions.length > 0 ? (
				<div className="space-y-3">
					{transactions.slice(0, 5).map((tx) => (
						<div
							key={tx.id}
							className="flex items-center gap-3"
						>
							<div
								className={cn(
									"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
									tx.type === "PAYMENT"
										? "bg-emerald-50 dark:bg-emerald-900/20"
										: "bg-rose-50 dark:bg-rose-900/20",
								)}
							>
								{tx.type === "PAYMENT" ? (
									<ArrowDownLeft className="h-4 w-4 text-emerald-500" />
								) : (
									<ArrowUpRight className="h-4 w-4 text-rose-500" />
								)}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
									{tx.description}
								</p>
								<p className="text-[11px] text-gray-400">
									{new Date(tx.date).toLocaleDateString(
										"ar-SA",
										{
											day: "numeric",
											month: "short",
										},
									)}
								</p>
							</div>
							<span
								className={cn(
									"shrink-0 text-sm font-bold",
									tx.type === "PAYMENT"
										? "text-emerald-500"
										: "text-rose-500",
								)}
							>
								{tx.type === "PAYMENT" ? "+" : "-"}
								<Currency amount={Math.abs(tx.amount)} />
							</span>
						</div>
					))}
				</div>
			) : (
				<div className="flex flex-1 flex-col items-center justify-center py-6">
					<FileText className="mb-2 h-8 w-8 text-gray-200 dark:text-gray-700" />
					<p className="text-xs text-gray-400">
						{t("dashboard.cashflow.empty")}
					</p>
					<Link
						href={`/app/${organizationSlug}/finance/invoices/new`}
						className="mt-1 text-[11px] text-emerald-500 hover:text-emerald-700 dark:text-emerald-400"
					>
						{t("dashboard.cashflow.emptyCta")}
					</Link>
				</div>
			)}
		</Card>
	);
}
