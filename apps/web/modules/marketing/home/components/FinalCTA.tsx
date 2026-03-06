"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function FinalCTA() {
	const t = useTranslations();

	return (
		<section
			className="relative overflow-hidden py-40 px-6 text-center"
			style={{
				background:
					"linear-gradient(180deg, var(--lp-bg), var(--lp-bg-section), var(--lp-bg))",
			}}
		>
			{/* Decorative gradient orbs */}
			<div
				className="absolute pointer-events-none"
				style={{
					top: "40%",
					left: "30%",
					width: 500,
					height: 500,
					borderRadius: "50%",
					background:
						"radial-gradient(circle, rgba(14,165,233,0.12), transparent 60%)",
					filter: "blur(100px)",
					opacity: "var(--lp-effects-opacity)",
				}}
			/>
			<div
				className="absolute pointer-events-none"
				style={{
					top: "50%",
					left: "60%",
					width: 400,
					height: 400,
					borderRadius: "50%",
					background:
						"radial-gradient(circle, rgba(6,182,212,0.08), transparent 60%)",
					filter: "blur(80px)",
					opacity: "var(--lp-effects-opacity)",
				}}
			/>
			<div
				className="absolute pointer-events-none"
				style={{
					top: "45%",
					left: "45%",
					transform: "translate(-50%,-50%)",
					width: 250,
					height: 250,
					borderRadius: "50%",
					background:
						"radial-gradient(circle, rgba(59,130,246,0.1), transparent 60%)",
					filter: "blur(50px)",
					animation: "landingPulse 4s infinite",
					opacity: "var(--lp-effects-opacity)",
				}}
			/>

			<div className="max-w-[700px] mx-auto relative z-[2]">
				<h2
					className="text-4xl sm:text-5xl lg:text-[52px] font-black leading-[1.15] mb-6"
					style={{ color: "var(--lp-text)" }}
				>
					{t("finalCta.title")}
				</h2>
				<p
					className="text-lg leading-[1.8] mb-12"
					style={{ color: "var(--lp-text-subtle)" }}
				>
					{t("finalCta.description")}
				</p>
				<Link
					href="/auth/signup"
					className="btn-premium btn-premium-primary !py-[22px] !px-[60px] !text-[19px] !rounded-[22px]"
				>
					{t("finalCta.cta")}
					<span className="text-[22px] rtl-flip">→</span>
				</Link>
				<p
					className="text-[13px] mt-6"
					style={{ color: "var(--lp-text-faint)" }}
				>
					{t("finalCta.note")}
				</p>
			</div>
		</section>
	);
}
