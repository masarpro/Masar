"use client";

import type { PropsWithChildren } from "react";
import { SubscriptionBanner } from "./SubscriptionBanner";
import { UpgradePrompt } from "./UpgradePrompt";

export function SubscriptionGuard({
	children,
	orgStatus,
	orgPlan,
	trialEndsAt,
}: PropsWithChildren<{
	orgStatus: string;
	orgPlan?: string | null;
	trialEndsAt?: string | null;
}>) {
	// Fully blocked states
	if (orgStatus === "SUSPENDED" || orgStatus === "CANCELLED") {
		return <UpgradePrompt />;
	}

	// Warning states
	const showPastDueBanner = orgStatus === "PAST_DUE";
	const showTrialBanner =
		orgStatus === "TRIALING" && !!trialEndsAt;
	const showFreePlanBanner =
		orgPlan === "FREE" && orgStatus !== "TRIALING";

	return (
		<>
			{showFreePlanBanner && <SubscriptionBanner type="free_plan" />}
			{showPastDueBanner && <SubscriptionBanner type="past_due" />}
			{showTrialBanner && (
				<SubscriptionBanner
					type="trial_ending"
					trialEndsAt={trialEndsAt}
				/>
			)}
			{children}
		</>
	);
}
