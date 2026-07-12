"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { Button } from "@ui/components/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Botly hero card (Figma: Unlock pro insights + Dashboard/Light 120:11546):
 * pastel-gradient card, bold title, Botly primary button (48px / 12px
 * radius, Figma 43:12), and an inner surface strip of large stats.
 * Gradient derived from Botly Brand tints — the Figma gradient variable
 * serializes empty via MCP (documented).
 */
export function BotlyHero({
	organizationSlug,
	orgName,
	activeProjects,
	bankBalance,
	cashBalance,
	showFinance,
	showProjects,
}: {
	organizationSlug: string;
	orgName: string;
	activeProjects: number | null;
	bankBalance: number | null;
	cashBalance: number | null;
	showFinance: boolean;
	showProjects: boolean;
}) {
	const t = useTranslations();

	const stats: Array<{ label: string; value: React.ReactNode }> = [];
	if (showProjects && activeProjects !== null) {
		stats.push({
			label: t("dashboard.operational.activeProjects"),
			value: activeProjects,
		});
	}
	if (showFinance && bankBalance !== null) {
		stats.push({
			label: t("dashboard.kpi.bankBalance"),
			value: <Currency amount={bankBalance} />,
		});
	}
	if (showFinance && cashBalance !== null) {
		stats.push({
			label: t("dashboard.kpi.cashBalance"),
			value: <Currency amount={cashBalance} />,
		});
	}

	return (
		<div className="relative flex h-full min-h-0 flex-col justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-bl from-chart-1/25 via-chart-3/15 to-chart-2/20 p-5 sm:p-6 dark:from-chart-1/10 dark:via-transparent dark:to-chart-2/10">
			<div className="flex min-h-0 flex-col items-start gap-4">
				<h2 className="max-w-xl text-2xl font-bold leading-snug text-foreground xl:text-3xl">
					{t("dashboard.welcome.greeting", { name: orgName })}
				</h2>
				<Button asChild variant="primary" size="lg">
					<Link href={`/app/${organizationSlug}/finance`}>
						{t("dashboard.cashFlow.goToFinance")}
						<ChevronLeft className="rtl-flip" />
					</Link>
				</Button>
			</div>

			{stats.length > 0 && (
				<div
					className="grid shrink-0 gap-3 rounded-2xl bg-card p-4 sm:p-5"
					style={{
						gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`,
					}}
				>
					{stats.map((s) => (
						<div key={s.label} className="min-w-0">
							<p className="truncate text-xs text-muted-foreground sm:text-sm">
								{s.label}
							</p>
							<p className="mt-0.5 truncate text-xl font-bold tabular-nums text-card-foreground xl:text-3xl">
								{s.value}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
