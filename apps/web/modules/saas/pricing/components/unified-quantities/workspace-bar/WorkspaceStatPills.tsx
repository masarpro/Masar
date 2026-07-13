"use client";

import { TrendingDown, TrendingUp, Wallet } from "lucide-react";

interface Props {
	totalGrossCost: number;
	totalSellAmount: number;
	totalProfitAmount: number;
	totalProfitPercent: number;
}

const fmt = (n: number) =>
	new Intl.NumberFormat("en-US", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(Math.round(n));

export function WorkspaceStatPills({
	totalGrossCost,
	totalSellAmount,
	totalProfitAmount,
	totalProfitPercent,
}: Props) {
	const isProfit = totalProfitAmount >= 0;

	return (
		<div className="flex flex-wrap items-stretch gap-2">
			<Pill
				icon={<Wallet className="h-3.5 w-3.5" />}
				label="تكلفة"
				value={`${fmt(totalGrossCost)} ر.س`}
				tone="neutral"
			/>
			<Pill
				icon={<span className="text-[10px] font-bold">$</span>}
				label="بيع"
				value={`${fmt(totalSellAmount)} ر.س`}
				tone="info"
			/>
			<Pill
				icon={
					isProfit ? (
						<TrendingUp className="h-3.5 w-3.5" />
					) : (
						<TrendingDown className="h-3.5 w-3.5" />
					)
				}
				label={isProfit ? "ربح" : "خسارة"}
				value={`${fmt(totalProfitAmount)} ر.س`}
				suffix={`${totalProfitPercent.toFixed(1)}%`}
				tone={isProfit ? "success" : "danger"}
			/>
		</div>
	);
}

interface PillProps {
	icon: React.ReactNode;
	label: string;
	value: string;
	suffix?: string;
	tone: "neutral" | "info" | "success" | "danger";
}

const TONE: Record<PillProps["tone"], string> = {
	neutral:
		"bg-muted/60 text-foreground border-border",
	info:
		"bg-chart-4/15 text-chart-4 border-chart-4",
	success:
		"bg-success/15 text-success border-success",
	danger:
		"bg-destructive/15 text-destructive border-destructive",
};

function Pill({ icon, label, value, suffix, tone }: PillProps) {
	return (
		<div
			className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${TONE[tone]}`}
		>
			<span className="flex h-5 w-5 items-center justify-center opacity-70">
				{icon}
			</span>
			<div className="flex items-baseline gap-1.5 leading-none">
				<span className="text-[10px] uppercase tracking-wide opacity-70">
					{label}
				</span>
				<span className="text-sm font-semibold tabular-nums">{value}</span>
				{suffix && (
					<span className="text-[10px] opacity-70 tabular-nums">
						· {suffix}
					</span>
				)}
			</div>
		</div>
	);
}
