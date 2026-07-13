"use client";

import { useEffect, useRef } from "react";

/**
 * Landing-wide effects: top scroll-progress bar + scroll reveals.
 * Reveals are a rAF-throttled viewport sweep (NOT IntersectionObserver):
 * the sweep re-queries unrevealed elements each pass, so nodes that get
 * re-created after mount (hydration, HMR) still reveal — an IO registered
 * once at mount silently missed those and left cards at opacity 0.
 */
export function LandingFx() {
	const barRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const bar = barRef.current;
		let raf = 0;

		const sweep = () => {
			const vh = window.innerHeight;
			for (const el of document.querySelectorAll(
				".bl-rv:not(.vis), .mas-rv:not(.vis), .mas-station:not(.vis)",
			)) {
				const r = el.getBoundingClientRect();
				if (r.top < vh * 0.92 && r.bottom > 0) {
					el.classList.add("vis");
				}
			}
		};

		const onScroll = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				if (bar) {
					const h = document.documentElement;
					const max = h.scrollHeight - h.clientHeight;
					bar.style.width =
						max > 0 ? `${(h.scrollTop / max) * 100}%` : "0%";
				}
				sweep();
			});
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		window.addEventListener("resize", onScroll, { passive: true });
		onScroll();
		// late pass: catches nodes committed after first paint (hash scroll,
		// hydration re-creates) without waiting for a user scroll
		const t = setTimeout(sweep, 400);

		return () => {
			window.removeEventListener("scroll", onScroll);
			window.removeEventListener("resize", onScroll);
			cancelAnimationFrame(raf);
			clearTimeout(t);
		};
	}, []);

	return (
		<div
			ref={barRef}
			className="fixed top-0 start-0 z-[60] h-[3px] w-0 bg-chart-1"
			aria-hidden="true"
		/>
	);
}
