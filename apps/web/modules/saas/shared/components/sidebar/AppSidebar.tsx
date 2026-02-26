"use client";

import { cn } from "@ui/lib";
import { Menu } from "lucide-react";
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

	// On mobile: sidebar hidden unless mobileOpen; toggle button visible
	// On desktop (xl+): sidebar always visible; toggle button hidden
	const showSidebar = !isMobile || mobileOpen;
	const showToggleButton = isMobile;

	return (
		<>
			{/* Overlay: only on mobile when sidebar is open */}
			{showToggleButton && mobileOpen && (
				<button
					type="button"
					className="fixed inset-0 z-40 bg-black/50"
					onClick={() => setMobileOpen(false)}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							setMobileOpen(false);
						}
					}}
					aria-label="Close sidebar"
				/>
			)}

			{/* Sidebar: hidden on mobile when closed; visible on desktop or when mobileOpen */}
			<aside
				className={cn(
					"fixed top-0 z-50 h-full start-0",
					"flex flex-col",
					"bg-background border-e border-border",
					"transition-all duration-300 ease-out",
					collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH_EXPANDED,
					!showSidebar && "hidden",
				)}
			>
				<SidebarHeader collapsed={collapsed} headerExtra={headerExtra} />
				<SidebarNav items={items} activeId={activeId} collapsed={collapsed} />
				<SidebarFooter collapsed={collapsed} />
			</aside>

			{/* Toggle Button: only on mobile */}
			{showToggleButton && (
				<button
					type="button"
					onClick={toggleMobile}
					className={cn(
						"fixed start-4 top-4 z-30 rounded-lg border border-border bg-background p-2",
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
