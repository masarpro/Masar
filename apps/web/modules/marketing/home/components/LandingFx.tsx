"use client";

import { useEffect, useRef } from "react";

/**
 * Landing-wide effects: top scroll-progress bar + scroll reveals.
 * Mounted once at the end of the landing page tree so its effect runs
 * after every section's DOM is committed.
 */
export function LandingFx() {
	const barRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const bar = barRef.current;
		let raf = 0;
		const onScroll = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				if (!bar) {
					return;
				}
				const h = document.documentElement;
				const max = h.scrollHeight - h.clientHeight;
				bar.style.width =
					max > 0 ? `${(h.scrollTop / max) * 100}%` : "0%";
			});
		};
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();

		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						e.target.classList.add("vis");
						io.unobserve(e.target);
					}
				}
			},
			{ threshold: 0.16 },
		);
		for (const el of document.querySelectorAll(".mas-rv, .mas-station")) {
			io.observe(el);
		}

		return () => {
			window.removeEventListener("scroll", onScroll);
			cancelAnimationFrame(raf);
			io.disconnect();
		};
	}, []);

	return <div ref={barRef} className="mas-progress" aria-hidden="true" />;
}
