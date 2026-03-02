"use client";

import {
	FileSignatureIcon,
	HardHatIcon,
	LayoutDashboardIcon,
	ReceiptIcon,
	ShieldIcon,
	UserCheckIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

const featureIcons = [
	LayoutDashboardIcon,
	HardHatIcon,
	ReceiptIcon,
	FileSignatureIcon,
	UserCheckIcon,
	ShieldIcon,
];

const featureKeys = ["1", "2", "3", "4", "5", "6"] as const;

export function Features() {
	const t = useTranslations();

	return (
		<section id="features" className="scroll-my-20 py-16 lg:py-20 xl:py-28">
			<div className="container">
				<div className="mb-10 max-w-3xl">
					<small className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 font-semibold text-xs uppercase tracking-wider text-primary">
						{t("features.label")}
					</small>
					<h2 className="font-serif font-medium text-3xl sm:text-4xl leading-tighter text-foreground">
						{t("features.title")}
					</h2>
					<p className="mt-3 text-base text-foreground/60 lg:text-lg">
						{t("features.description")}
					</p>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{featureKeys.map((key, i) => {
						const Icon = featureIcons[i];
						return (
							<div
								key={key}
								className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 lg:p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-2 after:absolute after:bottom-0 after:start-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-500 hover:after:w-full"
							>
								<div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
									<Icon className="size-7 text-primary" />
								</div>
								<h3 className="font-medium text-foreground text-lg">
									{t(`features.items.${key}.title`)}
								</h3>
								<p className="mt-2 text-foreground/60 text-sm">
									{t(`features.items.${key}.description`)}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
