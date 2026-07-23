"use client";

import { cn } from "@ui/lib";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface ModuleHeroCardProps {
	/** Page name shown as the big headline (e.g. "المالية", "التسعير"). */
	title: string;
	/** Optional greeting / context line under the title. */
	subtitle?: string;
	/** KPI cells rendered in the glass strip along the bottom. */
	stats: Array<{ label: string; value: ReactNode }>;
	/** Primary Botly button in the top-trailing corner. */
	cta?: { label: string; href: string };
	/** Fill the parent's height (title top, strip bottom) — for side-by-side rows. */
	fill?: boolean;
}

/**
 * Botly "Unlock pro insights" hero (Figma 45:4531) generalised for module
 * landing pages (finance, pricing) so they share the home dashboard's signature
 * big card: gradient rounded-[32px], page name top-leading, primary #1d1d1d
 * button top-trailing, and a glass KPI strip along the bottom. Unlike the home
 * `BotlyHero` (fixed-viewport, absolute), this flows normally since these pages
 * scroll. Light art is kept in dark mode, exactly like Botly's dark dashboard.
 */
export function ModuleHeroCard({
	title,
	subtitle,
	stats,
	cta,
	fill,
}: ModuleHeroCardProps) {
	// With more than 3 KPIs the strip wraps and uses smaller type so long
	// currency values stay readable instead of truncating.
	const compact = stats.length > 3;

	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-[32px] p-3",
				fill && "flex h-full flex-col justify-between",
			)}
			style={{
				backgroundImage:
					"linear-gradient(235.49deg, rgb(214, 220, 209) 57.337%, rgb(255, 221, 180) 81.642%, rgb(199, 180, 255) 105.59%)",
			}}
		>
			{/* Title + primary action */}
			<div className="flex items-start gap-3 px-3 pt-3 pb-6 xl:px-6 xl:pt-6 xl:pb-8">
				<div className="min-w-0 flex-1">
					<h2 className="truncate text-xl font-bold leading-tight text-[#1d1d1d] xl:text-3xl">
						{title}
					</h2>
					{subtitle && (
						<p className="mt-1 truncate text-sm font-medium text-[#1d1d1d]/70 xl:text-base">
							{subtitle}
						</p>
					)}
				</div>
				{cta && (
					// Botly Button 45:4490: #1d1d1d, rounded-12, semibold.
					<Link
						href={cta.href}
						className="hidden shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#1d1d1d] px-4 py-2.5 text-sm font-semibold leading-6 text-white transition-opacity hover:opacity-90 sm:flex"
					>
						{cta.label}
						<ChevronLeft className="size-5 rtl-flip" />
					</Link>
				)}
			</div>

			{/* Glass KPI strip — Figma 45:4463. Always allowed to wrap: on small
			    desktop widths long currency values push cells to a second row
			    instead of truncating into unreadable fragments. */}
			{stats.length > 0 && (
				<div
					className={cn(
						"flex w-full flex-wrap gap-4 gap-y-3 rounded-[24px] border border-[rgba(255,255,255,0.7)] bg-gradient-to-b from-[rgba(255,255,255,0.69)] to-white px-5 py-3.5 backdrop-blur-[24px] xl:gap-6 xl:gap-y-4 xl:px-9 xl:py-5",
					)}
				>
					{stats.map((s) => (
						<div
							key={s.label}
							className={cn(
								"flex min-w-0 flex-1 flex-col gap-1 xl:gap-1.5",
								compact ? "min-w-[140px] basis-[28%]" : "min-w-[150px]",
							)}
						>
							<p
								className={cn(
									"truncate text-xs font-semibold leading-tight text-[#1d1d1d]",
									compact
										? "xl:text-sm xl:leading-5"
										: "xl:text-sm xl:leading-5 2xl:text-[17px] 2xl:leading-6",
								)}
							>
								{s.label}
							</p>
							<p
								className={cn(
									"truncate font-bold tabular-nums leading-none tracking-[-0.5px] text-[#1d1d1d]",
									compact
										? "text-lg xl:text-2xl xl:leading-[1.1]"
										: "text-xl xl:text-2xl xl:leading-[1.1] 2xl:text-4xl",
								)}
							>
								{s.value}
							</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
