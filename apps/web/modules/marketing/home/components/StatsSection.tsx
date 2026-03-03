"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

function useCounter(end: number, duration = 2200) {
	const [count, setCount] = useState(0);
	const [started, setStarted] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const obs = new IntersectionObserver(
			([e]) => {
				if (e.isIntersecting) setStarted(true);
			},
			{ threshold: 0.3 },
		);
		obs.observe(el);
		return () => obs.disconnect();
	}, []);

	useEffect(() => {
		if (!started) return;
		let t0: number | undefined;
		const step = (ts: number) => {
			if (t0 === undefined) t0 = ts;
			const p = Math.min((ts - t0) / duration, 1);
			setCount(Math.floor((1 - (1 - p) ** 4) * end));
			if (p < 1) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	}, [started, end, duration]);

	return { count, ref };
}

const stats = [
	{
		value: 500,
		suffix: "+",
		icon: "⚡",
		color: "#10B981",
		labelKey: "stats.endpoints",
	},
	{
		value: 77,
		suffix: "",
		icon: "🧩",
		color: "#3B82F6",
		labelKey: "stats.models",
	},
	{
		value: 120,
		suffix: "+",
		icon: "📱",
		color: "#8B5CF6",
		labelKey: "stats.pages",
	},
	{
		value: 100,
		suffix: "%",
		icon: "🌐",
		color: "#06B6D4",
		labelKey: "stats.arabic",
	},
];

function StatCard({
	value,
	suffix,
	icon,
	color,
	label,
}: {
	value: number;
	suffix: string;
	icon: string;
	color: string;
	label: string;
}) {
	const { count, ref } = useCounter(value);
	return (
		<div
			ref={ref}
			className="text-center p-8 relative rounded-3xl"
			style={{
				background: `linear-gradient(160deg, ${color}06, transparent)`,
				border: `1px solid ${color}10`,
			}}
		>
			<div
				className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full pointer-events-none"
				style={{
					background: `radial-gradient(circle, ${color}10, transparent 70%)`,
					filter: "blur(25px)",
				}}
			/>
			<div className="text-lg mb-3">{icon}</div>
			<div
				className="text-5xl font-black mb-2"
				style={{
					fontFamily: "'Space Grotesk', 'DM Sans', sans-serif",
					background: `linear-gradient(135deg, ${color}, ${color}BB)`,
					WebkitBackgroundClip: "text",
					WebkitTextFillColor: "transparent",
					backgroundClip: "text",
				}}
			>
				{count}
				{suffix}
			</div>
			<p className="text-white/40 text-sm font-medium">{label}</p>
		</div>
	);
}

export function StatsSection() {
	const t = useTranslations();

	return (
		<section
			className="relative py-24 px-6"
			style={{
				background: "#050508",
				borderTop: "1px solid rgba(255,255,255,0.04)",
				borderBottom: "1px solid rgba(255,255,255,0.04)",
			}}
		>
			<div className="max-w-[1000px] mx-auto">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
					{stats.map((s) => (
						<StatCard
							key={s.labelKey}
							value={s.value}
							suffix={s.suffix}
							icon={s.icon}
							color={s.color}
							label={t(s.labelKey)}
						/>
					))}
				</div>
			</div>
		</section>
	);
}
