"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * LITERAL clone of Botly "Unlock pro insights" (Figma 45:4531) — every
 * value below is read from get_design_context, RTL-mirrored:
 * - card: rounded-[32px], gradient 235.49deg rgb(214,220,209) 57.3% →
 *   rgb(255,221,180) 81.6% → rgb(199,180,255) 105.6%
 * - content block: inset 48px, title SF 64/64 bold → (Arabic-scaled),
 *   gap 24px, button #1d1d1d px-24 py-12 rounded-12 gap-12 16/24 semibold
 * - stats strip: inset 12px, glass (blur 24, white 69%→100%, border
 *   white/70), rounded-24, px-36 py-24, gap-24; cells: label 18/24
 *   semibold, value 56/64 bold tracking -0.84 (clamped for real data)
 * The card keeps its light art in dark mode — exactly as Botly's dark
 * dashboard (120:11549) does.
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
		<div
			className="relative h-full min-h-[320px] overflow-hidden rounded-[32px]"
			style={{
				backgroundImage:
					"linear-gradient(235.49deg, rgb(214, 220, 209) 57.337%, rgb(255, 221, 180) 81.642%, rgb(199, 180, 255) 105.59%)",
			}}
		>
			{/* Content — greeting on a single line + finance button beside it */}
			<div className="absolute inset-x-6 top-6 flex items-center gap-3 xl:inset-x-12 xl:top-10">
				<h2 className="min-w-0 flex-1 truncate text-base font-bold leading-tight text-[#1d1d1d] xl:text-xl">
					{t("dashboard.welcome.greeting", { name: orgName })}
				</h2>
				{/* Botly Button 45:4490: #1d1d1d, rounded-12, semibold */}
				{showFinance && (
					<Link
						href={`/app/${organizationSlug}/finance`}
						className="flex shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#1d1d1d] px-4 py-2.5 text-sm font-semibold leading-6 text-white transition-opacity hover:opacity-90"
					>
						{t("dashboard.cashFlow.goToFinance")}
						<ChevronLeft className="size-5 rtl-flip" />
					</Link>
				)}
			</div>

			{/* Stats strip — Figma 45:4463: 12px inset, glass, rounded-24, px-36 py-24 */}
			{stats.length > 0 && (
				<div className="absolute inset-x-3 bottom-3">
					<div
						className="flex w-full gap-4 rounded-[24px] border border-[rgba(255,255,255,0.7)] bg-gradient-to-b from-[rgba(255,255,255,0.69)] to-white px-6 py-4 backdrop-blur-[24px] xl:gap-6 xl:px-9 xl:py-6"
					>
						{stats.map((s) => (
							<div key={s.label} className="flex min-w-0 flex-1 flex-col gap-1 xl:gap-2">
								<p className="truncate text-sm font-semibold leading-6 text-[#1d1d1d] xl:text-[18px]">
									{s.label}
								</p>
								<p className="truncate text-2xl font-bold tabular-nums leading-none tracking-[-0.84px] text-[#1d1d1d] xl:text-5xl xl:leading-[1.1]">
									{s.value}
								</p>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
