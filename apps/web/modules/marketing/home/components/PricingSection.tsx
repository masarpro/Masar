"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function PricingSection() {
	const t = useTranslations();

	return (
		<section
			id="pricing"
			className="scroll-mt-16 relative py-28 px-6"
			style={{ background: "#050508" }}
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
					<h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.3] text-white">
						{t("landingPricing.title")}
					</h2>
				</div>

				{/* Pricing Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[760px] mx-auto">
					{/* Free Plan */}
					<div
						className="landing-price-card"
						style={{
							background: "rgba(255,255,255,0.02)",
							border: "1px solid rgba(255,255,255,0.06)",
						}}
					>
						<h3 className="text-[22px] font-bold mb-1.5 text-white">
							{t("landingPricing.free.name")}
						</h3>
						<p className="text-white/35 text-sm mb-7">
							{t("landingPricing.free.description")}
						</p>
						<div
							className="text-[44px] font-black mb-7"
							style={{
								fontFamily:
									"'Space Grotesk', sans-serif",
							}}
						>
							{t("landingPricing.free.price")}
						</div>
						<ul className="list-none mb-9 space-y-0">
							{[1, 2, 3].map((i) => (
								<li
									key={i}
									className="text-white/50 text-sm py-2.5 flex items-center gap-2.5"
									style={{
										borderBottom:
											i < 3
												? "1px solid rgba(255,255,255,0.04)"
												: "none",
									}}
								>
									<span className="text-[#10B981]">
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
							background:
								"linear-gradient(160deg, rgba(16,185,129,0.08), rgba(6,182,212,0.03), rgba(10,10,18,0.98))",
							border: "2px solid rgba(16,185,129,0.2)",
							boxShadow:
								"0 0 100px rgba(16,185,129,0.06), 0 0 40px rgba(6,182,212,0.04)",
						}}
					>
						{/* Badge */}
						<div
							className="absolute -top-3.5 start-6 px-5 py-1.5 rounded-full text-xs font-bold text-white"
							style={{
								background:
									"linear-gradient(135deg, #10B981, #06B6D4)",
								boxShadow:
									"0 4px 20px rgba(16,185,129,0.3), 0 0 40px rgba(6,182,212,0.1)",
								letterSpacing: "0.5px",
							}}
						>
							{t("landingPricing.pro.badge")}
						</div>

						<h3 className="text-[22px] font-bold mb-1.5 text-white">
							{t("landingPricing.pro.name")}
						</h3>
						<p className="text-white/35 text-sm mb-7">
							{t("landingPricing.pro.description")}
						</p>
						<div className="mb-7 flex items-baseline gap-1">
							<span
								className="text-[44px] font-black shimmer-green"
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
									className="text-white/55 text-sm py-2.5 flex items-center gap-2.5"
									style={{
										borderBottom:
											i < 6
												? "1px solid rgba(255,255,255,0.05)"
												: "none",
									}}
								>
									<span
										style={{
											background:
												"linear-gradient(135deg, #10B981, #06B6D4)",
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
