"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

// Closing CTA on the Botly fixed-dark canvas — mirrors the hero.
export function FinalCTA() {
	const t = useTranslations();

	return (
		<section
			className="relative overflow-hidden px-6 py-28 text-center md:py-36"
			style={{ background: "#131313" }}
		>
			<div
				className="pointer-events-none absolute inset-0"
				aria-hidden="true"
				style={{
					background:
						"radial-gradient(55% 65% at 50% 115%, rgba(93,116,241,0.2), transparent 70%), radial-gradient(25% 30% at 82% 20%, rgba(255,204,111,0.06), transparent 70%)",
				}}
			/>

			<div className="bl-rv relative z-[1] mx-auto max-w-[700px]">
				<span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[13px] font-semibold text-white/70">
					{t("hero.tagline")}
				</span>
				<h2 className="mt-5 mb-4 text-balance text-[clamp(1.9rem,4vw,2.9rem)] font-black leading-[1.3] text-[#eceaf0]">
					{t("finalCta.title")}
				</h2>
				<p className="mb-9 text-[clamp(1rem,1.8vw,1.15rem)] leading-[1.8] text-[#eceaf0]/65">
					{t("finalCta.description")}
				</p>
				<Link
					href="/auth/signup"
					className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-white px-12 py-5 text-[17px] font-bold text-[#1d1d1d] transition-opacity hover:opacity-90"
				>
					{t("finalCta.cta")}
					<span className="rtl-flip" aria-hidden="true">
						→
					</span>
				</Link>
				<p className="mt-5 text-[13px] text-white/40">{t("finalCta.note")}</p>
			</div>
		</section>
	);
}
