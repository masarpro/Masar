"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const PATH_D =
	"M880 55 C 760 20, 700 90, 570 60 S 340 25, 240 62 S 80 95, 20 50";

const STATIONS = [
	{ key: "pricing", cx: 880, cy: 55, labelY: 95, sub: "BOQ", subY: 112, pd: "0.6s", hd: "3.3s", href: "#features" },
	{ key: "contract", cx: 660, cy: 66, labelY: 106, pd: "1.1s", hd: "4.35s", href: "#features" },
	{ key: "execution", cx: 450, cy: 42, labelY: 20, pd: "1.6s", hd: "5.4s", href: "#features" },
	{ key: "invoicing", cx: 235, cy: 62, labelY: 102, sub: "ZATCA", subY: 119, pd: "2.1s", hd: "6.45s", href: "#pricing" },
	{ key: "handover", cx: 20, cy: 50, labelY: 24, pd: "2.6s", hd: "7.5s", href: "#features" },
] as const;

export function PathStrip() {
	const t = useTranslations();
	const [entered, setEntered] = useState(false);

	useEffect(() => {
		const id = requestAnimationFrame(() => setEntered(true));
		return () => cancelAnimationFrame(id);
	}, []);

	return (
		<div
			className={`lp-path-strip${entered ? " lp-entered" : ""}`}
			aria-label={t("hero.stations.aria")}
		>
			<div className="lp-path-ltr">
				<svg className="lp-path-svg" viewBox="0 0 900 130">
					<path className="lp-line-bg" d={PATH_D} />
					<path className="lp-line" d={PATH_D} />
					{STATIONS.map((st) => (
						<a
							key={st.key}
							className="lp-st-link"
							href={st.href}
							aria-label={t(`hero.stations.${st.key}`)}
						>
							<circle
								className="lp-halo"
								cx={st.cx}
								cy={st.cy}
								r="11"
								style={{ "--hd": st.hd } as React.CSSProperties}
							/>
							<circle
								className="lp-node lit"
								cx={st.cx}
								cy={st.cy}
								r="11"
								style={{ "--pd": st.pd } as React.CSSProperties}
							/>
							<text
								className="lp-station-label"
								x={st.cx === 20 ? 24 : st.cx}
								y={st.labelY}
								textAnchor="middle"
							>
								{t(`hero.stations.${st.key}`)}
							</text>
							{"sub" in st && st.sub ? (
								<text
									className="lp-station-sub"
									x={st.cx}
									y={st.subY}
									textAnchor="middle"
								>
									{st.sub}
								</text>
							) : null}
						</a>
					))}
				</svg>
				<span className="lp-comet" aria-hidden="true" />
			</div>
		</div>
	);
}
