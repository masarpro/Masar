"use client";

import { Bot } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

/**
 * AI assistant section on the Botly fixed-dark canvas: copy on one side,
 * a light-locked Botly chat card on the other (kept light in dark mode,
 * like every product mockup on this landing).
 */
export function AiFeatureSection() {
	const t = useTranslations("aiFeature");

	return (
		<section
			id="ai"
			className="relative scroll-mt-16 overflow-hidden px-6 py-24 md:py-32"
			style={{ background: "#0f0b1d" }}
		>
			<div
				className="pointer-events-none absolute inset-0"
				aria-hidden="true"
				style={{
					background:
						"radial-gradient(45% 55% at 80% 20%, rgba(93,116,241,0.14), transparent 70%), radial-gradient(30% 40% at 12% 80%, rgba(255,204,111,0.06), transparent 70%)",
				}}
			/>
			<div className="relative z-[1] mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
				{/* Copy */}
				<div className="bl-rv">
					<span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[13px] font-semibold text-white/70">
						{t("label")} <b className="text-[#ffcc6f]">AI</b>
					</span>
					<h2 className="mt-4 text-balance text-[clamp(1.7rem,2.4vw+0.8rem,2.5rem)] font-extrabold leading-[1.35] text-[#eceaf0]">
						{t("title")}
					</h2>
					<p className="mt-3 text-[17px] leading-[1.8] text-[#eceaf0] opacity-70">
						{t("description")}
					</p>
					<ul className="mt-7 grid list-none gap-4 p-0">
						{(["1", "2", "3", "4"] as const).map((key) => (
							<li key={key} className="flex items-start gap-3">
								<span
									className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-[#349264]/20 text-[13px] font-bold text-[#57c690]"
									aria-hidden="true"
								>
									✓
								</span>
								<span className="text-[15px] leading-[1.7] text-[#eceaf0]/85">
									{t(`bullets.${key}`)}
								</span>
							</li>
						))}
					</ul>
					<Link
						href="/auth/signup"
						className="mt-9 inline-flex items-center justify-center gap-2 rounded-[10px] bg-white px-8 py-3.5 text-[15px] font-bold text-[#1d1d1d] transition-opacity hover:opacity-90"
					>
						{t("cta")}
						<span className="rtl-flip" aria-hidden="true">
							→
						</span>
					</Link>
				</div>

				{/* Chat mockup — Botly widget card, light-locked */}
				<div
					className="bl-rv overflow-hidden rounded-[32px] border-2 border-white/10 bg-white"
					role="img"
					aria-label={t("chatHeader")}
					style={{ "--d": "0.15s" } as React.CSSProperties}
				>
					<div
						className="flex items-center gap-3 px-6 py-4"
						style={{ borderBottom: "2px solid #f2f2f2" }}
					>
						<span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#1d1d1d]">
							<Bot size={20} color="#fff" />
						</span>
						<div>
							<div className="text-sm font-bold text-[#1d1d1d]">
								{t("chatHeader")}
							</div>
							<div className="flex items-center gap-1.5 text-xs text-[#a0a5a9]">
								<span
									className="size-1.5 rounded-full bg-[#349264]"
									aria-hidden="true"
								/>
								{t("chatStatus")}
							</div>
						</div>
					</div>
					<div className="grid gap-3.5 p-5 md:p-6">
						{/* user */}
						<div className="justify-self-start rounded-2xl rounded-ss-md bg-[#1d1d1d] px-4 py-3 text-[13.5px] leading-relaxed text-white">
							{t("chat.1")}
						</div>
						{/* bot answer with mini table */}
						<div className="justify-self-end rounded-2xl rounded-se-md bg-[#f2f2f2] px-4 py-3 text-[13.5px] leading-relaxed text-[#1d1d1d]">
							{t("chatTable.intro")}
							<table className="mt-2 w-full text-[12.5px]">
								<tbody>
									{(
										[
											["materials", "45,000"],
											["labor", "32,000"],
											["equipment", "18,000"],
											["total", "95,000"],
										] as const
									).map(([key, amount], i, arr) => (
										<tr
											key={key}
											style={
												i < arr.length - 1
													? {
															borderBottom:
																"1px solid rgba(29,29,29,0.08)",
														}
													: undefined
											}
										>
											<td
												className={`py-1.5 ${i === arr.length - 1 ? "font-bold" : ""}`}
											>
												{t(`chatTable.${key}`)}
											</td>
											<td
												className={`py-1.5 text-end tabular-nums ${i === arr.length - 1 ? "font-bold" : "font-semibold"}`}
											>
												{amount} SAR
											</td>
										</tr>
									))}
								</tbody>
							</table>
							<span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#349264]/15 px-2.5 py-1 text-[12px] font-bold text-[#349264]">
								✓ {t("chatTable.under")}
							</span>
						</div>
						{/* user */}
						<div className="justify-self-start rounded-2xl rounded-ss-md bg-[#1d1d1d] px-4 py-3 text-[13.5px] leading-relaxed text-white">
							{t("chat.3")}
						</div>
						{/* typing */}
						<div
							className="flex items-center gap-1 justify-self-end rounded-2xl rounded-se-md bg-[#f2f2f2] px-4 py-3.5"
							aria-hidden="true"
						>
							{[0, 1, 2].map((i) => (
								<i
									key={i}
									className="size-1.5 animate-pulse rounded-full bg-[#a0a5a9]"
									style={{ animationDelay: `${i * 0.2}s` }}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
