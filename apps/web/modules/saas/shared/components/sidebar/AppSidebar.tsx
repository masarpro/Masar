"use client";

import { cn } from "@ui/lib";
import { Menu } from "lucide-react";
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
	const { collapsed, mobileOpen, setMobileOpen, toggleMobile } = useSidebar();
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
					"flex flex-col",
					"bg-background border-e border-border shadow-xl",
					"transition-all duration-300 ease-out",
					// Width: full overlay on mobile, collapsible on desktop
					isMobile
						? "w-[280px] max-w-[85vw]"
						: effectiveCollapsed
							? SIDEBAR_WIDTH_COLLAPSED
							: SIDEBAR_WIDTH_EXPANDED,
					// Mobile: slide off-screen when closed (RTL-aware)
					isMobile &&
						!mobileOpen &&
						"-translate-x-full rtl:translate-x-full",
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
				<SidebarFooter collapsed={effectiveCollapsed} />
			</aside>

			{/* Mobile toggle button (hamburger) */}
			{isMobile && (
				<button
					type="button"
					onClick={toggleMobile}
					className={cn(
						"fixed start-4 top-4 z-[45] rounded-xl border border-border bg-background p-2.5 shadow-md",
						"transition-opacity duration-200 ease-out",
						mobileOpen && "pointer-events-none opacity-0",
					)}
					aria-label="Open menu"
				>
					<Menu className="size-6" />
				</button>
			)}
		</>
	);
}
