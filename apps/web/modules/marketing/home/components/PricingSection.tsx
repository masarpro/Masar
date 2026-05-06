"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

type PlanId = "free" | "monthly" | "yearly" | "enterprise";

type Plan = {
	id: PlanId;
	badge: "popular" | "enterprise" | null;
	highlighted: boolean;
	hasSubtitle: boolean;
	featureCount: number;
	ctaHref: string;
	ctaVariant: "ghost" | "primary";
};

const PLANS: Plan[] = [
	{
		id: "free",
		badge: null,
		highlighted: false,
		hasSubtitle: false,
		featureCount: 3,
		ctaHref: "/auth/signup",
		ctaVariant: "ghost",
	},
	{
		id: "monthly",
		badge: null,
		highlighted: false,
		hasSubtitle: false,
		featureCount: 7,
		ctaHref: "/auth/signup?plan=pro_monthly",
		ctaVariant: "ghost",
	},
	{
		id: "yearly",
		badge: "popular",
		highlighted: true,
		hasSubtitle: true,
		featureCount: 7,
		ctaHref: "/auth/signup?plan=pro_yearly",
		ctaVariant: "primary",
	},
	{
		id: "enterprise",
		badge: "enterprise",
		highlighted: false,
		hasSubtitle: true,
		featureCount: 6,
		ctaHref: "/contact",
		ctaVariant: "ghost",
	},
];

export function PricingSection() {
	const t = useTranslations();

	return (
		<section
			id="pricing"
			className="scroll-mt-16 relative py-28 px-6"
			style={{ background: "var(--lp-bg)" }}
		>
			<div className="max-w-[1240px] mx-auto">
				{/* Header */}
				<div className="text-center mb-16">
					<div
						className="landing-section-label"
						style={{
							background:
								"linear-gradient(135deg, rgba(245,158,11,0.06), rgba(239,68,68,0.04))",
							border: "1px solid rgba(245,158,11,0.12)",
							color: "#F59E0B",
						}}
					>
						<span
							className="landing-dot"
							style={{
								background:
									"linear-gradient(135deg, #F59E0B, #EF4444)",
							}}
						/>
						{t("landingPricing.label")}
					</div>
					<h2
						className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.3]"
						style={{ color: "var(--lp-text)" }}
					>
						{t("landingPricing.title")}
					</h2>
					<p
						className="text-base sm:text-lg mt-4"
						style={{ color: "var(--lp-text-subtle)" }}
					>
						{t("landingPricing.subtitle")}
					</p>
				</div>

				{/* Pricing Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 xl:gap-4">
					{PLANS.map((plan) => (
						<PlanCard key={plan.id} plan={plan} t={t} />
					))}
				</div>
			</div>
		</section>
	);
}

function PlanCard({
	plan,
	t,
}: {
	plan: Plan;
	t: ReturnType<typeof useTranslations>;
}) {
	const ns = `landingPricing.${plan.id}`;
	const isHighlighted = plan.highlighted;
	const isEnterprise = plan.id === "enterprise";

	const cardStyle = isHighlighted
		? {
				background: "var(--lp-price-pro-bg)",
				border: "2px solid var(--lp-price-pro-border-color)",
				boxShadow: "var(--lp-price-pro-shadow)",
			}
		: {
				background: "var(--lp-price-free-bg)",
				border: "1px solid var(--lp-price-free-border)",
			};

	const ctaClass =
		plan.ctaVariant === "primary"
			? "btn-premium btn-premium-primary"
			: "btn-premium btn-premium-ghost";

	const badgeStyle =
		plan.badge === "popular"
			? {
					background: "linear-gradient(135deg, #0ea5e9, #06B6D4)",
					boxShadow:
						"0 4px 20px rgba(14,165,233,0.3), 0 0 40px rgba(6,182,212,0.1)",
				}
			: {
					background: "linear-gradient(135deg, #F59E0B, #B45309)",
					boxShadow:
						"0 4px 20px rgba(245,158,11,0.3), 0 0 40px rgba(180,83,9,0.1)",
				};

	const features = Array.from({ length: plan.featureCount }, (_, i) => i + 1);

	return (
		<div
			className="landing-price-card xl:!p-7"
			style={cardStyle}
		>
			{plan.badge && (
				<div
					className="absolute -top-3.5 start-6 px-5 py-1.5 rounded-full text-xs font-bold text-white"
					style={{ ...badgeStyle, letterSpacing: "0.5px" }}
				>
					{t(`landingPricing.badges.${plan.badge}`)}
				</div>
			)}

			<h3
				className={`text-[20px] xl:text-[19px] font-bold mb-1.5 ${plan.badge ? "mt-4" : ""}`}
				style={{ color: "var(--lp-text)" }}
			>
				{t(`${ns}.name`)}
			</h3>
			<p
				className="text-sm mb-6"
				style={{ color: "var(--lp-text-subtle)" }}
			>
				{t(`${ns}.description`)}
			</p>

			<div className="mb-6">
				<div className="flex items-baseline gap-1.5 flex-wrap">
					<span
						className={
							isHighlighted
								? "text-[clamp(26px,4vw,34px)] font-black shimmer-blue"
								: "text-[clamp(26px,4vw,34px)] font-black"
						}
						style={
							isHighlighted ? undefined : { color: "var(--lp-text)" }
						}
					>
						{t(`${ns}.price`)}
					</span>
					<span
						className="text-sm font-medium"
						style={{ color: "var(--lp-text-muted)" }}
					>
						{t(`${ns}.period`)}
					</span>
				</div>
				{plan.hasSubtitle && (
					<p
						className="text-xs mt-2 leading-relaxed"
						style={{
							color: isHighlighted
								? "#0ea5e9"
								: "var(--lp-text-muted)",
						}}
					>
						{t(`${ns}.subtitle`)}
					</p>
				)}
			</div>

			<ul className="list-none mb-8 space-y-0">
				{features.map((i) => (
					<li
						key={i}
						className="text-sm py-2.5 flex items-center gap-2.5"
						style={{
							color: "var(--lp-text-muted)",
							borderBottom:
								i < plan.featureCount
									? "1px solid var(--lp-card-border)"
									: "none",
						}}
					>
						<span
							style={
								isHighlighted
									? {
											background:
												"linear-gradient(135deg, #0ea5e9, #06B6D4)",
											WebkitBackgroundClip: "text",
											WebkitTextFillColor: "transparent",
											backgroundClip: "text",
										}
									: isEnterprise
										? { color: "#F59E0B" }
										: { color: "#0ea5e9" }
							}
						>
							✓
						</span>
						{t(`${ns}.features.${i}`)}
					</li>
				))}
			</ul>

			<Link
				href={plan.ctaHref}
				className={`${ctaClass} w-full justify-center !py-4 !text-[15px]`}
			>
				{t(`${ns}.cta`)}
			</Link>
		</div>
	);
}
