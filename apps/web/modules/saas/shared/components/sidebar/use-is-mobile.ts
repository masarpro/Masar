"use client";

import { useEffect, useState } from "react";

const XL_BREAKPOINT = 1280;

/**
 * Returns true when viewport is below xl (1280px).
 * Used to show mobile sidebar behavior (hidden by default, overlay when opened).
 */
export function useIsMobile(): boolean {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const mq = window.matchMedia(`(max-width: ${XL_BREAKPOINT - 1}px)`);

		const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		setIsMobile(mq.matches);

		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	return isMobile;
}
