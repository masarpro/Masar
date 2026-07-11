"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

function useCounter(end: number, duration = 1600) {
	const [count, setCount] = useState(0);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) {
			return;
		}
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			setCount(end);
			return;
		}
		const obs = new IntersectionObserver(
			([e]) => {
				if (!e.isIntersecting) {
					return;
				}
				obs.disconnect();
				let t0: number | undefined;
				const step = (ts: number) => {
					if (t0 === undefined) {
						t0 = ts;
					}
					const p = Math.min((ts - t0) / duration, 1);
					setCount(Math.round((1 - (1 - p) ** 3) * end));
					if (p < 1) {
						requestAnimationFrame(step);
					}
				};
				requestAnimationFrame(step);
			},
			{ threshold: 0.5 },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, [end, duration]);

	return { count, ref };
}

const STATS = [
	{ value: 500, suffix: "+", labelKey: "stats.endpoints" },
	{ value: 77, suffix: "", labelKey: "stats.models" },
	{ value: 120, suffix: "+", labelKey: "stats.pages" },
	{ value: 100, suffix: "%", labelKey: "stats.arabic" },
] as const;

function Stat({
	value,
	suffix,
	label,
	delay,
}: {
	value: number;
	suffix: string;
	label: string;
	delay: number;
}) {
	const { count, ref } = useCounter(value);
	return (
		<div
			ref={ref}
			className="mas-stat mas-rv text-center"
			style={{ "--d": `${delay}s` } as React.CSSProperties}
		>
			<b>
				{count}
				{suffix && <i>{suffix}</i>}
			</b>
			<span>{label}</span>
		</div>
	);
}

export function StatsSection() {
	const t = useTranslations();

	return (
		<div className="mas-navy-sec mas-on-dark py-14 md:py-16 px-6">
			<div className="relative z-[1] max-w-[1180px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
				{STATS.map((s, i) => (
					<Stat
						key={s.labelKey}
						value={s.value}
						suffix={s.suffix}
						label={t(s.labelKey)}
						delay={i * 0.1}
					/>
				))}
			</div>
		</div>
	);
}
