"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
	LayoutDashboard,
	HardHat,
	Receipt,
	Calculator,
	FileSignature,
	UserCheck,
	ShieldCheck,
	Check,
	ArrowLeft,
	type LucideIcon,
} from "lucide-react";

interface FeatureConfig {
	icon: LucideIcon;
	color: string;
	isNew?: boolean;
	subCount: number;
}

const features: FeatureConfig[] = [
	{ icon: LayoutDashboard, color: "#0ea5e9", subCount: 3 },
	{ icon: HardHat, color: "#3B82F6", subCount: 3 },
	{ icon: Receipt, color: "#F59E0B", subCount: 3 },
	{ icon: Calculator, color: "#0ea5e9", isNew: true, subCount: 3 },
	{ icon: FileSignature, color: "#8B5CF6", subCount: 3 },
	{ icon: UserCheck, color: "#EF4444", subCount: 3 },
	{ icon: ShieldCheck, color: "#06B6D4", subCount: 2 },
];

const featureKeys = ["1", "2", "3", "4", "5", "6", "7"] as const;

export function Features() {
	const t = useTranslations();
	const [activeFeature, setActiveFeature] = useState(0);

	useEffect(() => {
		const iv = setInterval(
			() => setActiveFeature((p) => (p + 1) % 7),
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
						"conic-gradient(from 0deg, rgba(14,165,233,0.04), rgba(59,130,246,0.04), rgba(139,92,246,0.03), rgba(14,165,233,0.04))",
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
								"linear-gradient(135deg, rgba(14,165,233,0.06), rgba(6,182,212,0.04))",
							border: "1px solid rgba(14,165,233,0.12)",
							color: "#0ea5e9",
						}}
					>
						<span
							className="landing-dot"
							style={{
								background:
									"linear-gradient(135deg, #0ea5e9, #06B6D4)",
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
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
					{featureKeys.map((key, i) => {
						const f = features[i];
						const isActive = activeFeature === i;
						const isTopRow = i < 3;
						const Icon = f.icon;

						return (
							<div
								key={key}
								onClick={() => setActiveFeature(i)}
								className={`landing-glow-card cursor-pointer transition-transform duration-300 hover:-translate-y-1 ${
									isTopRow
										? "lg:col-span-4"
										: "lg:col-span-3"
								}`}
								style={{
									background:
										f.isNew && !isActive
											? "linear-gradient(135deg, rgba(14,165,233,0.25), rgba(6,182,212,0.15), rgba(14,165,233,0.25))"
											: isActive
												? `linear-gradient(135deg, ${f.color}90, ${f.color}20, ${f.color}70)`
												: "linear-gradient(135deg, var(--lp-card-border), transparent)",
									boxShadow: f.isNew
										? "0 0 30px rgba(14,165,233,0.12)"
										: undefined,
								}}
							>
								<div
									className="landing-glow-card-inner relative"
									style={{
										background: isActive
											? `linear-gradient(160deg, ${f.color}14, var(--lp-glow-card-bg))`
											: undefined,
									}}
								>
									{/* New Badge */}
									{f.isNew && (
										<span
											className="absolute top-4 end-4 text-[11px] font-bold px-3 py-1 rounded-full z-10"
											style={{
												background:
													"linear-gradient(135deg, #0ea5e9, #06B6D4)",
												color: "#ffffff",
												boxShadow:
													"0 0 20px rgba(14,165,233,0.3)",
											}}
										>
											{t("features.newBadge")}
										</span>
									)}

									{/* Icon */}
									<div
										className="w-[48px] h-[48px] rounded-xl flex items-center justify-center mb-5"
										style={{
											background:
												"rgba(14,165,233,0.10)",
											border: "1px solid rgba(14,165,233,0.15)",
										}}
									>
										<Icon
											size={28}
											color="#0ea5e9"
											strokeWidth={1.8}
										/>
									</div>

									{/* Title */}
									<h3
										className="text-[19px] font-bold mb-2.5"
										style={{
											color: "var(--lp-text)",
										}}
									>
										{t(
											`features.items.${key}.title`,
										)}
									</h3>

									{/* Description */}
									<p
										className="text-sm leading-[1.75] mb-4"
										style={{
											color: "var(--lp-text-muted)",
										}}
									>
										{t(
											`features.items.${key}.description`,
										)}
									</p>

									{/* Sub-bullets */}
									<div className="space-y-1.5 mb-4">
										{Array.from(
											{ length: f.subCount },
											(_, si) => (
												<div
													key={si}
													className="flex items-start gap-2"
												>
													<Check
														size={16}
														color="#0ea5e9"
														className="mt-0.5 shrink-0"
													/>
													<span
														className="text-[13px] leading-[1.6]"
														style={{
															color: "var(--lp-text-muted)",
														}}
													>
														{t(
															`features.items.${key}.sub.${si + 1}`,
														)}
													</span>
												</div>
											),
										)}
									</div>

									{/* Learn More */}
									<span
										className="inline-flex items-center gap-1.5 text-[13px] font-semibold group cursor-pointer"
										style={{ color: "#0ea5e9" }}
									>
										{t("features.learnMore")}
										<ArrowLeft
											size={14}
											className="rtl-flip transition-transform group-hover:-translate-x-1"
										/>
									</span>
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
