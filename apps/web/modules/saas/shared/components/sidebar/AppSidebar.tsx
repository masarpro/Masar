"use client";

import { cn } from "@ui/lib";
import { useEffect } from "react";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNav } from "./SidebarNav";
import { useSidebar } from "./sidebar-context";
import { useIsMobile } from "./use-is-mobile";
import { useSidebarMenu } from "./use-sidebar-menu";

/** Matches config.ui.saas: 280px expanded, 80px collapsed */
const SIDEBAR_WIDTH_EXPANDED = "w-[280px]";
const SIDEBAR_WIDTH_COLLAPSED = "w-20";

interface AppSidebarProps {
	headerExtra?: React.ReactNode;
}

export function AppSidebar({ headerExtra }: AppSidebarProps) {
	const { collapsed, mobileOpen, setMobileOpen, ready } = useSidebar();
	const { items, activeId } = useSidebarMenu();
	const isMobile = useIsMobile();

	// Lock body scroll when mobile sidebar is open
	useEffect(() => {
		if (isMobile && mobileOpen) {
			document.body.classList.add("overflow-hidden");
		} else {
			document.body.classList.remove("overflow-hidden");
		}
		return () => document.body.classList.remove("overflow-hidden");
	}, [isMobile, mobileOpen]);

	// On mobile, always show expanded sidebar (not collapsed icon-only version)
	const effectiveCollapsed = isMobile ? false : collapsed;

	// Determine correct transform direction for hiding sidebar off-screen
	// In RTL (start-0 = right:0): translate-x-full slides right → off-screen
	// In LTR (start-0 = left:0): -translate-x-full slides left → off-screen
	// When isMobile is true, we're guaranteed to be in the browser
	const sidebarHidden = isMobile && !mobileOpen;
	let hideTransformClass: string | undefined;
	if (sidebarHidden) {
		const isRtl = document.documentElement.dir === "rtl";
		hideTransformClass = isRtl ? "translate-x-full" : "-translate-x-full";
	}

	return (
		<>
			{/* Overlay backdrop: renders always on mobile for smooth fade transition */}
			{isMobile && (
				<div
					className={cn(
						"fixed inset-0 z-[55] bg-black/50",
						"transition-opacity duration-300 ease-out",
						mobileOpen
							? "opacity-100"
							: "pointer-events-none opacity-0",
					)}
					onClick={() => setMobileOpen(false)}
					onKeyDown={(e) => {
						if (e.key === "Escape") setMobileOpen(false);
					}}
					role="button"
					tabIndex={-1}
					aria-label="Close sidebar"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed top-0 z-[60] h-full start-0",
					!ready && "opacity-0",
					"flex flex-col",
					"bg-background border-e border-border shadow-xl",
					ready && "transition-[width,opacity,transform] duration-300 ease-out",
					// Width: full overlay on mobile, collapsible on desktop
					isMobile
						? "w-[280px] max-w-[85vw]"
						: effectiveCollapsed
							? SIDEBAR_WIDTH_COLLAPSED
							: SIDEBAR_WIDTH_EXPANDED,
					// Mobile: slide off-screen when closed (direction-aware)
					hideTransformClass,
				)}
			>
				<SidebarHeader
					collapsed={effectiveCollapsed}
					headerExtra={headerExtra}
				/>
				<SidebarNav
					items={items}
					activeId={activeId}
					collapsed={effectiveCollapsed}
				/>
				<SidebarFooter />
			</aside>
		</>
	);
}
