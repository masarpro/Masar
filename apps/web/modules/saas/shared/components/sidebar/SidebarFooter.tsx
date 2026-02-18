"use client";

import { cn } from "@ui/lib";
import { ColorModeToggle } from "@shared/components/ColorModeToggle";
import { LocaleSwitch } from "@shared/components/LocaleSwitch";
import { SidebarClock } from "@saas/shared/components/SidebarClock";
import { UserMenu } from "@saas/shared/components/UserMenu";

interface SidebarFooterProps {
	collapsed: boolean;
}

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
	return (
		<div className="mt-auto border-t border-border bg-card p-3">
			<UserMenu showUserName={!collapsed} />
			<div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
				{!collapsed && <SidebarClock />}
				<div
					className={cn(
						"flex items-center gap-2",
						collapsed ? "w-full justify-center" : "justify-end",
					)}
				>
					<LocaleSwitch />
					<ColorModeToggle />
				</div>
			</div>
		</div>
	);
}
