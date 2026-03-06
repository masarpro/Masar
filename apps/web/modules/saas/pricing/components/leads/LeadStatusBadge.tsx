"use client";

import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
	NEW: {
		bg: "bg-blue-50 dark:bg-blue-950/50",
		text: "text-blue-700 dark:text-blue-400",
		dot: "bg-blue-500",
	},
	STUDYING: {
		bg: "bg-amber-50 dark:bg-amber-950/50",
		text: "text-amber-700 dark:text-amber-400",
		dot: "bg-amber-500",
	},
	QUOTED: {
		bg: "bg-violet-50 dark:bg-violet-950/50",
		text: "text-violet-700 dark:text-violet-400",
		dot: "bg-violet-500",
	},
	NEGOTIATING: {
		bg: "bg-orange-50 dark:bg-orange-950/50",
		text: "text-orange-700 dark:text-orange-400",
		dot: "bg-orange-500",
	},
	WON: {
		bg: "bg-teal-50 dark:bg-teal-950/50",
		text: "text-teal-700 dark:text-teal-400",
		dot: "bg-teal-500",
	},
	LOST: {
		bg: "bg-red-50 dark:bg-red-950/50",
		text: "text-red-700 dark:text-red-400",
		dot: "bg-red-400",
	},
};

interface LeadStatusBadgeProps {
	status: string;
	size?: "sm" | "md";
}

export function LeadStatusBadge({ status, size = "md" }: LeadStatusBadgeProps) {
	const t = useTranslations();

	const config = STATUS_CONFIG[status] ?? {
		bg: "bg-slate-100 dark:bg-slate-800",
		text: "text-slate-600 dark:text-slate-400",
		dot: "bg-slate-400",
	};

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full font-medium",
				size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
				config.bg,
				config.text,
			)}
		>
			<span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
			{t(`pricing.leads.status.${status}`)}
		</span>
	);
}
