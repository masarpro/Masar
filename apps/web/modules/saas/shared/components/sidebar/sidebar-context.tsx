"use client";

import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

// Cookie (not localStorage): a cookie is readable by the server component
// layout, so it can pass `defaultCollapsed` and the sidebar renders at the
// correct width on the FIRST server paint. localStorage is only readable after
// the client mounts, which forced a "start wrong → snap to right" flash on
// every full page load. Exported so the layout reads the exact same name.
export const SIDEBAR_COLLAPSED_COOKIE = "masar-sidebar-collapsed";
const XL_BREAKPOINT = 1280;

function writeCollapsedCookie(value: boolean) {
	try {
		// 1-year persistence, path=/ so every route sees it, Lax for normal nav.
		document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=${
			value ? "1" : "0"
		}; path=/; max-age=31536000; SameSite=Lax`;
	} catch {
		// Ignore (e.g. cookies disabled) — state still works in-memory this session.
	}
}

interface SidebarContextValue {
	collapsed: boolean;
	setCollapsed: (collapsed: boolean) => void;
	toggleCollapsed: () => void;
	mobileOpen: boolean;
	setMobileOpen: (open: boolean) => void;
	toggleMobile: () => void;
	ready: boolean;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
	children,
	defaultCollapsed = false,
}: PropsWithChildren<{ defaultCollapsed?: boolean }>) {
	// `collapsed` is seeded from the cookie the server already read, so SSR and
	// the first client render agree — no snap, no hydration mismatch.
	const [collapsed, setCollapsedState] = useState(defaultCollapsed);
	const [mobileOpen, setMobileOpen] = useState(false);
	// `ready` still gates the mobile overlay's opacity/transform: the server
	// can't know the viewport, so the sidebar stays hidden below xl until the
	// client confirms it. On desktop it's shown immediately (see AppSidebar).
	const [ready, setReady] = useState(false);

	// Close mobile sidebar when viewport grows above xl (switching to desktop mode)
	useEffect(() => {
		const mq = window.matchMedia(`(min-width: ${XL_BREAKPOINT}px)`);
		const handler = (e: MediaQueryListEvent) => {
			if (e.matches) {
				setMobileOpen(false);
			}
		};
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	// Mark ready after mount (mobile-overlay reveal only). No state read here —
	// the cookie-seeded initial value is already correct.
	useEffect(() => {
		setReady(true);
	}, []);

	// Persist to the cookie so the next server render seeds the right value.
	const setCollapsed = useCallback((value: boolean) => {
		setCollapsedState(value);
		writeCollapsedCookie(value);
	}, []);

	const toggleCollapsed = useCallback(() => {
		setCollapsedState((prev) => {
			const newValue = !prev;
			writeCollapsedCookie(newValue);
			return newValue;
		});
	}, []);

	const toggleMobile = useCallback(() => {
		setMobileOpen((prev) => !prev);
	}, []);

	const value: SidebarContextValue = {
		collapsed,
		setCollapsed,
		toggleCollapsed,
		mobileOpen,
		setMobileOpen,
		toggleMobile,
		ready,
	};

	return (
		<SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
	);
}

export function useSidebar(): SidebarContextValue {
	const ctx = useContext(SidebarContext);
	if (!ctx) {
		throw new Error("useSidebar must be used within SidebarProvider");
	}
	return ctx;
}
