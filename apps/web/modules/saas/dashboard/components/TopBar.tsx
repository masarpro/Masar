"use client";

import { cn } from "@ui/lib";
import { Bell, Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface TopBarProps {
	userName?: string | null;
	unreadCount?: number;
}

export function TopBar({ userName, unreadCount = 0 }: TopBarProps) {
	const t = useTranslations();

	return (
		<div
			className={cn(
				"flex items-center justify-between px-5 py-3",
				"border-b border-gray-100 bg-white",
				"dark:border-gray-800 dark:bg-gray-950",
			)}
		>
			{/* Title */}
			<h1 className="text-lg font-black text-gray-900 dark:text-white">
				{t("dashboard.topbar.title")}
			</h1>

			{/* Actions */}
			<div className="flex items-center gap-3">
				{/* Search */}
				<div
					className={cn(
						"flex w-48 items-center gap-2 rounded-xl px-4 py-2 text-sm",
						"bg-gray-50 text-gray-400",
						"dark:bg-gray-800 dark:text-gray-500",
					)}
				>
					<Search className="h-4 w-4" />
					<span>{t("dashboard.topbar.search")}</span>
				</div>

				{/* Notifications */}
				<button
					type="button"
					className={cn(
						"relative flex h-9 w-9 items-center justify-center rounded-xl",
						"bg-gray-50 text-gray-500",
						"dark:bg-gray-800 dark:text-gray-400",
					)}
				>
					<Bell className="h-4 w-4" />
					{unreadCount > 0 && (
						<span className="absolute -top-0.5 -start-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</button>

				{/* Profile avatar */}
				<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-sm font-bold text-white">
					{userName?.charAt(0) || "م"}
				</div>
			</div>
		</div>
	);
}
