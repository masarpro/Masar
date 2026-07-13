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
			<span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
				<AlertCircle className="h-3.5 w-3.5" />
				{t("pricing.leads.priority.URGENT")}
			</span>
		);
	}

	if (priority === "HIGH") {
		return (
			<span className="inline-flex items-center gap-1 rounded-full bg-chart-1/15 px-2.5 py-0.5 text-xs font-medium text-chart-1">
				<TrendingUp className="h-3.5 w-3.5" />
				{t("pricing.leads.priority.HIGH")}
			</span>
		);
	}

	return (
		<span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
			<Minus className="h-3.5 w-3.5" />
			{t("pricing.leads.priority.NORMAL")}
		</span>
	);
}
