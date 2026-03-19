"use client";

import { config } from "@repo/config";
import { cn } from "@ui/lib";
import { GlobalHeader } from "../global-header";
import { useSidebar } from "./sidebar-context";

interface SidebarInsetProps {
	children: React.ReactNode;
	className?: string;
}

/**
 * Main content area that adjusts margin based on sidebar state.
 * Uses Tailwind xl: breakpoint (1280px) to match useIsMobile hook.
 * Below xl: full width (sidebar is overlay). Above xl: margin for sidebar.
 *
 * Layout: GlobalHeader (sticky) + scrollable content area.
 */
export function SidebarInset({ children, className }: SidebarInsetProps) {
	const { collapsed, ready } = useSidebar();

	return (
		<div
			className={cn(
				"flex-1 flex flex-col min-h-0 min-w-0",
				config.ui.saas.useSidebarLayout && [
					"xl:pe-4",
					collapsed ? "xl:ms-20" : "xl:ms-[280px]",
					ready && "transition-[margin] duration-300 ease-out",
				],
				className,
			)}
		>
			<GlobalHeader />
			<div className="flex-1 overflow-y-auto min-h-0 py-2 xl:py-4">
				<main
					className={cn(
						"rounded-3xl bg-background min-h-full w-full overflow-x-hidden",
						"px-3 py-4 xl:px-8 xl:py-8",
					)}
				>
					<div className="w-full max-w-[1400px] mx-auto">
						{children}
					</div>
				</main>
			</div>
		</div>
	);
}
