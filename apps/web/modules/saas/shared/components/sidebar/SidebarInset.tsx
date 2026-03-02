"use client";

import { config } from "@repo/config";
import { cn } from "@ui/lib";
import { useSidebar } from "./sidebar-context";
import { useIsMobile } from "./use-is-mobile";

interface SidebarInsetProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * Main content area that adjusts margin based on sidebar state.
 * Uses config.ui.saas.useSidebarLayout for layout behavior.
 */
export function SidebarInset({ children, className }: SidebarInsetProps) {
	const { collapsed } = useSidebar();
	const isMobile = useIsMobile();

	// On mobile: no margin (sidebar is overlay). On desktop: margin for sidebar.
	const needsSidebarMargin =
		config.ui.saas.useSidebarLayout && !isMobile;

	return (
		<div
			className={cn(
				"flex-1",
				isMobile ? "py-2" : "py-4",
				config.ui.saas.useSidebarLayout && "min-h-[calc(100vh)]",
				needsSidebarMargin && [
					"pe-4",
					collapsed ? "ms-20" : "ms-[280px]",
				],
				className,
			)}
		>
			<main
				className={cn(
					"rounded-3xl bg-card min-h-full w-full",
					isMobile ? "px-3 py-4" : "p-8",
				)}
			>
				<div className="container px-0">{children}</div>
			</main>
		</div>
	);
}
