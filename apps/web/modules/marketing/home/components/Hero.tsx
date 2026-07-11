"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { DashboardPreview } from "./DashboardPreview";
import { ParticleDots } from "./ParticleDots";
import { PathStrip } from "./PathStrip";

export function Hero() {
	const t = useTranslations();

	// "mas-entered" is static: the staged entrance is pure CSS, so it plays
	// on first paint without waiting for hydration (better LCP, no blank hero).
	return (
		<section
			className="mas-hero mas-entered pt-40 pb-16 px-6 md:pt-44 md:pb-24"
			id="top"
		>
			{/* drifting aurora blobs + animated dots */}
			<div
				className="absolute inset-0 overflow-hidden pointer-events-none"
				aria-hidden="true"
			>
				<span className="mas-blob mas-blob-1" />
				<span className="mas-blob mas-blob-2" />
				<ParticleDots variant="light" />
			</div>

			<div className="relative z-10 max-w-[1180px] mx-auto w-full">
				<div className="max-w-[800px] mx-auto text-center">
					{/* dimension eyebrow */}
					<div
						className="mas-stage"
						style={{ "--i": 0 } as React.CSSProperties}
					>
						<span className="mas-dim">{t("hero.badge")}</span>
					</div>

					{/* Title */}
					<h1
						className="mas-stage text-[clamp(1.9rem,4.6vw+0.6rem,3.6rem)] font-black leading-[1.3] mt-7 text-balance"
						style={
							{
								"--i": 1,
								color: "var(--mas-ink)",
							} as React.CSSProperties
						}
					>
						{t("hero.titleA")}{" "}
						<span className="mas-path-word">
							{t("hero.titleB")}
							<svg
								viewBox="0 0 90 14"
								preserveAspectRatio="none"
								aria-hidden="true"
							>
								<path d="M4 10 C 28 3, 60 12, 86 5" />
							</svg>
						</span>
					</h1>

					{/* Blue subline */}
					<p
						className="mas-stage text-[clamp(1.05rem,2.4vw,1.4rem)] font-bold mt-6"
						style={
							{
								"--i": 2,
								color: "var(--mas-blue-deep)",
							} as React.CSSProperties
						}
					>
						{t("hero.subtitle")}
					</p>

					{/* Signature journey path */}
					<div
						className="mas-stage mt-10 md:mt-14 flex justify-center"
						style={{ "--i": 3 } as React.CSSProperties}
					>
						<PathStrip />
					</div>

					{/* CTAs */}
					<div
						className="mas-stage flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 md:mt-14"
						style={{ "--i": 5 } as React.CSSProperties}
					>
						<Link
							href="/auth/signup"
							className="mas-btn mas-btn-primary"
						>
							{t("hero.cta")}
							<span className="rtl-flip" aria-hidden="true">
								→
							</span>
						</Link>
						<a href="#features" className="mas-btn mas-btn-ghost">
							{t("hero.secondary")}
							<span className="opacity-60" aria-hidden="true">
								↓
							</span>
						</a>
					</div>

					{/* Trust row */}
					<div
						className="mas-stage mt-11 flex flex-col items-center gap-4"
						style={{ "--i": 6 } as React.CSSProperties}
					>
						<span className="mas-zatca-chip">
							<span
								className="mas-zatca-dot"
								aria-hidden="true"
							/>
							{t("hero.zatcaChip")}
						</span>
						<div className="flex items-center gap-3 flex-wrap justify-center">
							<span className="flex" aria-hidden="true">
								{[
									"#0284c7",
									"#0ea5e9",
									"#0a4e86",
									"#38bdf8",
								].map((color, i) => (
									<i
										key={color}
										className="w-8 h-8 rounded-full grid place-items-center not-italic text-[12px] text-white font-bold"
										style={{
											background: color,
											border: "2px solid var(--mas-bg)",
											marginInlineStart: i > 0 ? -9 : 0,
										}}
									>
										{["م", "ع", "خ", "ف"][i]}
									</i>
								))}
							</span>
							<span
								className="text-[#f5a623] text-[13px] tracking-[2px]"
								aria-hidden="true"
							>
								★★★★★
							</span>
							<span
								className="text-[13px]"
								style={{ color: "var(--mas-muted)" }}
							>
								{t("hero.proof")}
							</span>
						</div>
					</div>
				</div>

				{/* Dashboard screenshot in a browser frame */}
				<div
					className="mas-stage mt-20 md:mt-24"
					style={{ "--i": 7 } as React.CSSProperties}
				>
					<DashboardPreview />
				</div>
			</div>
		</section>
	);
}
