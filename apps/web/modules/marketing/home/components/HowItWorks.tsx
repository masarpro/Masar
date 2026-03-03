"use client";

import { useTranslations } from "next-intl";

const steps = [
	{ num: "01", color: "#10B981", accent: "#06B6D4" },
	{ num: "02", color: "#3B82F6", accent: "#8B5CF6" },
	{ num: "03", color: "#F59E0B", accent: "#EF4444" },
];

const stepKeys = ["1", "2", "3"] as const;

export function HowItWorks() {
	const t = useTranslations();

	return (
		<section
			id="how"
			className="relative py-28 px-6"
			style={{
				background:
					"linear-gradient(180deg, #050508 0%, #060A14 100%)",
			}}
		>
			<div className="max-w-[1000px] mx-auto">
				{/* Header */}
				<div className="text-center mb-[72px]">
					<div
						className="landing-section-label"
						style={{
							background:
								"linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))",
							border: "1px solid rgba(59,130,246,0.12)",
							color: "#3B82F6",
						}}
					>
						<span
							className="landing-dot"
							style={{
								background:
									"linear-gradient(135deg, #3B82F6, #8B5CF6)",
							}}
						/>
						{t("howItWorks.label")}
					</div>
					<h2 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.3] text-white">
						{t("howItWorks.title")}
					</h2>
				</div>

				{/* Steps Grid */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{stepKeys.map((key, i) => {
						const s = steps[i];
						return (
							<div
								key={key}
								className="landing-step-card"
								style={{
									background: `linear-gradient(135deg, ${s.color}15, ${s.accent}08, rgba(255,255,255,0.02))`,
								}}
							>
								<div
									className="rounded-[22px] p-8 sm:p-10 h-full text-center"
									style={{
										background: "rgba(5,5,8,0.85)",
										backdropFilter: "blur(20px)",
									}}
								>
									{/* Connector line (desktop) */}
									{i < 2 && (
										<div
											className="hidden md:block absolute top-1/2 end-[-12px] w-6 h-[2px]"
											style={{
												background: `linear-gradient(90deg, ${s.color}40, transparent)`,
											}}
										/>
									)}

									{/* Number badge */}
									<div
										className="w-[68px] h-[68px] rounded-[22px] mx-auto mb-6 flex items-center justify-center text-2xl font-black"
										style={{
											background: `linear-gradient(135deg, ${s.color}18, ${s.accent}10)`,
											border: `1px solid ${s.color}25`,
											color: s.color,
											fontFamily:
												"'Space Grotesk', monospace",
											boxShadow: `0 0 30px ${s.color}10`,
										}}
									>
										{s.num}
									</div>
									<h3 className="text-[19px] font-bold mb-3 text-white">
										{t(
											`howItWorks.steps.${key}.title`,
										)}
									</h3>
									<p className="text-white/40 text-sm leading-[1.75]">
										{t(
											`howItWorks.steps.${key}.description`,
										)}
									</p>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
