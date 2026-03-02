"use client";

import { LandmarkIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export function ZatcaBadge() {
	const t = useTranslations();

	return (
		<section className="py-12 lg:py-16">
			<div className="container max-w-3xl">
				<div className="flex flex-col items-center gap-4 rounded-3xl bg-card p-6 text-center lg:p-8">
					<LandmarkIcon className="size-10 text-primary" />
					<h3 className="font-medium text-foreground text-lg lg:text-xl">
						{t("zatca.title")}
					</h3>
					<p className="text-foreground/60 text-sm">
						{t("zatca.description")}
					</p>
					<span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 font-medium text-primary text-sm">
						{t("zatca.badge")}
					</span>
				</div>
			</div>
		</section>
	);
}
