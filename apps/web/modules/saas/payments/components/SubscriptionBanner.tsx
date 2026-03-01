"use client";

import { Button } from "@ui/components/button";
import { AlertTriangleIcon, ClockIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function SubscriptionBanner({
	type,
	trialEndsAt,
}: {
	type: "past_due" | "trial_ending" | "free_plan";
	trialEndsAt?: string | null;
}) {
	const t = useTranslations();

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
		trial_ending: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
		free_plan: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
	};

	const icons = {
		past_due: <AlertTriangleIcon className="size-5" />,
		trial_ending: <ClockIcon className="size-5" />,
		free_plan: <LockIcon className="size-5" />,
	};

	const messages = {
		past_due: t("subscription.pastDue"),
		trial_ending: t("subscription.trialEnding", { days: daysLeft }),
		free_plan: t("subscription.freePlan"),
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
			<Button asChild size="sm" variant={buttonVariants[type]}>
				<Link href="/choose-plan">
					{t("subscription.upgradeNow")}
				</Link>
			</Button>
		</div>
	);
}
