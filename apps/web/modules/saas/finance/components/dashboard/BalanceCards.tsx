"use client";

import {
	Wallet,
	Landmark,
	TrendingUp,
	TrendingDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Currency } from "../shared/Currency";

// Mock balance data
// TODO: Connect to real API
const mockBalances = {
	cashBalance: 123456,
	bankBalance: 456789,
	netProfit: 89012,
	cashTrend: { value: 12, isPositive: true },
	bankTrend: { value: 8, isPositive: true },
	profitTrend: { value: 3, isPositive: false },
};

export function BalanceCards() {
	const t = useTranslations();

	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
			{/* Cash Balance */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
				<div className="flex items-center justify-between mb-3">
					<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
						<Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
					</div>
					{mockBalances.cashTrend && (
						<div
							className={`flex items-center gap-0.5 text-xs ${
								mockBalances.cashTrend.isPositive
									? "text-green-600 dark:text-green-400"
									: "text-red-600 dark:text-red-400"
							}`}
						>
							{mockBalances.cashTrend.isPositive ? (
								<TrendingUp className="h-3 w-3" />
							) : (
								<TrendingDown className="h-3 w-3" />
							)}
							<span>
								{mockBalances.cashTrend.isPositive ? "+" : ""}
								{mockBalances.cashTrend.value}%
							</span>
						</div>
					)}
				</div>
				<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
					{t("finance.dashboard.overview.cashBalance")}
				</p>
				<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
					<Currency amount={mockBalances.cashBalance} />
				</p>
			</div>

			{/* Bank Balance */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
				<div className="flex items-center justify-between mb-3">
					<div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
						<Landmark className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					</div>
					{mockBalances.bankTrend && (
						<div
							className={`flex items-center gap-0.5 text-xs ${
								mockBalances.bankTrend.isPositive
									? "text-green-600 dark:text-green-400"
									: "text-red-600 dark:text-red-400"
							}`}
						>
							{mockBalances.bankTrend.isPositive ? (
								<TrendingUp className="h-3 w-3" />
							) : (
								<TrendingDown className="h-3 w-3" />
							)}
							<span>
								{mockBalances.bankTrend.isPositive ? "+" : ""}
								{mockBalances.bankTrend.value}%
							</span>
						</div>
					)}
				</div>
				<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
					{t("finance.dashboard.overview.bankBalance")}
				</p>
				<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
					<Currency amount={mockBalances.bankBalance} />
				</p>
			</div>

			{/* Net Profit */}
			<div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-lg shadow-black/5 p-4">
				<div className="flex items-center justify-between mb-3">
					<div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
						<TrendingUp className="h-5 w-5 text-violet-600 dark:text-violet-400" />
					</div>
					{mockBalances.profitTrend && (
						<div
							className={`flex items-center gap-0.5 text-xs ${
								mockBalances.profitTrend.isPositive
									? "text-green-600 dark:text-green-400"
									: "text-red-600 dark:text-red-400"
							}`}
						>
							{mockBalances.profitTrend.isPositive ? (
								<TrendingUp className="h-3 w-3" />
							) : (
								<TrendingDown className="h-3 w-3" />
							)}
							<span>
								{mockBalances.profitTrend.isPositive ? "+" : ""}
								{mockBalances.profitTrend.value}%
							</span>
						</div>
					)}
				</div>
				<p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
					{t("finance.dashboard.overview.netProfit")}
				</p>
				<p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
					<Currency amount={mockBalances.netProfit} />
				</p>
			</div>
		</div>
	);
}
