"use client";

import { Button } from "@ui/components/button";
import { cn } from "@ui/lib";
import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function PricingSection() {
	const t = useTranslations();

	const plans = [
		{
			key: "free" as const,
			featureCount: 3,
			highlighted: false,
		},
		{
			key: "pro" as const,
			featureCount: 6,
			highlighted: true,
		},
	];

	return (
		<section id="pricing" className="scroll-mt-16 py-16 lg:py-20 xl:py-28 bg-muted/30">
			<div className="container">
				<div className="mb-10 text-center">
					<small className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 font-semibold text-xs uppercase tracking-wider text-primary">
						{t("landingPricing.label")}
					</small>
					<h2 className="font-serif font-medium text-2xl md:text-3xl lg:text-4xl xl:text-5xl leading-tighter text-foreground">
						{t("landingPricing.title")}
					</h2>
				</div>

				<div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
					{plans.map((plan) => (
						<div
							key={plan.key}
							className={cn(
								"relative rounded-3xl p-6 lg:p-8 transition-all duration-300",
								plan.highlighted
									? "border-2 border-primary bg-card shadow-xl shadow-primary/10 hover:shadow-2xl hover:shadow-primary/15 scale-[1.02]"
									: "border border-border/50 bg-card hover:border-border hover:shadow-lg",
							)}
						>
							{plan.highlighted && (
								<span className="absolute -top-3 start-6 inline-flex items-center rounded-full bg-primary px-4 py-1 text-primary-foreground text-xs font-bold">
									{t(`landingPricing.${plan.key}.badge`)}
								</span>
							)}

							<h3 className="font-medium text-foreground text-xl">
								{t(`landingPricing.${plan.key}.name`)}
							</h3>
							<p className="mt-1 text-foreground/60 text-sm">
								{t(`landingPricing.${plan.key}.description`)}
							</p>

							<div className="mt-6 mb-6">
								<span className="font-black text-foreground text-4xl lg:text-5xl tracking-tight">
									{t(`landingPricing.${plan.key}.price`)}
								</span>
							</div>

							<ul className="mb-8 space-y-3">
								{Array.from(
									{ length: plan.featureCount },
									(_, i) => (
										<li
											key={i}
											className="flex items-center gap-3 text-foreground/80 text-sm"
										>
											<div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
												<CheckIcon className="size-3 text-primary" />
											</div>
											{t(
												`landingPricing.${plan.key}.features.${i + 1}`,
											)}
										</li>
									),
								)}
							</ul>

							<Button
								asChild
								size="lg"
								variant={plan.highlighted ? "primary" : "outline"}
								className={cn(
									"w-full",
									plan.highlighted
										? "h-12 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
										: "h-12 text-base font-semibold",
								)}
							>
								<Link href="/auth/signup">
									{t(`landingPricing.${plan.key}.cta`)}
								</Link>
							</Button>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
