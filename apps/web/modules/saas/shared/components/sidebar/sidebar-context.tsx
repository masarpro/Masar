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

	// Close sidebar when viewport shrinks below xl (prevents overlap on resize)
	useEffect(() => {
		const handler = () => {
			if (window.innerWidth < XL_BREAKPOINT) {
				setMobileOpen(false);
			}
		};
		window.addEventListener("resize", handler);
		return () => window.removeEventListener("resize", handler);
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
