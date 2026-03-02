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
		<section id="features" className="scroll-my-20 py-12 lg:py-16 xl:py-24">
			<div className="container">
				<div className="mb-8 max-w-3xl">
					<small className="mb-4 block font-medium text-xs uppercase tracking-wider text-primary">
						{t("features.label")}
					</small>
					<h2 className="font-serif font-medium text-2xl lg:text-3xl xl:text-4xl leading-tighter text-foreground">
						{t("features.title")}
					</h2>
					<p className="mt-2 text-base text-foreground/60 lg:text-lg">
						{t("features.description")}
					</p>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					{featureKeys.map((key, i) => {
						const Icon = featureIcons[i];
						return (
							<div
								key={key}
								className="rounded-2xl bg-card p-6 lg:p-8"
							>
								<div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10">
									<Icon className="size-6 text-primary" />
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
