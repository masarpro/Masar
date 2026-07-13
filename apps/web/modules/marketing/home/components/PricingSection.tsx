"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

type PlanId = "free" | "monthly" | "yearly";

type Plan = {
	id: PlanId;
	hot: boolean;
	hasSubtitle: boolean;
	featureCount: number;
	ctaHref: string;
	delay: number;
};

/* free / yearly (highlighted) / monthly — enterprise gets its own band */
const PLANS: Plan[] = [
	{
		id: "free",
		hot: false,
		hasSubtitle: false,
		featureCount: 3,
		ctaHref: "/auth/signup",
		delay: 0,
	},
	{
		id: "yearly",
		hot: false,
		hasSubtitle: true,
		featureCount: 7,
		ctaHref: "/auth/signup?plan=pro_yearly",
		delay: 0.12,
	},
	{
		id: "monthly",
		hot: true,
		hasSubtitle: false,
		featureCount: 7,
		ctaHref: "/auth/signup?plan=pro_monthly",
		delay: 0.24,
	},
];

/**
 * Botly pricing: flat widget cards; the highlighted plan is the INVERTED
 * card (Background invert), enterprise is a dark full-width band.
 */
export function PricingSection() {
	const t = useTranslations();

	return (
		<section
			id="pricing"
			className="scroll-mt-16 bg-background px-6 py-24 md:py-32"
		>
			<div className="mx-auto max-w-[1180px]">
				{/* Header */}
				<div className="bl-rv mx-auto mb-14 max-w-[660px] text-center md:mb-16">
					<span className="inline-flex items-center rounded-full border-2 bg-card px-4 py-1.5 text-[13px] font-semibold text-muted-foreground">
						{t("landingPricing.label")}
					</span>
					<p className="mt-4 text-lg leading-[1.8] text-muted-foreground">
						{t("landingPricing.subtitle")}
					</p>
				</div>

				{/* Plans */}
				<div className="mx-auto grid max-w-[460px] grid-cols-1 items-stretch gap-4 md:max-w-none md:grid-cols-3 md:gap-6">
					{PLANS.map((plan) => {
						const ns = `landingPricing.${plan.id}`;
						const hot = plan.hot;
						return (
							<div
								key={plan.id}
								className={`bl-rv relative flex flex-col rounded-[var(--botly-radius-card)] border-2 p-7 md:p-8 ${
									hot
										? "border-transparent bg-primary text-primary-foreground max-md:order-first"
										: "bg-card text-card-foreground"
								}`}
								style={{ "--d": `${plan.delay}s` } as React.CSSProperties}
							>
								{hot && (
									<span className="absolute -top-3.5 start-7 rounded-full bg-chart-1 px-4 py-1.5 text-xs font-bold text-[#1d1d1d]">
										{t("landingPricing.badges.popular")}
									</span>
								)}
								<h3 className="text-lg font-bold">{t(`${ns}.name`)}</h3>
								<p
									className={`mt-1 text-sm ${hot ? "text-primary-foreground/60" : "text-muted-foreground"}`}
								>
									{t(`${ns}.description`)}
								</p>
								<div className="mt-5 flex items-baseline gap-2">
									<b className="text-4xl font-black tabular-nums">
										{t(`${ns}.price`)}
									</b>
									<span
										className={`text-sm ${hot ? "text-primary-foreground/60" : "text-muted-foreground"}`}
									>
										{t(`${ns}.period`)}
									</span>
								</div>
								{plan.hasSubtitle && (
									<div className="mt-2 inline-flex self-start rounded-full bg-success px-3 py-1 text-xs font-bold text-success-foreground">
										{t(`${ns}.subtitle`)}
									</div>
								)}
								<ul className="mt-6 flex-1 space-y-3">
									{Array.from({ length: plan.featureCount }, (_, i) => (
										<li
											key={`${plan.id}-${i + 1}`}
											className="flex items-start gap-2.5 text-sm"
										>
											<span
												className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md text-[11px] font-bold ${
													hot
														? "bg-primary-foreground/15 text-primary-foreground"
														: "bg-success/15 text-success"
												}`}
												aria-hidden="true"
											>
												✓
											</span>
											<span
												className={
													hot
														? "text-primary-foreground/85"
														: "text-muted-foreground"
												}
											>
												{t(`${ns}.features.${i + 1}`)}
											</span>
										</li>
									))}
								</ul>
								<Link
									href={plan.ctaHref}
									className={`mt-7 inline-flex w-full items-center justify-center rounded-[12px] px-6 py-3.5 text-[15px] font-bold transition-opacity hover:opacity-90 ${
										hot
											? "bg-primary-foreground text-primary"
											: "bg-primary text-primary-foreground"
									}`}
								>
									{t(`${ns}.cta`)}
								</Link>
							</div>
						);
					})}
				</div>

				{/* Enterprise band — inverted Botly card */}
				<div className="bl-rv mt-6 flex flex-wrap items-center justify-between gap-6 rounded-[var(--botly-radius-card)] bg-primary p-7 text-primary-foreground md:mt-8 md:p-9">
					<div className="min-w-0">
						<h3 className="text-lg font-bold">
							{t("landingPricing.enterprise.name")}
						</h3>
						<p className="mt-2 max-w-[720px] text-sm leading-[1.9] text-primary-foreground/65">
							{Array.from({ length: 6 }, (_, i) =>
								t(`landingPricing.enterprise.features.${i + 1}`),
							).join(" · ")}{" "}
							—{" "}
							<b className="text-primary-foreground">
								{t("landingPricing.enterprise.price")}
							</b>{" "}
							{t("landingPricing.enterprise.subtitle")}
						</p>
					</div>
					<Link
						href="/contact"
						className="inline-flex shrink-0 items-center justify-center rounded-[12px] bg-primary-foreground px-7 py-3 text-[15px] font-bold text-primary transition-opacity hover:opacity-90"
					>
						{t("landingPricing.enterprise.cta")}
					</Link>
				</div>
			</div>
		</section>
	);
}
