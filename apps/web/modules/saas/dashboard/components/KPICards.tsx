"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { cn } from "@ui/lib";
import { Landmark, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";

// ── Sparkline (pure SVG) ──
function MiniSparkline({
	data,
	color,
	width = 80,
	height = 32,
}: {
	data: number[];
	color: string;
	width?: number;
	height?: number;
}) {
	if (!data || data.length < 2) return null;
	const max = Math.max(...data);
	const min = Math.min(...data);
	const range = max - min || 1;
	const points = data
		.map((v, i) => {
			const x = (i / (data.length - 1)) * width;
			const y = height - 4 - ((v - min) / range) * (height - 8);
			return `${x},${y}`;
		})
		.join(" ");

	const gradientId = `spark-${color.replace("#", "")}`;

	return (
		<svg width={width} height={height} className="opacity-60">
			<defs>
				<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor={color} stopOpacity={0.2} />
					<stop offset="100%" stopColor={color} stopOpacity={0} />
				</linearGradient>
			</defs>
			<polygon
				points={`0,${height} ${points} ${width},${height}`}
				fill={`url(#${gradientId})`}
			/>
			<polyline
				points={points}
				fill="none"
				stroke={color}
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}

// ── Types ──
interface KPICardsProps {
	bankBalance: number;
	totalIncome: number;
	totalExpenses: number;
	netProfit: number;
	organizationSlug: string;
	/** Recent payment amounts (last ~7) for sparklines */
	recentPaymentAmounts: number[];
	/** Recent expense amounts (last ~7) for sparklines */
	recentExpenseAmounts: number[];
}

interface KPICardDef {
	id: string;
	labelKey: string;
	icon: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
	iconBg: string;
	iconColor: string;
	gradient: string;
	sparkColor: string;
	valueColor: string;
	negativeValueColor?: string;
	ctaKey?: string;
	ctaPath?: string;
}

const KPI_DEFS: KPICardDef[] = [
	{
		id: "bank",
		labelKey: "dashboard.kpi.bankBalance",
		icon: Landmark,
		iconBg: "bg-blue-50 dark:bg-blue-950/30",
		iconColor: "text-blue-600 dark:text-blue-400",
		gradient: "from-blue-500 to-blue-400",
		sparkColor: "#3b82f6",
		valueColor: "text-gray-900 dark:text-gray-100",
		ctaKey: "dashboard.stats.bankBalance.cta",
		ctaPath: "/finance",
	},
	{
		id: "income",
		labelKey: "dashboard.kpi.totalIncome",
		icon: TrendingUp,
		iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
		iconColor: "text-emerald-600 dark:text-emerald-400",
		gradient: "from-emerald-500 to-emerald-400",
		sparkColor: "#10b981",
		valueColor: "text-emerald-600 dark:text-emerald-400",
		ctaKey: "dashboard.stats.receivables.cta",
		ctaPath: "/finance/invoices/new",
	},
	{
		id: "expenses",
		labelKey: "dashboard.kpi.totalExpenses",
		icon: TrendingDown,
		iconBg: "bg-rose-50 dark:bg-rose-950/30",
		iconColor: "text-rose-500 dark:text-rose-400",
		gradient: "from-rose-500 to-rose-400",
		sparkColor: "#f43f5e",
		valueColor: "text-rose-500 dark:text-rose-400",
		ctaKey: "dashboard.stats.expenses.cta",
		ctaPath: "/finance/expenses",
	},
	{
		id: "profit",
		labelKey: "dashboard.kpi.netProfit",
		icon: Wallet,
		iconBg: "bg-violet-50 dark:bg-violet-950/30",
		iconColor: "text-violet-500 dark:text-violet-400",
		gradient: "from-violet-500 to-purple-400",
		sparkColor: "#8b5cf6",
		valueColor: "text-emerald-600 dark:text-emerald-400",
		negativeValueColor: "text-rose-500 dark:text-rose-400",
	},
];

export function KPICards({
	bankBalance,
	totalIncome,
	totalExpenses,
	netProfit,
	organizationSlug,
	recentPaymentAmounts,
	recentExpenseAmounts,
}: KPICardsProps) {
	const t = useTranslations();

	const values: Record<string, number> = {
		bank: bankBalance,
		income: totalIncome,
		expenses: totalExpenses,
		profit: netProfit,
	};

	// Build sparkline data per card from available recent transaction arrays
	const sparkData: Record<string, number[]> = {
		bank: [], // no daily bank balance series available
		income: recentPaymentAmounts,
		expenses: recentExpenseAmounts,
		profit:
			recentPaymentAmounts.length > 0 && recentExpenseAmounts.length > 0
				? recentPaymentAmounts.map(
						(v, i) => v - (recentExpenseAmounts[i] ?? 0),
					)
				: [],
	};

	return (
		<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
			{KPI_DEFS.map((kpi) => {
				const value = values[kpi.id] ?? 0;
				const hasValue =
					kpi.id === "profit"
						? totalIncome > 0 || totalExpenses > 0
						: value > 0;
				const spark = sparkData[kpi.id] ?? [];
				const Icon = kpi.icon;

				// Dynamic value color for profit
				const resolvedValueColor =
					kpi.id === "profit" && netProfit < 0
						? (kpi.negativeValueColor ?? kpi.valueColor)
						: kpi.valueColor;

				return (
					<div
						key={kpi.id}
						className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
					>
						{/* Top gradient bar */}
						<div
							className={cn(
								"absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-l",
								kpi.gradient,
							)}
						/>

						{/* Icon + label */}
						<div className="mb-3 flex items-center gap-2">
							<div
								className={cn(
									"flex h-8 w-8 items-center justify-center rounded-lg",
									kpi.iconBg,
								)}
							>
								<Icon
									className={cn("h-4 w-4", kpi.iconColor)}
								/>
							</div>
							<span className="text-xs font-medium text-gray-400 dark:text-gray-500">
								{t(kpi.labelKey)}
							</span>
						</div>

						{/* Value */}
						{hasValue ? (
							<p
								className={cn(
									"text-2xl font-black tracking-tight",
									resolvedValueColor,
								)}
							>
								<Currency amount={value} />
							</p>
						) : (
							<>
								<p className="text-2xl font-black tracking-tight text-gray-200 dark:text-gray-700">
									—
								</p>
								{kpi.ctaKey && kpi.ctaPath && (
									<Link
										href={`/app/${organizationSlug}${kpi.ctaPath}`}
										className="mt-1 block text-[11px] text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
									>
										{t(kpi.ctaKey)}{" "}
										<span className="opacity-50">
											&#x2039;
										</span>
									</Link>
								)}
							</>
						)}

						{/* Sparkline */}
						{spark.length >= 2 && (
							<div className="mt-3">
								<MiniSparkline
									data={spark}
									color={kpi.sparkColor}
								/>
							</div>
						)}
					</div>
				);
			})}
		</div>
	);
}
