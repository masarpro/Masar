"use client";

import { useTranslations } from "next-intl";

const stepKeys = ["1", "2", "3"] as const;

export function HowItWorks() {
	const t = useTranslations();

	return (
		<section className="relative py-16 lg:py-20 xl:py-28 overflow-hidden">
			{/* Subtle gradient background */}
			<div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-primary/[0.03] to-transparent" />

			<div className="container">
				<div className="mb-12 text-center">
					<small className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 font-semibold text-xs uppercase tracking-wider text-primary">
						{t("howItWorks.label")}
					</small>
					<h2 className="font-serif font-medium text-2xl md:text-3xl lg:text-4xl leading-tighter text-foreground">
						{t("howItWorks.title")}
					</h2>
				</div>

				<div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
					{/* Connecting line between steps (desktop only) */}
					<div className="hidden md:block absolute top-8 start-[16.67%] end-[16.67%] h-px bg-border -z-10" />

					{stepKeys.map((key) => (
						<div key={key} className="group text-center">
							<div className="relative mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/20 text-primary text-2xl font-bold transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20">
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
