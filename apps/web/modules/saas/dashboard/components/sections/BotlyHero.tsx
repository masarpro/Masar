"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { Button } from "@ui/components/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * Botly hero card (Figma: Unlock pro insights + Dashboard/Light 120:11546):
 * pastel-gradient 32px-radius card, bold title, black pill CTA, and a white
 * inner strip of large stats. Gradient is derived from Botly Brand tints —
 * the Figma gradient variable serializes empty via MCP (documented).
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
		<div className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-[var(--botly-radius-card)] bg-gradient-to-bl from-chart-1/25 via-chart-3/15 to-chart-2/20 p-6 sm:p-8 dark:from-chart-1/10 dark:via-transparent dark:to-chart-2/10">
			<div>
				<h2 className="max-w-md text-3xl font-bold leading-snug text-foreground sm:text-4xl">
					{t("dashboard.welcome.greeting", { name: orgName })}
				</h2>
				<Button asChild variant="primary" size="lg" className="mt-6 w-fit rounded-full">
					<Link href={`/app/${organizationSlug}/finance`}>
						{t("dashboard.cashFlow.goToFinance")}
						<ChevronLeft className="size-5 rtl-flip" />
					</Link>
				</Button>
			</div>

			{stats.length > 0 && (
				<div
					className="grid gap-4 rounded-[20px] bg-card p-5 sm:p-6"
					style={{
						gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`,
					}}
				>
					{stats.map((s) => (
						<div key={s.label} className="min-w-0">
							<p className="truncate text-xs text-muted-foreground sm:text-sm">
								{s.label}
							</p>
							<p className="mt-1 truncate text-2xl font-bold tabular-nums text-card-foreground sm:text-4xl">
								{s.value}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
