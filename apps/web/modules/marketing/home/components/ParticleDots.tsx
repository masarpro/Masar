"use client";

import { useEffect, useRef } from "react";

/**
 * Animated drifting-dots background (the classic landing effect) —
 * canvas particles with faint connecting lines, tuned for navy sections.
 */
export function ParticleDots() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) {
			return;
		}
		const ctx = canvas.getContext("2d");
		if (!ctx) {
			return;
		}
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
			return;
		}

		let w: number;
		let h: number;
		let animId: number;
		const colors = ["56,189,248", "96,165,250", "125,211,252", "14,165,233"];

		const resize = () => {
			w = canvas.width = canvas.offsetWidth;
			h = canvas.height = canvas.offsetHeight;
		};
		resize();
		window.addEventListener("resize", resize);

		const particles = Array.from({ length: 60 }, () => ({
			x: Math.random() * (w || 800),
			y: Math.random() * (h || 600),
			vx: (Math.random() - 0.5) * 0.4,
			vy: (Math.random() - 0.5) * 0.4,
			r: Math.random() * 2 + 0.5,
			c: colors[Math.floor(Math.random() * colors.length)],
			o: Math.random() * 0.45 + 0.15,
		}));

		const draw = () => {
			ctx.clearRect(0, 0, w, h);
			for (let i = 0; i < particles.length; i++) {
				const p = particles[i];
				p.x += p.vx;
				p.y += p.vy;
				if (p.x < 0 || p.x > w) {
					p.vx *= -1;
				}
				if (p.y < 0 || p.y > h) {
					p.vy *= -1;
				}
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
						ctx.strokeStyle = `rgba(${p.c},${0.06 * (1 - dist / 100)})`;
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
			aria-hidden="true"
		/>
	);
}
