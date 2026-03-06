"use client";

import { useTranslations } from "next-intl";
import {
	Calculator,
	FileSignature,
	HardHat,
	Receipt,
	CheckCircle,
	Check,
	X,
	type LucideIcon,
} from "lucide-react";

interface Stage {
	num: string;
	icon: LucideIcon;
}

const stages: Stage[] = [
	{ num: "01", icon: Calculator },
	{ num: "02", icon: FileSignature },
	{ num: "03", icon: HardHat },
	{ num: "04", icon: Receipt },
	{ num: "05", icon: CheckCircle },
];

const comparisonKeys = ["1", "2", "3"] as const;

export function BuiltForConstruction() {
	const t = useTranslations();

	return (
		<section
			className="relative py-28 px-6"
			style={{
				background:
					"linear-gradient(180deg, var(--lp-bg) 0%, var(--lp-bg-section) 50%, var(--lp-bg) 100%)",
			}}
		>
			{/* Background glow */}
			<div
				className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-[50%] pointer-events-none"
				style={{
					background:
						"radial-gradient(ellipse, rgba(16,185,129,0.06), transparent 70%)",
					filter: "blur(100px)",
					opacity: "var(--lp-effects-opacity)",
				}}
			/>

			<div className="max-w-[1200px] mx-auto relative z-[2]">
				{/* Header */}
				<div className="text-center mb-16">
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
						{t("builtForConstruction.badge")}
					</div>
					<h2
						className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold leading-[1.3] max-w-[700px] mx-auto"
						style={{ color: "var(--lp-text)" }}
					>
						{t("builtForConstruction.title")}
					</h2>
					<p
						className="text-[17px] mt-4 max-w-[700px] mx-auto"
						style={{ color: "var(--lp-text-subtle)" }}
					>
						{t("builtForConstruction.subtitle")}
					</p>
				</div>

				{/* Pipeline — Desktop */}
				<div className="hidden md:block relative">
					<div className="flex items-start justify-between relative">
						{/* Connecting line */}
						<div
							className="absolute top-[28px] start-[10%] end-[10%] h-[2px]"
							style={{
								background:
									"linear-gradient(to left, rgba(16,185,129,0.5), rgba(6,182,212,0.3), rgba(16,185,129,0.5))",
							}}
						/>

						{stages.map((stage, i) => {
							const Icon = stage.icon;
							return (
								<div
									key={stage.num}
									className="flex flex-col items-center text-center relative z-[1] group w-[18%] transition-transform duration-300 hover:scale-105"
								>
									{/* Number */}
									<span
										className="text-[13px] font-bold mb-2"
										style={{ color: "#10B981" }}
									>
										{stage.num}
									</span>

									{/* Icon circle */}
									<div
										className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-shadow duration-300 group-hover:shadow-[0_0_24px_rgba(16,185,129,0.3)]"
										style={{
											background:
												"rgba(16,185,129,0.10)",
											border: "2px solid rgba(16,185,129,0.25)",
										}}
									>
										<Icon
											size={26}
											color="#10B981"
											strokeWidth={1.8}
										/>
									</div>

									{/* Name */}
									<h4
										className="text-[15px] font-bold mb-1"
										style={{
											color: "var(--lp-text)",
										}}
									>
										{t(
											`builtForConstruction.stages.${i + 1}.name`,
										)}
									</h4>

									{/* Description */}
									<p
										className="text-[13px] leading-[1.6] px-1"
										style={{
											color: "var(--lp-text-muted)",
										}}
									>
										{t(
											`builtForConstruction.stages.${i + 1}.description`,
										)}
									</p>
								</div>
							);
						})}
					</div>
				</div>

				{/* Pipeline — Mobile */}
				<div className="md:hidden relative">
					{/* Vertical connecting line */}
					<div
						className="absolute end-[27px] top-[28px] bottom-[28px] w-[2px]"
						style={{
							background:
								"linear-gradient(to bottom, rgba(16,185,129,0.5), rgba(6,182,212,0.3), rgba(16,185,129,0.5))",
						}}
					/>

					<div className="flex flex-col gap-8">
						{stages.map((stage, i) => {
							const Icon = stage.icon;
							return (
								<div
									key={stage.num}
									className="flex items-start gap-4 relative z-[1]"
								>
									{/* Text */}
									<div className="flex-1">
										<span
											className="text-[12px] font-bold"
											style={{
												color: "#10B981",
											}}
										>
											{stage.num}
										</span>
										<h4
											className="text-[15px] font-bold mt-0.5"
											style={{
												color: "var(--lp-text)",
											}}
										>
											{t(
												`builtForConstruction.stages.${i + 1}.name`,
											)}
										</h4>
										<p
											className="text-[13px] leading-[1.6] mt-1"
											style={{
												color: "var(--lp-text-muted)",
											}}
										>
											{t(
												`builtForConstruction.stages.${i + 1}.description`,
											)}
										</p>
									</div>

									{/* Icon circle */}
									<div
										className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
										style={{
											background:
												"rgba(16,185,129,0.10)",
											border: "2px solid rgba(16,185,129,0.25)",
										}}
									>
										<Icon
											size={24}
											color="#10B981"
											strokeWidth={1.8}
										/>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Flow text */}
				<p
					className="text-center text-[15px] mt-12 mb-16 max-w-[600px] mx-auto"
					style={{ color: "rgba(16,185,129,0.7)" }}
				>
					{t("builtForConstruction.flowText")}
				</p>

				{/* Comparison table */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
					{/* Masar card — first on mobile (natural source order), md:order-1 */}
					<div
						className="landing-glow-card md:order-1"
						style={{
							background:
								"linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,182,212,0.12), rgba(16,185,129,0.25))",
							boxShadow:
								"0 0 30px rgba(16,185,129,0.08)",
						}}
					>
						<div className="landing-glow-card-inner">
							<h3
								className="text-[19px] font-bold mb-5"
								style={{ color: "var(--lp-text)" }}
							>
								{t(
									"builtForConstruction.comparison.masar.title",
								)}
							</h3>
							<div className="space-y-3">
								{comparisonKeys.map((key) => (
									<div
										key={key}
										className="flex items-start gap-3"
									>
										<Check
											size={18}
											color="#10B981"
											className="mt-0.5 shrink-0"
										/>
										<span
											className="text-[14px] leading-[1.7]"
											style={{
												color: "var(--lp-text-muted)",
											}}
										>
											{t(
												`builtForConstruction.comparison.masar.${key}`,
											)}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* Generic card — md:order-2 */}
					<div className="landing-glow-card md:order-2">
						<div className="landing-glow-card-inner">
							<h3
								className="text-[19px] font-bold mb-5"
								style={{ color: "var(--lp-text)" }}
							>
								{t(
									"builtForConstruction.comparison.generic.title",
								)}
							</h3>
							<div className="space-y-3">
								{comparisonKeys.map((key) => (
									<div
										key={key}
										className="flex items-start gap-3"
									>
										<X
											size={18}
											style={{
												color: "rgba(239,68,68,0.6)",
											}}
											className="mt-0.5 shrink-0"
										/>
										<span
											className="text-[14px] leading-[1.7]"
											style={{
												color: "var(--lp-text-muted)",
											}}
										>
											{t(
												`builtForConstruction.comparison.generic.${key}`,
											)}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
