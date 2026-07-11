"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ParticleDots } from "./ParticleDots";

export function FinalCTA() {
	const t = useTranslations();

	return (
		<section
			className="mas-on-dark relative overflow-hidden py-28 md:py-36 px-6 text-center"
			style={{ background: "var(--mas-navy-3)" }}
		>
			{/* rising glow + animated dots */}
			<div
				className="absolute inset-0 pointer-events-none"
				aria-hidden="true"
				style={{
					background:
						"radial-gradient(circle at 50% 130%, rgba(14,165,233,0.35), transparent 55%)",
					opacity: 0.7,
				}}
			/>
			<ParticleDots />

			<div className="mas-rv relative z-[1] max-w-[700px] mx-auto">
				<span className="mas-dim">{t("hero.tagline")}</span>
				<h2
					className="text-[clamp(1.9rem,4vw,2.9rem)] font-black leading-[1.3] mt-5 mb-4"
					style={{ color: "var(--mas-paper-on-dark)" }}
				>
					{t("finalCta.title")}
				</h2>
				<p
					className="text-[clamp(1rem,1.8vw,1.15rem)] leading-[1.8] mb-9"
					style={{ color: "rgba(234,243,251,0.65)" }}
				>
					{t("finalCta.description")}
				</p>
				<Link
					href="/auth/signup"
					className="mas-btn mas-btn-primary !text-[17px] !px-10 !py-4"
				>
					{t("finalCta.cta")}
					<span className="rtl-flip" aria-hidden="true">
						→
					</span>
				</Link>
				<p
					className="text-[13px] mt-5"
					style={{ color: "rgba(234,243,251,0.42)" }}
				>
					{t("finalCta.note")}
				</p>
			</div>
		</section>
	);
}
