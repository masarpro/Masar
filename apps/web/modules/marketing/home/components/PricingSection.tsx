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
		<section id="pricing" className="scroll-mt-16 py-12 lg:py-16 xl:py-24">
			<div className="container">
				<div className="mb-8 text-center">
					<small className="mb-4 block font-medium text-xs uppercase tracking-wider text-primary">
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
								"relative rounded-3xl p-6 lg:p-8",
								plan.highlighted
									? "border-2 border-primary bg-card"
									: "bg-card",
							)}
						>
							{plan.highlighted && (
								<span className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-primary-foreground text-xs font-medium">
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
								<span className="font-bold text-foreground text-3xl lg:text-4xl">
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
											<CheckIcon className="size-4 shrink-0 text-primary" />
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
								className="w-full"
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
