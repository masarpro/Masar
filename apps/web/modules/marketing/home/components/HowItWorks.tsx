"use client";

import { useTranslations } from "next-intl";

const stepKeys = ["1", "2", "3"] as const;

// Three Botly widget cards with inverted number chips.
export function HowItWorks() {
	const t = useTranslations();

	return (
		<section id="how" className="bg-background px-6 py-24 md:py-32">
			<div className="mx-auto max-w-[1000px]">
				{/* Header */}
				<div className="bl-rv mx-auto mb-12 max-w-[660px] text-center md:mb-14">
					<span className="inline-flex items-center rounded-full border-2 bg-card px-4 py-1.5 text-[13px] font-semibold text-muted-foreground">
						{t("howItWorks.label")}
					</span>
					<h2 className="mt-4 text-3xl font-extrabold text-foreground md:text-4xl">
						{t("howItWorks.title")}
					</h2>
				</div>

				<div className="bl-rv grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
					{stepKeys.map((key, i) => (
						<div
							key={key}
							className="rounded-[var(--botly-radius-card)] border-2 bg-card p-6 md:p-8"
						>
							<span className="grid size-11 place-items-center rounded-xl bg-primary text-base font-bold text-primary-foreground">
								0{i + 1}
							</span>
							<h3 className="mt-5 text-lg font-bold text-foreground">
								{t(`howItWorks.steps.${key}.title`)}
							</h3>
							<p className="mt-1.5 leading-[1.8] text-muted-foreground">
								{t(`howItWorks.steps.${key}.description`)}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
