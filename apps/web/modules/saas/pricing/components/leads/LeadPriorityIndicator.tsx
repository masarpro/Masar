"use client";

import { AlertCircle, Minus, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";

interface LeadPriorityIndicatorProps {
	priority: string;
}

export function LeadPriorityIndicator({ priority }: LeadPriorityIndicatorProps) {
	const t = useTranslations();

	if (priority === "URGENT") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/30 px-2.5 py-0.5 text-xs font-medium text-red-600 dark:text-red-400">
				<AlertCircle className="h-3.5 w-3.5" />
				{t("pricing.leads.priority.URGENT")}
			</span>
		);
	}

	if (priority === "HIGH") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-950/30 px-2.5 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-400">
				<TrendingUp className="h-3.5 w-3.5" />
				{t("pricing.leads.priority.HIGH")}
			</span>
		);
	}

	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-slate-50 dark:bg-slate-800/50 px-2.5 py-0.5 text-xs text-muted-foreground">
			<Minus className="h-3.5 w-3.5" />
			{t("pricing.leads.priority.NORMAL")}
		</span>
	);
}
