"use client";

import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";

const STATUS_STYLES: Record<string, string> = {
	NEW: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
	STUDYING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
	QUOTED: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
	NEGOTIATING: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
	WON: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
	LOST: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

interface LeadStatusBadgeProps {
	status: string;
	size?: "sm" | "md";
}

export function LeadStatusBadge({ status, size = "md" }: LeadStatusBadgeProps) {
	const t = useTranslations();

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full font-medium",
				size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
				STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
			)}
		>
			{t(`pricing.leads.status.${status}`)}
		</span>
	);
}
