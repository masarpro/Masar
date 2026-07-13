"use client";

import { Currency } from "@saas/finance/components/shared/Currency";
import { formatDateShort } from "@shared/lib/formatters";
import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@ui/lib";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";

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
 *
 * Carousel: the SAME card frame hosts 4 permission-gated slides (finance /
 * projects pulse / due cash-flows / ZATCA). Navigation is circular, arrows
 * reuse the GlobalHeader icon-button treatment, and the selection persists
 * per user per organization via dashboard.setHeroCardPreference.
 */

export type HeroCardKey = "finance" | "projects" | "cashflow" | "zatca";

export interface HeroMetrics {
	projectsPulse: {
		delayedCount: number;
		maxDelayDays: number;
		avgProgress: number;
	} | null;
	receivables: {
		retentionExpected: number;
		subcontractorDues: number;
	} | null;
	zatca: {
		invoicesThisMonth: number;
		compliance: { cleared: number; total: number } | null;
		vatThisMonth: number;
		lastInvoice: { invoiceNo: string; date: string | Date } | null;
	} | null;
}

interface HeroStat {
	label: string;
	value: React.ReactNode;
}

interface HeroCard {
	key: HeroCardKey;
	title: string;
	stats: HeroStat[];
	cta: { label: string; href: string };
}

