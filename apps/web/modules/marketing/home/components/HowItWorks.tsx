"use client";

import { useTranslations } from "next-intl";

const stepKeys = ["1", "2", "3"] as const;

export function HowItWorks() {
	const t = useTranslations();

	return (
		<section className="py-12 lg:py-16 xl:py-24 bg-card">
			<div className="container">
				<div className="mb-8 text-center">
					<small className="mb-4 block font-medium text-xs uppercase tracking-wider text-primary">
						{t("howItWorks.label")}
					</small>
					<h2 className="font-serif font-medium text-2xl md:text-3xl lg:text-4xl leading-tighter text-foreground">
						{t("howItWorks.title")}
					</h2>
				</div>

				<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
					{stepKeys.map((key) => (
						<div key={key} className="text-center">
							<div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl">
								{key}
							</div>
							<h3 className="font-medium text-foreground text-lg">
								{t(`howItWorks.steps.${key}.title`)}
							</h3>
							<p className="mt-2 text-foreground/60 text-sm">
								{t(`howItWorks.steps.${key}.description`)}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
