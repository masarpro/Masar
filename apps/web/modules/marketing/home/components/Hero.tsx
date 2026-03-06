"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

function MeshBackground() {
	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none">
			<div className="landing-orb landing-orb-1" />
			<div className="landing-orb landing-orb-2" />
			<div className="landing-orb landing-orb-3" />
			<div className="landing-orb landing-orb-4" />
			<div className="landing-noise" />
			<div className="landing-grid" />
			<div className="landing-glow-line" />
		</div>
	);
}

function ParticleField() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let w: number;
		let h: number;
		let animId: number;
		const colors = [
			"16,185,129",
			"59,130,246",
			"139,92,246",
			"6,182,212",
		];

		const resize = () => {
			w = canvas.width = canvas.offsetWidth;
			h = canvas.height = canvas.offsetHeight;
		};
		resize();
		window.addEventListener("resize", resize);

		const particles = Array.from({ length: 70 }, () => ({
			x: Math.random() * (w || 800),
			y: Math.random() * (h || 600),
			vx: (Math.random() - 0.5) * 0.4,
			vy: (Math.random() - 0.5) * 0.4,
			r: Math.random() * 2 + 0.5,
			c: colors[Math.floor(Math.random() * colors.length)],
			o: Math.random() * 0.5 + 0.15,
		}));

		const draw = () => {
			ctx.clearRect(0, 0, w, h);
			for (let i = 0; i < particles.length; i++) {
				const p = particles[i];
				p.x += p.vx;
				p.y += p.vy;
				if (p.x < 0 || p.x > w) p.vx *= -1;
				if (p.y < 0 || p.y > h) p.vy *= -1;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(${p.c},${p.o})`;
				ctx.fill();
				for (let j = i + 1; j < particles.length; j++) {
					const dx = p.x - particles[j].x;
					const dy = p.y - particles[j].y;
					const dist = Math.sqrt(dx * dx + dy * dy);
					if (dist < 100) {
						ctx.beginPath();
						ctx.moveTo(p.x, p.y);
						ctx.lineTo(particles[j].x, particles[j].y);
						ctx.strokeStyle = `rgba(${p.c},${0.05 * (1 - dist / 100)})`;
						ctx.stroke();
					}
				}
			}
			animId = requestAnimationFrame(draw);
		};
		draw();

		return () => {
			cancelAnimationFrame(animId);
			window.removeEventListener("resize", resize);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="absolute inset-0 w-full h-full pointer-events-none"
			style={{ opacity: "var(--lp-effects-opacity)" }}
		/>
	);
}

export function Hero() {
	const t = useTranslations();

	return (
		<section
			className="relative min-h-screen overflow-hidden flex items-center pt-36 pb-12 px-6"
			style={{ background: "var(--lp-bg)" }}
		>
			{/* Light mode animated background */}
			<div className="landing-light-bg">
				<div className="landing-light-blob" />
			</div>
			<MeshBackground />
			<ParticleField />
			{/* Radial vignette */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background:
						"radial-gradient(ellipse at center, transparent 40%, var(--lp-bg) 80%)",
				}}
			/>

			<div className="relative z-10 max-w-[1200px] mx-auto w-full">
				<div className="max-w-[780px] ms-auto me-0 rtl:ms-0 rtl:me-auto">
					{/* Badge */}
					<div className="animate-fade-in mb-9">
						<div
							className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full"
							style={{
								background:
									"linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))",
								border: "1px solid rgba(16,185,129,0.15)",
							}}
						>
							<span className="text-[#10B981] text-sm font-semibold">
								{t("hero.badge")}
							</span>
						</div>
					</div>

					{/* Title */}
					<div className="animate-fade-in-delay-1">
						<h1 className="flex items-baseline gap-3 flex-wrap mb-4">
							<span
								className="text-[clamp(2.2rem,6vw,5rem)] font-black leading-[1.1]"
								style={{ color: "var(--lp-text)" }}
							>
								{t("hero.titleBrand")}
							</span>
							<span
								className="text-[clamp(1rem,2.5vw,1.75rem)] font-bold leading-[1.3]"
								style={{ color: "var(--lp-text)" }}
							>
								{t("hero.titleDesc")}
							</span>
						</h1>
					</div>

					{/* Subtitle — emerald */}
					<div className="animate-fade-in-delay-1">
						<p
							className="text-[clamp(1rem,2.8vw,1.75rem)] font-semibold leading-[1.4] mb-4"
							style={{ color: "#10B981" }}
						>
							{t("hero.subtitle")}
						</p>
					</div>

					{/* Description */}
					<div className="animate-fade-in-delay-2">
						<p
							className="text-[clamp(0.85rem,1.8vw,1.15rem)] leading-[1.8] mb-12 max-w-2xl"
							style={{ color: "var(--lp-text-muted)" }}
						>
							{t("hero.description")}
						</p>
					</div>

					{/* CTA Buttons */}
					<div className="animate-fade-in-delay-3">
						<div className="flex flex-col sm:flex-row gap-4 flex-wrap">
							<Link
								href="/auth/signup"
								className="btn-premium btn-premium-primary"
							>
								{t("hero.cta")}
								<span className="text-xl rtl-flip">→</span>
							</Link>
							<a
								href="#features"
								className="btn-premium btn-premium-ghost"
							>
								{t("hero.secondary")}
								<span className="text-base opacity-50">↓</span>
							</a>
						</div>
					</div>

					{/* Tagline */}
					<div className="animate-fade-in-delay-3 mt-6 mb-6">
						<p
							className="text-sm italic"
							style={{ color: "var(--lp-text-subtle)" }}
						>
							"{t("hero.tagline")}"
						</p>
					</div>

					{/* Social Proof */}
					<div className="animate-fade-in-delay-4 mt-0">
						<div className="flex items-center gap-4">
							<div className="flex">
								{["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6"].map(
									(color, i) => (
										<div
											key={color}
											className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white font-bold"
											style={{
												background: `linear-gradient(135deg, ${color}, ${color}99)`,
												border: `3px solid var(--lp-avatar-ring)`,
												marginInlineStart:
													i > 0 ? -10 : 0,
												boxShadow: `0 0 12px ${color}33`,
											}}
										>
											{["م", "ع", "خ", "ف"][i]}
										</div>
									),
								)}
							</div>
							<div>
								<div className="flex gap-0.5 mb-1">
									{[1, 2, 3, 4, 5].map((i) => (
										<span
											key={i}
											className="text-[#F59E0B] text-sm"
											style={{
												textShadow:
													"0 0 8px rgba(245,158,11,0.4)",
											}}
										>
											★
										</span>
									))}
								</div>
								<p
									className="text-[13px] font-medium"
									style={{
										color: "var(--lp-text-subtle)",
									}}
								>
									{t("hero.proof")}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