export function BotlyHero({
	organizationId,
	organizationSlug,
	orgName,
	activeProjects,
	bankBalance,
	cashBalance,
	showFinance,
	showProjects,
	heroMetrics,
	clientReceivables,
	fieldUpdatedToday,
}: {
	organizationId: string;
	organizationSlug: string;
	orgName: string;
	activeProjects: number | null;
	bankBalance: number | null;
	cashBalance: number | null;
	showFinance: boolean;
	showProjects: boolean;
	heroMetrics: HeroMetrics | null;
	clientReceivables: number | null;
	fieldUpdatedToday: number | null;
}) {
	const t = useTranslations();
	const queryClient = useQueryClient();

	// ── Saved selection (per user per organization, prefetched on the server) ──
	const { data: preference } = useQuery({
		...orpc.dashboard.getHeroCardPreference.queryOptions({
			input: { organizationId },
		}),
		enabled: !!organizationId,
		staleTime: STALE_TIMES.ORGANIZATION,
	});

	const setPreference = useMutation(
		orpc.dashboard.setHeroCardPreference.mutationOptions({
			onSettled: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.dashboard.getHeroCardPreference.key(),
				});
			},
		}),
	);

	// Local override wins right after an interaction (optimistic), the saved
	// preference is the SSR-hydrated default before any interaction.
	const [localKey, setLocalKey] = useState<HeroCardKey | null>(null);

	// ── Slides (permission-gated: RBAC mirrors the sidebar) ──
	const cards: HeroCard[] = [];

	// 1) الوضع المالي — the original hero (also hosts the active-projects cell
	//    for members without finance view, exactly like the pre-carousel card).
	const financeStats: HeroStat[] = [];
	if (showProjects && activeProjects !== null) {
		financeStats.push({
			label: t("dashboard.operational.activeProjects"),
			value: activeProjects,
		});
	}
	if (showFinance && bankBalance !== null) {
		financeStats.push({
			label: t("dashboard.kpi.bankBalance"),
			value: <Currency amount={bankBalance} />,
		});
	}
	if (showFinance && cashBalance !== null) {
		financeStats.push({
			label: t("dashboard.kpi.cashBalance"),
			value: <Currency amount={cashBalance} />,
		});
	}
	if (financeStats.length > 0) {
		cards.push({
			key: "finance",
			title: t("dashboard.hero.cards.finance"),
			stats: financeStats,
			cta: {
				label: t("dashboard.cashFlow.goToFinance"),
				href: `/app/${organizationSlug}/finance`,
			},
		});
	}

	// 2) نبض المشاريع — operational, money-free.
	if (showProjects && heroMetrics?.projectsPulse) {
		const pulse = heroMetrics.projectsPulse;
		cards.push({
			key: "projects",
			title: t("dashboard.hero.cards.projects"),
			stats: [
				{
					label:
						pulse.maxDelayDays > 0
							? t("dashboard.hero.stats.delayedProjectsWithMax", {
									days: pulse.maxDelayDays,
								})
							: t("dashboard.hero.stats.delayedProjects"),
					value: pulse.delayedCount,
				},
				{
					label: t("dashboard.hero.stats.avgProgress"),
					value: `${pulse.avgProgress}%`,
				},
				{
					label: t("dashboard.hero.stats.sitesUpdatedToday"),
					value: fieldUpdatedToday ?? 0,
				},
			],
			cta: {
				label: t("dashboard.hero.goToProjects"),
				href: `/app/${organizationSlug}/projects`,
			},
		});
	}

	// 3) التدفقات المستحقة — receivables & upcoming liquidity.
	if (showFinance && heroMetrics?.receivables) {
		const receivables = heroMetrics.receivables;
		cards.push({
			key: "cashflow",
			title: t("dashboard.hero.cards.cashflow"),
			stats: [
				{
					label: t("dashboard.hero.stats.clientReceivables"),
					value: <Currency amount={clientReceivables ?? 0} />,
				},
				{
					label: t("dashboard.hero.stats.retentionExpected"),
					value: <Currency amount={receivables.retentionExpected} />,
				},
				{
					label: t("dashboard.hero.stats.subcontractorDues"),
					value: <Currency amount={receivables.subcontractorDues} />,
				},
			],
			cta: {
				label: t("dashboard.hero.goToInvoices"),
				href: `/app/${organizationSlug}/finance/invoices`,
			},
		});
	}

	// 4) الامتثال والفوترة (ZATCA).
	if (showFinance && heroMetrics?.zatca) {
		const zatca = heroMetrics.zatca;
		cards.push({
			key: "zatca",
			title: t("dashboard.hero.cards.zatca"),
			stats: [
				{
					label: t("dashboard.hero.stats.invoicesThisMonth"),
					value: zatca.invoicesThisMonth,
				},
				{
					label: t("dashboard.hero.stats.zatcaCompliance"),
					value: zatca.compliance
						? `${zatca.compliance.cleared}/${zatca.compliance.total}`
						: "—",
				},
				{
					label: t("dashboard.hero.stats.vatDue"),
					value: <Currency amount={zatca.vatThisMonth} />,
				},
				{
					label: zatca.lastInvoice
						? t("dashboard.hero.stats.lastInvoiceAt", {
								date: formatDateShort(zatca.lastInvoice.date),
							})
						: t("dashboard.hero.stats.lastInvoice"),
					value: zatca.lastInvoice?.invoiceNo ?? "—",
				},
			],
			cta: {
				label: t("dashboard.hero.goToInvoices"),
				href: `/app/${organizationSlug}/finance/invoices`,
			},
		});
	}

	// Saved card the member can no longer see (role changed) → first visible.
	const savedKey = localKey ?? preference?.heroCardKey ?? "finance";
	const activeIndex = Math.max(
		0,
		cards.findIndex((card) => card.key === savedKey),
	);
	const activeCard: HeroCard | undefined = cards[activeIndex];

	const selectCard = (index: number) => {
		if (cards.length === 0) return;
		const next = cards[(index + cards.length) % cards.length];
		if (!next || next.key === savedKey) return;
		setLocalKey(next.key);
		setPreference.mutate({ organizationId, heroCardKey: next.key });
	};

	// Same icon-button treatment as the GlobalHeader nav chevrons (69:1786),
	// tinted for the card's light art (which stays light in dark mode too).
	const arrowClass = cn(
		"flex size-9 shrink-0 items-center justify-center rounded-xl text-[#1d1d1d] transition-colors xl:size-10",
		"hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
	);

	return (
		<div
			className="relative h-full min-h-[190px] overflow-hidden rounded-[32px] xl:min-h-0"
			style={{
				backgroundImage:
					"linear-gradient(235.49deg, rgb(214, 220, 209) 57.337%, rgb(255, 221, 180) 81.642%, rgb(199, 180, 255) 105.59%)",
			}}
		>
			{/* Content — greeting on a single line + contextual CTA + carousel arrows */}
			<div className="absolute inset-x-6 top-6 flex items-center gap-2 xl:inset-x-12 xl:top-10 xl:gap-3">
				<h2 className="min-w-0 flex-1 truncate text-base font-bold leading-tight text-[#1d1d1d] xl:text-xl">
					{t("dashboard.welcome.greeting", { name: orgName })}
				</h2>
				{/* Botly Button 45:4490: #1d1d1d, rounded-12, semibold.
				    Hidden on mobile so the org name gets the full row on one line. */}
				{activeCard && (
					<Link
						href={activeCard.cta.href}
						className="hidden shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#1d1d1d] px-4 py-2.5 text-sm font-semibold leading-6 text-white transition-opacity hover:opacity-90 xl:flex"
					>
						{activeCard.cta.label}
						<ChevronLeft className="size-5 rtl-flip" />
					</Link>
				)}
				{cards.length > 1 && (
					<div className="flex shrink-0 items-center">
						<button
							type="button"
							onClick={() => selectCard(activeIndex - 1)}
							className={arrowClass}
							aria-label={t("dashboard.hero.previousCard")}
						>
							<ChevronLeft className="size-5 rtl-flip" />
						</button>
						<button
							type="button"
							onClick={() => selectCard(activeIndex + 1)}
							className={arrowClass}
							aria-label={t("dashboard.hero.nextCard")}
						>
							<ChevronRight className="size-5 rtl-flip" />
						</button>
					</div>
				)}
			</div>

			{/* Bottom block — card title + dots, then the glass stats strip
			    (Figma 45:4463: 12px inset, glass, rounded-24, px-36 py-24) */}
			{activeCard && (
				<div className="absolute inset-x-3 bottom-3 flex flex-col gap-1.5">
					{cards.length > 1 && (
						<div className="flex items-center justify-between px-3">
							<span className="truncate text-xs font-semibold text-[#1d1d1d]/60 xl:text-sm">
								{activeCard.title}
							</span>
							<div className="flex shrink-0 items-center gap-1.5">
								{cards.map((card, index) => (
									<button
										key={card.key}
										type="button"
										onClick={() => selectCard(index)}
										aria-label={card.title}
										aria-current={index === activeIndex}
										className={cn(
											"h-1.5 rounded-full transition-all",
											index === activeIndex
												? "w-5 bg-[#1d1d1d]"
												: "w-1.5 bg-[#1d1d1d]/25 hover:bg-[#1d1d1d]/40",
										)}
									/>
								))}
							</div>
						</div>
					)}
					{activeCard.stats.length > 0 && (
						<div className="flex w-full gap-4 rounded-[24px] border border-[rgba(255,255,255,0.7)] bg-gradient-to-b from-[rgba(255,255,255,0.69)] to-white px-6 py-3.5 backdrop-blur-[24px] xl:gap-6 xl:px-9 xl:py-5">
							{activeCard.stats.map((stat) => (
								<div
									key={stat.label}
									className="flex min-w-0 flex-1 flex-col gap-1 xl:gap-1.5"
								>
									<p className="truncate text-sm font-semibold leading-6 text-[#1d1d1d] xl:text-[17px]">
										{stat.label}
									</p>
									<p className="truncate text-2xl font-bold tabular-nums leading-none tracking-[-0.84px] text-[#1d1d1d] xl:text-4xl xl:leading-[1.1]">
										{stat.value}
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
