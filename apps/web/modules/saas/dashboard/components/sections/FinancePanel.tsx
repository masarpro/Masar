"use client";

import { ChevronLeft } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { useTranslations } from "next-intl";

// The chart (and with it the whole recharts library) loads as its own chunk
// AFTER the panel frame has painted — recharts stays out of the org-home
// initial bundle. The loading placeholder reserves the chart's box.
const FinancePanelChart = dynamic(() => import("./FinancePanelChart"), {
	ssr: false,
	loading: () => <div className="h-full w-full" />,
});

interface FinancePanelProps {
	financialTrend: Array<{ month: string; expenses: number; claims: number }>;
	organizationSlug: string;
}

const compact = new Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
});

/**
 * Botly Membership widget (Figma 69:3172): surface card, title, rounded bar
 * chart in Brand/01+02 with Y-axis figures, plus 6-month totals in the
 * header so the chart reads as real numbers at a glance.
 */
export function FinancePanel({
	financialTrend,
	organizationSlug,
}: FinancePanelProps) {
	const t = useTranslations();

	const totals = useMemo(() => {
		const claims = financialTrend.reduce((s, m) => s + Number(m.claims || 0), 0);
		const expenses = financialTrend.reduce(
			(s, m) => s + Number(m.expenses || 0),
			0,
		);
		return { claims, expenses };
	}, [financialTrend]);

	return (
		<div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden rounded-3xl border-2 bg-card p-5">
			<div className="flex shrink-0 items-center justify-between gap-2">
				<p className="truncate text-base font-semibold text-card-foreground">
					{t("dashboard.financePanel.cashFlowTitle")}
				</p>
				<Link
					href={`/app/${organizationSlug}/finance`}
					className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
					aria-label={t("dashboard.cashFlow.goToFinance")}
				>
					<ChevronLeft className="h-3.5 w-3.5 rtl-flip" />
				</Link>
			</div>

			{/* 6-month totals — the "useful numbers" beside the bars */}
			<div className="flex shrink-0 items-center gap-4 text-xs">
				<span className="flex items-center gap-1.5">
					<i className="size-2.5 rounded-[3px] bg-chart-1" />
					<span className="text-muted-foreground">
						{t("dashboard.financial.revenueLabel")}
					</span>
					<b className="font-semibold tabular-nums text-card-foreground" dir="ltr">
						{compact.format(totals.claims)}
					</b>
				</span>
				<span className="flex items-center gap-1.5">
					<i className="size-2.5 rounded-[3px] bg-chart-2" />
					<span className="text-muted-foreground">
						{t("dashboard.financial.expensesLabel")}
					</span>
					<b className="font-semibold tabular-nums text-card-foreground" dir="ltr">
						{compact.format(totals.expenses)}
					</b>
				</span>
			</div>

			{/* Explicit height: ResponsiveContainer needs a computed height —
			    min-height alone resolves percentage children to 0 (prod bug). */}
			<div className="h-36 xl:h-auto xl:min-h-0 xl:flex-1">
				<FinancePanelChart financialTrend={financialTrend} />
			</div>
		</div>
	);
}
