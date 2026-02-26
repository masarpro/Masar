"use client";

import { cn } from "@ui/lib";
import { ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useSidebar } from "./sidebar-context";
import { Logo } from "@shared/components/Logo";

interface SidebarHeaderProps {
	collapsed: boolean;
	headerExtra?: ReactNode;
}

export function SidebarHeader({ collapsed, headerExtra }: SidebarHeaderProps) {
	const { toggleCollapsed } = useSidebar();

	return (
		<>
			<div
				className={cn(
					"relative flex h-16 items-center border-b border-border px-4",
					"justify-end",
				)}
			>
				{!collapsed && (
					<Link
						href="/app"
						className="absolute inset-0 flex items-center justify-center text-foreground"
					>
						<Logo />
					</Link>
				)}
				<button
					type="button"
					onClick={toggleCollapsed}
					className={cn(
						"relative z-10 rounded-lg p-2 transition-colors duration-200 ease-out hover:bg-muted",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
					)}
					aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					{collapsed ? (
						<ChevronRight className="size-5 rtl-flip" />
					) : (
						<Menu className="size-5" />
					)}
				</button>
			</div>

			{!collapsed && headerExtra && (
				<div className="border-b border-border px-3 py-2">
					{headerExtra}
				</div>
			)}
		</>
	);
}
