"use client";

import { useTranslations } from "next-intl";

// ZATCA compliance band as a flat Botly card.
export function ZatcaBadge() {
	const t = useTranslations();

	return (
		<section className="bg-background px-6 pb-24 md:pb-28">
			<div className="bl-rv mx-auto flex max-w-[860px] flex-wrap items-center gap-4 rounded-[24px] border-2 bg-card p-5 md:p-6">
				<span
					className="grid size-11 shrink-0 place-items-center rounded-xl bg-chart-1/25 text-xl"
					aria-hidden="true"
				>
					🏛️
				</span>
				<span className="min-w-0 flex-1 text-sm leading-[1.8] text-muted-foreground">
					<b className="text-foreground">{t("landingZatca.title")}:</b>{" "}
					{t("landingZatca.description")}
				</span>
				<span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-success/15 px-4 py-1.5 text-[12.5px] font-bold text-success">
					<span className="size-2 rounded-full bg-success" aria-hidden="true" />
					{t("landingZatca.badge")}
				</span>
			</div>
		</section>
	);
}
