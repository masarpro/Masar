"use client";

import { statusToneClasses, type StatusTone } from "@ui/components/status-chip";
import { cn } from "@ui/lib";
import { useTranslations } from "next-intl";

/** Lead pipeline stages → canonical tones. */
const STATUS_TONE: Record<string, StatusTone> = {
	NEW: "info",
	STUDYING: "purple",
	QUOTED: "teal",
	NEGOTIATING: "warning",
	WON: "success",
	LOST: "danger",
};

interface LeadStatusBadgeProps {
	status: string;
	size?: "sm" | "md";
}

export function LeadStatusBadge({ status, size = "md" }: LeadStatusBadgeProps) {
	const t = useTranslations();

	const tone = STATUS_TONE[status] ?? "neutral";

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full font-medium",
				size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
				statusToneClasses(tone),
			)}
		>
			<span className="w-1.5 h-1.5 rounded-full bg-current" />
			{t(`pricing.leads.status.${status}`)}
		</span>
	);
}
