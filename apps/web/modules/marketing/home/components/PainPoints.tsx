"use client";

import { useTranslations } from "next-intl";

const pains = [
	{ emoji: "😤", color: "#EF4444" },
	{ emoji: "📱", color: "#F59E0B" },
	{ emoji: "💸", color: "#EC4899" },
	{ emoji: "🤯", color: "#8B5CF6" },
	{ emoji: "📄", color: "#3B82F6" },
	{ emoji: "⏰", color: "#EF4444" },
];

export function PainPoints() {
	const t = useTranslations();

	const items = ["1", "2", "3", "4", "5", "6"] as const;

	return (
		<section
			className="relative py-28 px-6"
			style={{
				background:
					"linear-gradient(180deg, var(--lp-bg) 0%, var(--lp-bg-alt) 50%, var(--lp-bg) 100%)",
			}}
		>
			{/* Decorative glow */}
			<div
				className="absolute top-1/2 end-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none -translate-y-1/2"
				style={{
					background:
						"radial-gradient(circle, rgba(239,68,68,0.06), transparent 70%)",
					filter: "blur(80px)",
					opacity: "var(--lp-effects-opacity)",
				}}
			/>

			<div className="max-w-[1200px] mx-auto relative">
				{/* Header */}
				<div className="text-center mb-16">
					<div
						className="landing-section-label"
						style={{
							background:
								"linear-gradient(135deg, rgba(239,68,68,0.06), rgba(236,72,153,0.04))",
							border: "1px solid rgba(239,68,68,0.12)",
							color: "#EF4444",
						}}
					>
						<span
							className="landing-dot"
							style={{
								background:
									"linear-gradient(135deg, #EF4444, #EC4899)",
							}}
						/>
						{t("painPoints.label")}
					</div>
					<h2
						className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.3] max-w-[650px] mx-auto"
						style={{ color: "var(--lp-text)" }}
					>
						{t("painPoints.title")}
					</h2>
				</div>

				{/* Cards Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{items.map((key, i) => {
						const pain = pains[i];
						return (
							<div key={key} className="landing-pain-card">
								{/* Top accent line */}
								<div
									className="absolute top-0 start-0 w-[60px] h-[2px] rounded-ss-[22px]"
									style={{
										background: `linear-gradient(90deg, ${pain.color}50, transparent)`,
									}}
								/>
								<span className="text-3xl block mb-3.5">
									{pain.emoji}
								</span>
								<p
									className="text-[15px] leading-[1.75] font-medium"
									style={{
										color: "var(--lp-text-muted)",
									}}
								>
									{t(`painPoints.items.${key}`)}
								</p>
							</div>
						);
					})}
				</div>

				{/* Solution */}
				<div className="text-center mt-14">
					<p className="text-[22px] font-bold">
						<span className="shimmer-green">
							{t("painPoints.solution")}
						</span>
					</p>
				</div>
			</div>
		</section>
	);
}
