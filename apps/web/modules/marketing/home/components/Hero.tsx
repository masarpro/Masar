"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { BotlyPathStrip } from "./BotlyPathStrip";
import { LandingDashboardReplica } from "./LandingDashboardReplica";

/**
 * Botly landing hero (Figma 226:1432), adapted to Masar's black/white Botly
 * identity: fixed-dark canvas with soft Brand/04+01 glows, giant two-line
 * headline, white pill CTA, and — instead of Botly's widget images — a live
 * markup replica of the real org dashboard inside the bordered frame.
 * The section is dark in BOTH themes (like Botly's landing).
 */

export function Hero() {
	const t = useTranslations();

	return (
		<section
			id="top"
			className="relative overflow-hidden px-4 pt-44 pb-20 md:px-6 md:pt-40 md:pb-28"
			style={{ background: "#0f0b1d" }}
		>
			{/* Botly gradient atmosphere (Figma 226:1340/1343): purple
			    color-dodge glow + grain texture over #0f0b1d */}
			<div className="pointer-events-none absolute inset-0" aria-hidden="true">
				<div dir="ltr" className="absolute inset-0">
					<img
						src="/images/botly-hero-glow.svg"
						alt=""
						className="absolute opacity-50 mix-blend-color-dodge"
						style={{
							left: "34%",
							top: "-10%",
							width: "1200px",
							height: "1160px",
							transform: "rotate(-32.63deg)",
						}}
					/>
				</div>
				<div
					className="absolute inset-0 opacity-10 mix-blend-color-dodge"
					style={{
						backgroundImage: "url(/images/botly-noise-512.png)",
						backgroundSize: "512px 512px",
					}}
				/>
				<div
					className="absolute inset-x-0 top-0 h-[720px]"
					style={{
						background:
							"radial-gradient(40% 45% at 18% 10%, rgba(93,116,241,0.1), transparent 70%)",
					}}
				/>
				{/* floating confetti (Botly floating elements, CSS-only) */}
				<span className="absolute start-[8%] top-[30%] size-2 rounded-full bg-[#ffcc6f] opacity-50" />
				<span className="absolute end-[10%] top-[24%] size-1.5 rounded-full bg-[#5d74f1] opacity-60" />
				<span className="absolute start-[16%] top-[68%] size-1.5 rounded-full bg-[#ea7465] opacity-40" />
				<span className="absolute end-[6%] top-[58%] size-2 rounded-full bg-[#8ec9db] opacity-40" />
				<span className="absolute start-[45%] top-[14%] size-1 rounded-full bg-white opacity-30" />
			</div>

			<div className="relative z-10 mx-auto w-full max-w-[1240px]">
				<div className="mx-auto max-w-[820px] text-center">
					{/* Badge */}
					<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white/80">
						{t("hero.badge")}
					</span>

					{/* Headline — Botly 2-line giant title */}
					<h1 className="mt-7 text-balance text-[clamp(2.2rem,5.4vw+0.6rem,4.4rem)] font-black leading-[1.22] text-[#eceaf0]">
						{t("hero.titleA")}
						<br />
						<span
							className="bg-clip-text text-transparent"
							style={{
								backgroundImage:
									"linear-gradient(90deg, #eceaf0 0%, #bb9bff 55%, #febccf 100%)",
							}}
						>
							{t("hero.titleB")}
						</span>
					</h1>

					{/* Lead */}
					<p className="mx-auto mt-5 max-w-[620px] text-[clamp(1rem,1.6vw,1.25rem)] leading-[1.9] text-[#eceaf0] opacity-75">
						{t("hero.subtitle")}
					</p>

					{/* CTAs — Botly: white pill + quiet secondary */}
					<div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<Link
							href="/auth/signup"
							className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-white px-10 py-4 text-[16px] font-bold text-[#1d1d1d] transition-opacity hover:opacity-90"
						>
							{t("hero.cta")}
						</Link>
						<a
							href="#features"
							className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-white/10 px-8 py-4 text-[15px] font-semibold text-[#eceaf0] transition-colors hover:bg-white/15"
						>
							{t("hero.secondary")}
						</a>
					</div>

					{/* Trust row */}
					<div className="mt-9 flex flex-col items-center gap-4">
						<div className="flex flex-wrap items-center justify-center gap-3">
							<span className="flex" aria-hidden="true">
								{["#ffcc6f", "#ea7465", "#8ec9db", "#5d74f1"].map(
									(color, i) => (
										<i
											key={color}
											className="grid h-8 w-8 place-items-center rounded-full text-[12px] font-bold not-italic text-[#1d1d1d]"
											style={{
												background: color,
												border: "2px solid #0f0b1d",
												marginInlineStart: i > 0 ? -9 : 0,
											}}
										>
											{["م", "ع", "خ", "ف"][i]}
										</i>
									),
								)}
							</span>
							<span
								className="text-[13px] tracking-[2px] text-[#ffcc6f]"
								aria-hidden="true"
							>
								★★★★★
							</span>
							<span className="text-[13px] text-white/50">
								{t("hero.proof")}
							</span>
						</div>
					</div>
				</div>

				{/* Journey diagram — the classic curved path with 5 numbered
				    stations, in Botly colors */}
				<div className="mt-12 md:mt-16">
					<BotlyPathStrip />
				</div>

				{/* Product frame — Botly's bordered gradient frame, holding the
				    live dashboard replica instead of a screenshot */}
				<div className="relative mx-auto mt-12 max-w-[1240px] md:mt-16">
					<div
						className="pointer-events-none absolute -inset-6 rounded-[48px] opacity-60"
						aria-hidden="true"
						style={{
							background:
								"radial-gradient(50% 50% at 50% 40%, rgba(93,116,241,0.18), transparent 75%)",
						}}
					/>
					<div
						className="relative rounded-[28px] border-2 border-white/10 p-2 md:rounded-[37px] md:p-4"
						style={{
							backgroundImage:
								"linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))",
						}}
					>
						<LandingDashboardReplica />
					</div>
				</div>
			</div>
		</section>
	);
}
