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
					"flex h-16 items-center border-b border-border px-4",
					collapsed ? "justify-end" : "justify-between",
				)}
			>
				{!collapsed && (
					<div className="flex items-center gap-3">
						<Link href="/app" className="block">
							<Logo />
						</Link>
					</div>
				)}
				<button
					type="button"
					onClick={toggleCollapsed}
					className={cn(
						"rounded-lg p-2 transition-colors duration-200 ease-out hover:bg-muted",
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
