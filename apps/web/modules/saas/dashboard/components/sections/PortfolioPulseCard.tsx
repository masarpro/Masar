"use client";

import { useTranslations } from "next-intl";

interface PulseProject {
	id: string;
	name: string | null;
	progress: number | string | null;
}

/**
 * Botly-style progress widget (replaces the old "operational overview"):
 * average completion of active projects as a big figure + per-project
 * mini bars — the same label/number/bar rhythm as Botly's storage rows.
 */
export function PortfolioPulseCard({
	projects,
}: {
	projects: PulseProject[];
}) {
	const t = useTranslations();

	const withProgress = projects.map((p) => ({
		...p,
		pct: Math.min(Math.round(Number(p.progress ?? 0)), 100),
	}));
	const avg =
		withProgress.length > 0
			? Math.round(
					withProgress.reduce((s, p) => s + p.pct, 0) / withProgress.length,
				)
			: 0;
	const top = withProgress.slice(0, 3);

	return (
		<div className="flex h-full min-h-0 flex-col gap-3 rounded-3xl border-2 bg-card p-5">
			<div className="flex shrink-0 items-baseline justify-between gap-2">
				<p className="truncate text-base font-semibold text-card-foreground">
					{t("projects.overview.progress")}
				</p>
				<p className="shrink-0 text-2xl font-bold tabular-nums text-card-foreground">
					{avg}
					<span className="text-base text-muted-foreground">%</span>
				</p>
			</div>

			<div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto">
				{top.map((p) => (
					<div key={p.id} className="min-w-0">
						<div className="mb-1 flex items-center justify-between gap-2 text-xs">
							<span className="truncate text-muted-foreground">
								{p.name || t("projects.unnamed")}
							</span>
							<span className="shrink-0 font-semibold tabular-nums text-card-foreground">
								{p.pct}%
							</span>
						</div>
						<div className="h-2 overflow-hidden rounded-[4px] bg-muted">
							<div
								className="h-full rounded-[4px] bg-chart-4"
								style={{ width: `${p.pct}%` }}
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
