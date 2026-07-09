"use client";

import { StatusChip, type StatusTone } from "@ui/components/status-chip";
import { useTranslations } from "next-intl";

export function SubscriptionStatusBadge({
	status,
}: {
	status: string;
	className?: string;
}) {
	const t = useTranslations();

	const badgeLabels: Record<string, string> = {
		active: t("settings.billing.activePlan.status.active"),
		canceled: t("settings.billing.activePlan.status.canceled"),
		expired: t("settings.billing.activePlan.status.expired"),
		incomplete: t("settings.billing.activePlan.status.incomplete"),
		past_due: t("settings.billing.activePlan.status.past_due"),
		paused: t("settings.billing.activePlan.status.paused"),
		trialing: t("settings.billing.activePlan.status.trialing"),
		unpaid: t("settings.billing.activePlan.status.unpaid"),
	};

	const badgeTones: Record<string, StatusTone> = {
		active: "success",
		canceled: "danger",
		expired: "danger",
		incomplete: "warning",
		past_due: "warning",
		paused: "warning",
		trialing: "info",
		unpaid: "danger",
	};

	return (
		<StatusChip tone={badgeTones[status] ?? "neutral"}>
			{badgeLabels[status]}
		</StatusChip>
	);
}
