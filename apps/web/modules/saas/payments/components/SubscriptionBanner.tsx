"use client";

import { Button } from "@ui/components/button";
import { AlertTriangleIcon, ClockIcon, SparklesIcon, XIcon, ZapIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "masar_banner_dismissed_at";
const DISMISS_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export function SubscriptionBanner({
	type,
	trialEndsAt,
}: {
	type: "past_due" | "trial_ending" | "free_plan";
	trialEndsAt?: string | null;
}) {
	const t = useTranslations();
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		try {
			const dismissedAt = localStorage.getItem(DISMISS_KEY);
			if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DURATION) {
				setDismissed(true);
			}
		} catch {}
	}, []);

	const handleDismiss = useCallback(() => {
		setDismissed(true);
		try {
			localStorage.setItem(DISMISS_KEY, String(Date.now()));
		} catch {}
	}, []);

	if (dismissed && type !== "past_due") return null;

	const daysLeft = trialEndsAt
		? Math.max(
				0,
				Math.ceil(
					(new Date(trialEndsAt).getTime() - Date.now()) /
						(1000 * 60 * 60 * 24),
				),
			)
		: 0;

	const styles = {
		past_due: "border-destructive/20 bg-destructive/10 text-destructive",
		trial_ending: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
		free_plan: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
	};

	const icons = {
		past_due: <AlertTriangleIcon className="size-5" />,
		trial_ending: <SparklesIcon className="size-5" />,
		free_plan: <ZapIcon className="size-5" />,
	};

	const messages = {
		past_due: t("subscription.pastDue"),
		trial_ending: t("subscription.trialBanner", { days: daysLeft }),
		free_plan: t("subscription.freePlanBanner"),
	};

	const buttonVariants: Record<string, "error" | "primary"> = {
		past_due: "error",
		trial_ending: "primary",
		free_plan: "primary",
	};

	return (
		<div
			className={`flex items-center justify-between rounded-lg border p-4 mb-4 ${styles[type]}`}
		>
			<div className="flex items-center gap-2">
				{icons[type]}
				<span>{messages[type]}</span>
			</div>
			<div className="flex items-center gap-2">
				<Button asChild size="sm" variant={buttonVariants[type]}>
					<Link href="/choose-plan">
						{t("subscription.upgradeNow")}
					</Link>
				</Button>
				{type !== "past_due" && (
					<Button
						variant="ghost"
						size="icon"
						className="size-8"
						onClick={handleDismiss}
					>
						<XIcon className="size-4" />
					</Button>
				)}
			</div>
		</div>
	);
}
