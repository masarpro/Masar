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
		hot: true,
		hasSubtitle: true,
		featureCount: 7,
		ctaHref: "/auth/signup?plan=pro_yearly",
		delay: 0.12,
	},
	{
		id: "monthly",
		hot: false,
		hasSubtitle: false,
		featureCount: 7,
		ctaHref: "/auth/signup?plan=pro_monthly",
		delay: 0.24,
	},
];

export function PricingSection() {
	const t = useTranslations();

	return (
		<section
			id="pricing"
			className="scroll-mt-16 py-24 md:py-32 px-6"
			style={{ background: "var(--mas-bg)" }}
		>
			<div className="max-w-[1180px] mx-auto">
				{/* Header */}
				<div className="mas-sec-head mas-rv max-w-[660px] mx-auto text-center mb-14 md:mb-16">
					<span className="mas-dim">{t("landingPricing.label")}</span>
					<p className="mt-4">{t("landingPricing.subtitle")}</p>
				</div>

				{/* Plans */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-[460px] md:max-w-none mx-auto">
					{PLANS.map((plan) => {
						const ns = `landingPricing.${plan.id}`;
						return (
							<div
								key={plan.id}
								className={`mas-plan mas-rv${plan.hot ? " hot max-md:order-first" : ""}`}
								style={
									{
										"--d": `${plan.delay}s`,
									} as React.CSSProperties
								}
							>
								{plan.hot && (
									<span className="mas-flag">
										{t("landingPricing.badges.popular")}
									</span>
								)}
								<h3>{t(`${ns}.name`)}</h3>
								<p className="for">{t(`${ns}.description`)}</p>
								<div className="mas-price">
									<b>{t(`${ns}.price`)}</b>
									<span>{t(`${ns}.period`)}</span>
								</div>
								{plan.hasSubtitle && (
									<div className="mas-save">
										{t(`${ns}.subtitle`)}
									</div>
								)}
								<ul>
									{Array.from(
										{ length: plan.featureCount },
										(_, i) => (
											<li key={`${plan.id}-${i + 1}`}>
												{t(`${ns}.features.${i + 1}`)}
											</li>
										),
									)}
								</ul>
								<Link
									href={plan.ctaHref}
									className={`mas-btn w-full ${plan.hot ? "mas-btn-primary" : "mas-btn-ghost"}`}
								>
									{t(`${ns}.cta`)}
								</Link>
							</div>
						);
					})}
				</div>

				{/* Enterprise band */}
				<div className="mas-ent mas-rv mas-on-dark">
					<div>
						<h3>{t("landingPricing.enterprise.name")}</h3>
						<p>
							{Array.from({ length: 6 }, (_, i) =>
								t(
									`landingPricing.enterprise.features.${i + 1}`,
								),
							).join(" · ")}{" "}
							— <b>{t("landingPricing.enterprise.price")}</b>{" "}
							{t("landingPricing.enterprise.subtitle")}
						</p>
					</div>
					<Link
						href="/contact"
						className="mas-btn mas-btn-ghost shrink-0"
					>
						{t("landingPricing.enterprise.cta")}
					</Link>
				</div>
			</div>
		</section>
	);
}
