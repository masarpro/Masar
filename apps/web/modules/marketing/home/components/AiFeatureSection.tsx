"use client";

import { Bot } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

export function AiFeatureSection() {
	const t = useTranslations("aiFeature");
	const chatRef = useRef<HTMLDivElement>(null);
	const [playing, setPlaying] = useState(false);

	useEffect(() => {
		const el = chatRef.current;
		if (!el) {
			return;
		}
		const obs = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setPlaying(true);
					obs.disconnect();
				}
			},
			{ threshold: 0.35 },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	return (
		<section
			id="ai"
			className="mas-navy-sec mas-on-dark scroll-mt-16 py-24 md:py-32 px-6"
		>
			<div className="relative z-[1] max-w-[1180px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
				{/* Copy */}
				<div className="mas-rv">
					<span className="mas-dim">
						{t("label")} <b>AI</b>
					</span>
					<h2
						className="text-[clamp(1.7rem,2.4vw+0.8rem,2.5rem)] font-extrabold leading-[1.35] mt-4 text-balance"
						style={{ color: "var(--mas-paper-on-dark)" }}
					>
						{t("title")}
					</h2>
					<p
						className="text-[17px] mt-3 leading-[1.8]"
						style={{ color: "rgba(234,243,251,0.7)" }}
					>
						{t("description")}
					</p>
					<ul className="mas-ai-points grid gap-4 mt-7 list-none p-0">
						{(["1", "2", "3", "4"] as const).map((key) => (
							<li key={key}>
								<span className="tick" aria-hidden="true">
									✓
								</span>
								<span>{t(`bullets.${key}`)}</span>
							</li>
						))}
					</ul>
					<Link
						href="/auth/signup"
						className="inline-flex items-center gap-2 mt-8 text-[15px] font-bold text-[#5fbcf9] border-b-[1.5px] border-dashed border-[#5fbcf9]/50 pb-0.5 transition-[gap] duration-300 hover:gap-4"
					>
						{t("cta")}
						<span className="rtl-flip" aria-hidden="true">
							→
						</span>
					</Link>
				</div>

				{/* Chat mockup */}
				<div
					ref={chatRef}
					className={`mas-chat mas-rv${playing ? " play" : ""}`}
					role="img"
					aria-label={t("chatHeader")}
					style={{ "--d": "0.15s" } as React.CSSProperties}
				>
					<div className="mas-chat-top">
						<span
							className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
							style={{
								background:
									"linear-gradient(135deg, #38bdf8, var(--mas-blue-deep))",
								boxShadow: "0 6px 14px -6px var(--mas-glow)",
							}}
						>
							<Bot size={20} color="#fff" />
						</span>
						<div>
							<div
								className="text-sm font-bold"
								style={{ color: "var(--mas-ink)" }}
							>
								{t("chatHeader")}
							</div>
							<div className="mas-chat-status">
								{t("chatStatus")}
							</div>
						</div>
					</div>
					<div className="grid gap-3.5 p-5">
						<div
							className="mas-msg user"
							style={{ transitionDelay: "0.15s" }}
						>
							{t("chat.1")}
						</div>
						<div
							className="mas-msg bot"
							style={{ transitionDelay: "0.8s" }}
						>
							{t("chatTable.intro")}
							<table>
								<tbody>
									<tr>
										<td>{t("chatTable.materials")}</td>
										<td>45,000 SAR</td>
									</tr>
									<tr>
										<td>{t("chatTable.labor")}</td>
										<td>32,000 SAR</td>
									</tr>
									<tr>
										<td>{t("chatTable.equipment")}</td>
										<td>18,000 SAR</td>
									</tr>
									<tr>
										<td>{t("chatTable.total")}</td>
										<td>95,000 SAR</td>
									</tr>
								</tbody>
							</table>
							<span className="good">
								✓ {t("chatTable.under")}
							</span>
						</div>
						<div
							className="mas-msg user"
							style={{ transitionDelay: "1.6s" }}
						>
							{t("chat.3")}
						</div>
						<div
							className="mas-msg typing"
							style={{ transitionDelay: "2.2s" }}
							aria-hidden="true"
						>
							<i />
							<i />
							<i />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
