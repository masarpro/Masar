"use client";

import { LandmarkIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function ZatcaBadge() {
	const t = useTranslations();

	return (
		<section className="py-12 lg:py-16">
			<div className="container max-w-3xl">
				<div className="flex flex-col items-center gap-4 rounded-3xl border border-border/50 bg-card p-8 text-center lg:p-10 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
					<div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
						<LandmarkIcon className="size-8 text-primary" />
					</div>
					<h3 className="font-medium text-foreground text-lg lg:text-xl">
						{t("zatca.title")}
					</h3>
					<p className="text-foreground/60 text-sm">
						{t("zatca.description")}
					</p>
					<span className="inline-flex items-center rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 font-bold text-primary text-sm">
						{t("zatca.badge")}
					</span>
				</div>
			</div>
		</section>
	);
}
