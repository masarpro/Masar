"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const features = [
	{ icon: "📊", color: "#10B981" },
	{ icon: "🏗️", color: "#3B82F6" },
	{ icon: "💰", color: "#F59E0B" },
	{ icon: "📋", color: "#8B5CF6" },
	{ icon: "👷", color: "#EF4444" },
	{ icon: "🔐", color: "#06B6D4" },
];

const featureKeys = ["1", "2", "3", "4", "5", "6"] as const;

export function Features() {
	const t = useTranslations();
	const [activeFeature, setActiveFeature] = useState(0);

	useEffect(() => {
		const iv = setInterval(
			() => setActiveFeature((p) => (p + 1) % 6),
			5000,
		);
		return () => clearInterval(iv);
	}, []);

	return (
		<section
			id="features"
			className="scroll-my-20 relative py-28 px-6"
			style={{
				background:
					"linear-gradient(180deg, var(--lp-bg) 0%, var(--lp-bg-section) 50%, var(--lp-bg) 100%)",
			}}
		>
			{/* Background glow */}
			<div
				className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] rounded-[50%] pointer-events-none"
				style={{
					background:
						"conic-gradient(from 0deg, rgba(16,185,129,0.04), rgba(59,130,246,0.04), rgba(139,92,246,0.03), rgba(16,185,129,0.04))",
					filter: "blur(120px)",
					opacity: "var(--lp-effects-opacity)",
				}}
			/>

			<div className="max-w-[1200px] mx-auto relative z-[2]">
				{/* Header */}
				<div className="text-center mb-[72px]">
					<div
						className="landing-section-label"
						style={{
							background:
								"linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))",
							border: "1px solid rgba(16,185,129,0.12)",
							color: "#10B981",
						}}
					>
						<span
							className="landing-dot"
							style={{
								background:
									"linear-gradient(135deg, #10B981, #06B6D4)",
							}}
						/>
						{t("features.label")}
					</div>
					<h2
						className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.3] max-w-[550px] mx-auto"
						style={{ color: "var(--lp-text)" }}
					>
						{t("features.title")}
					</h2>
					<p
						className="text-[17px] mt-4 max-w-[480px] mx-auto"
						style={{ color: "var(--lp-text-subtle)" }}
					>
						{t("features.description")}
					</p>
				</div>

				{/* Feature Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
					{featureKeys.map((key, i) => {
						const f = features[i];
						const isActive = activeFeature === i;
						return (
							<div
								key={key}
								onClick={() => setActiveFeature(i)}
								className="landing-glow-card cursor-pointer"
								style={{
									background: isActive
										? `linear-gradient(135deg, ${f.color}90, ${f.color}20, ${f.color}70)`
										: `linear-gradient(135deg, var(--lp-card-border), transparent)`,
								}}
							>
								<div
									className="landing-glow-card-inner"
									style={{
										background: isActive
											? `linear-gradient(160deg, ${f.color}14, var(--lp-glow-card-bg))`
											: undefined,
									}}
								>
									{/* Icon */}
									<div
										className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center text-[26px] mb-5"
										style={{
											background: `linear-gradient(135deg, ${f.color}12, ${f.color}06)`,
											border: `1px solid ${f.color}25`,
											boxShadow: isActive
												? `0 0 30px ${f.color}20, 0 0 60px ${f.color}08`
												: "none",
											transition: "all 0.4s",
										}}
									>
										{f.icon}
									</div>
									<h3
										className="text-[19px] font-bold mb-2.5"
										style={{
											color: "var(--lp-text)",
										}}
									>
										{t(`features.items.${key}.title`)}
									</h3>
									<p
										className="text-sm leading-[1.75]"
										style={{
											color: "var(--lp-text-muted)",
										}}
									>
										{t(
											`features.items.${key}.description`,
										)}
									</p>
								</div>
								{/* Glow effect when active */}
								{isActive && (
									<div
										className="absolute -inset-[2px] rounded-[30px] -z-10"
										style={{
											background: `radial-gradient(circle at 50% 0%, ${f.color}35, transparent 55%)`,
											filter: "blur(40px)",
										}}
									/>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
