"use client";

import { ChevronLeft } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";

// The chart (and with it the whole recharts library) loads as its own chunk
// AFTER the panel frame has painted — recharts stays out of the org-home
// initial bundle. The loading placeholder reserves the chart's exact box.
const FinancePanelChart = dynamic(() => import("./FinancePanelChart"), {
	ssr: false,
	loading: () => (
		<div className="w-full flex-1 min-h-[140px] max-h-44 sm:max-h-none" />
	),
});

interface FinancePanelProps {
	bankBalance: number;
	cashBalance: number;
	financialTrend: Array<{ month: string; expenses: number; claims: number }>;
	organizationSlug: string;
}

/**
 * Botly Membership widget (Figma 69:3172): white 32px card, title, rounded
 * bar chart in Brand/01+02. Balances moved to the BotlyHero strip — props
 * kept for API stability.
 */
export function FinancePanel({
	financialTrend,
	organizationSlug,
}: FinancePanelProps) {
	const t = useTranslations();

	return (
		<div className="flex flex-1 flex-col gap-4 rounded-[var(--botly-radius-card)] border-2 bg-card p-6 overflow-hidden">
			<div className="flex shrink-0 items-center justify-between">
				<p className="text-xl font-semibold leading-6 text-card-foreground">
					{t("dashboard.financePanel.cashFlowTitle")}
				</p>
				<Link
					href={`/app/${organizationSlug}/finance`}
					className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
				>
					<span>{t("dashboard.cashFlow.goToFinance")}</span>
					<ChevronLeft className="h-3 w-3 rtl-flip" />
				</Link>
			</div>

			<div className="flex min-h-0 flex-1 flex-col">
				<FinancePanelChart financialTrend={financialTrend} />
			</div>
		</div>
	);
}
