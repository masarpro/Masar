"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

/**
 * The classic journey diagram (curved line + 5 numbered stations:
 * 01 التسعير → 05 التسليم), recolored to the Botly palette for the
 * fixed-dark hero: dashed white line, Brand/01 amber nodes with the
 * station number inside, light labels. Self-contained — no legacy lp-
 * or mas- CSS classes.
 */

const PATH_D =
	"M880 55 C 760 20, 700 90, 570 60 S 340 25, 240 62 S 80 95, 20 50";

const STATIONS = [
	{ key: "pricing", no: "01", cx: 880, cy: 55, labelY: 95, sub: "BOQ", subY: 112, href: "#st-1" },
	{ key: "contract", no: "02", cx: 660, cy: 66, labelY: 106, href: "#st-2" },
	{ key: "execution", no: "03", cx: 450, cy: 42, labelY: 20, href: "#st-3" },
	{ key: "invoicing", no: "04", cx: 235, cy: 62, labelY: 102, sub: "ZATCA", subY: 119, href: "#st-4" },
	{ key: "handover", no: "05", cx: 20, cy: 50, labelY: 24, href: "#st-5" },
] as const;

export function BotlyPathStrip() {
	const t = useTranslations();
	const [showComet, setShowComet] = useState(false);

	useEffect(() => {
		if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setShowComet(true);
		}
	}, []);

	return (
		<div
			className="mx-auto w-full max-w-[900px]"
			aria-label={t("hero.stations.aria")}
		>
			{/* The path coordinates are authored LTR; pin direction so the
			    curve renders identically in RTL */}
			<div dir="ltr">
				<svg
					className="block h-auto w-full overflow-visible"
					viewBox="0 0 900 130"
				>
					{/* dashed journey line */}
					<path
						d={PATH_D}
						fill="none"
						stroke="rgba(255,255,255,0.18)"
						strokeWidth="2.5"
						strokeLinecap="round"
						strokeDasharray="1 9"
					/>
					{STATIONS.map((st) => (
						<a
							key={st.key}
							href={st.href}
							aria-label={t(`hero.stations.${st.key}`)}
							className="cursor-pointer"
						>
							{/* halo */}
							<circle
								cx={st.cx}
								cy={st.cy}
								r="16"
								fill="rgba(255,204,111,0.15)"
							/>
							{/* Brand/01 node with the station number inside */}
							<circle
								cx={st.cx}
								cy={st.cy}
								r="11"
								fill="#ffcc6f"
								stroke="#0f0b1d"
								strokeWidth="2"
							/>
							<text
								x={st.cx}
								y={st.cy + 3.5}
								textAnchor="middle"
								fill="#1d1d1d"
								fontSize="9.5"
								fontWeight="800"
							>
								{st.no}
							</text>
							{/* label */}
							<text
								x={st.cx === 20 ? 24 : st.cx}
								y={st.labelY}
								textAnchor="middle"
								fill="#eceaf0"
								fontSize="14"
								fontWeight="700"
							>
								{t(`hero.stations.${st.key}`)}
							</text>
							{"sub" in st && st.sub ? (
								<text
									x={st.cx}
									y={st.subY}
									textAnchor="middle"
									fill="rgba(236,234,240,0.45)"
									fontSize="10"
									fontWeight="600"
								>
									{st.sub}
								</text>
							) : null}
						</a>
					))}
					{/* travelling comet in Brand/01 */}
					{showComet ? (
						<circle r="6" opacity="0" fill="#ffcc6f" aria-hidden="true">
							<animateMotion
								dur="7s"
								begin="2s"
								repeatCount="indefinite"
								calcMode="linear"
								keyPoints="0;1;1"
								keyTimes="0;0.6;1"
								path={PATH_D}
							/>
							<animate
								attributeName="opacity"
								values="0;0.9;0.9;0;0"
								keyTimes="0;0.06;0.6;0.66;1"
								dur="7s"
								begin="2s"
								repeatCount="indefinite"
							/>
						</circle>
					) : null}
				</svg>
			</div>
		</div>
	);
}
