"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function PricingSection() {
	const t = useTranslations();

	return (
		<section
			id="pricing"
			className="scroll-mt-16 relative py-28 px-6"
			style={{ background: "var(--lp-bg)" }}
		>
			<div className="max-w-[900px] mx-auto">
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
				</div>

				{/* Pricing Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[760px] mx-auto">
					{/* Free Plan */}
					<div
						className="landing-price-card"
						style={{
							background: "var(--lp-price-free-bg)",
							border: `1px solid var(--lp-price-free-border)`,
						}}
					>
						<h3
							className="text-[22px] font-bold mb-1.5"
							style={{ color: "var(--lp-text)" }}
						>
							{t("landingPricing.free.name")}
						</h3>
						<p
							className="text-sm mb-7"
							style={{ color: "var(--lp-text-subtle)" }}
						>
							{t("landingPricing.free.description")}
						</p>
						<div
							className="text-[44px] font-black mb-7"
							style={{
								fontFamily:
									"'Space Grotesk', sans-serif",
								color: "var(--lp-text)",
							}}
						>
							{t("landingPricing.free.price")}
						</div>
						<ul className="list-none mb-9 space-y-0">
							{[1, 2, 3].map((i) => (
								<li
									key={i}
									className="text-sm py-2.5 flex items-center gap-2.5"
									style={{
										color: "var(--lp-text-muted)",
										borderBottom:
											i < 3
												? `1px solid var(--lp-card-border)`
												: "none",
									}}
								>
									<span className="text-[#0ea5e9]">
										✓
									</span>
									{t(
										`landingPricing.free.features.${i}`,
									)}
								</li>
							))}
						</ul>
						<Link
							href="/auth/signup"
							className="btn-premium btn-premium-ghost w-full justify-center !py-4 !text-[15px]"
						>
							{t("landingPricing.free.cta")}
						</Link>
					</div>

					{/* Pro Plan */}
					<div
						className="landing-price-card"
						style={{
							background: "var(--lp-price-pro-bg)",
							border: `2px solid var(--lp-price-pro-border-color)`,
							boxShadow: "var(--lp-price-pro-shadow)",
						}}
					>
						{/* Badge */}
						<div
							className="absolute -top-3.5 start-6 px-5 py-1.5 rounded-full text-xs font-bold text-white"
							style={{
								background:
									"linear-gradient(135deg, #0ea5e9, #06B6D4)",
								boxShadow:
									"0 4px 20px rgba(14,165,233,0.3), 0 0 40px rgba(6,182,212,0.1)",
								letterSpacing: "0.5px",
							}}
						>
							{t("landingPricing.pro.badge")}
						</div>

						<h3
							className="text-[22px] font-bold mb-1.5"
							style={{ color: "var(--lp-text)" }}
						>
							{t("landingPricing.pro.name")}
						</h3>
						<p
							className="text-sm mb-7"
							style={{ color: "var(--lp-text-subtle)" }}
						>
							{t("landingPricing.pro.description")}
						</p>
						<div className="mb-7 flex items-baseline gap-1 overflow-hidden">
							<span
								className="text-[clamp(28px,5vw,36px)] font-black shimmer-blue"
								style={{
									fontFamily:
										"'Space Grotesk', sans-serif",
								}}
							>
								{t("landingPricing.pro.price")}
							</span>
						</div>
						<ul className="list-none mb-9 space-y-0">
							{[1, 2, 3, 4, 5, 6].map((i) => (
								<li
									key={i}
									className="text-sm py-2.5 flex items-center gap-2.5"
									style={{
										color: "var(--lp-text-muted)",
										borderBottom:
											i < 6
												? `1px solid var(--lp-card-border)`
												: "none",
									}}
								>
									<span
										style={{
											background:
												"linear-gradient(135deg, #0ea5e9, #06B6D4)",
											WebkitBackgroundClip: "text",
											WebkitTextFillColor:
												"transparent",
											backgroundClip: "text",
										}}
									>
										✓
									</span>
									{t(
										`landingPricing.pro.features.${i}`,
									)}
								</li>
							))}
						</ul>
						<Link
							href="/auth/signup"
							className="btn-premium btn-premium-primary w-full justify-center !py-4 !text-base"
						>
							{t("landingPricing.pro.cta")}
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}
