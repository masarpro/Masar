"use client";

import { config } from "@repo/config";
import { cn } from "@ui/lib";
import { useSidebar } from "./sidebar-context";

interface SidebarInsetProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * Main content area that adjusts margin based on sidebar state.
 * Uses Tailwind xl: breakpoint (1280px) to match useIsMobile hook.
 * Below xl: full width (sidebar is overlay). Above xl: margin for sidebar.
 */
export function SidebarInset({ children, className }: SidebarInsetProps) {
	const { collapsed } = useSidebar();

	return (
		<div
			className={cn(
				"flex-1 py-2 xl:py-4",
				config.ui.saas.useSidebarLayout && "min-h-[calc(100vh)]",
				config.ui.saas.useSidebarLayout && [
					"xl:pe-4",
					collapsed ? "xl:ms-20" : "xl:ms-[280px]",
				],
				className,
			)}
		>
			<main
				className={cn(
					"rounded-3xl bg-card min-h-full w-full",
					"px-3 py-4 xl:px-8 xl:py-8",
				)}
			>
				<div className="container px-0">{children}</div>
			</main>
		</div>
	);
}
