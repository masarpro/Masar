"use client";

import {
	createContext,
	type PropsWithChildren,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

const SIDEBAR_COLLAPSED_KEY = "masar-sidebar-collapsed";
const XL_BREAKPOINT = 1280;

interface SidebarContextValue {
	collapsed: boolean;
	setCollapsed: (collapsed: boolean) => void;
	toggleCollapsed: () => void;
	mobileOpen: boolean;
	setMobileOpen: (open: boolean) => void;
	toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({
	children,
	defaultCollapsed = false,
}: PropsWithChildren<{ defaultCollapsed?: boolean }>) {
	const [collapsed, setCollapsedState] = useState(defaultCollapsed);
	const [mobileOpen, setMobileOpen] = useState(false);

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

	// Hydrate from localStorage
	useEffect(() => {
		try {
			const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
			if (saved != null) {
				setCollapsedState(JSON.parse(saved));
			}
		} catch {
			// Ignore parse errors
		}
	}, []);

	// Persist to localStorage
	const setCollapsed = useCallback((value: boolean) => {
		setCollapsedState(value);
		try {
			localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(value));
		} catch {
			// Ignore storage errors
		}
	}, []);

	const toggleCollapsed = useCallback(() => {
		setCollapsedState((prev) => {
			const newValue = !prev;
			try {
				localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(newValue));
			} catch {
				// Ignore storage errors
			}
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
