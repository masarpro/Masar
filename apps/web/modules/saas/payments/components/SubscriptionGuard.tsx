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

	// Warning states. Reads never trigger the server-side lazy downgrade of an
	// expired trial, so the status can stay TRIALING after trialEndsAt has
	// passed — treat that as the free plan instead of showing "0 days left".
	const trialExpired =
		!!trialEndsAt && new Date(trialEndsAt).getTime() <= Date.now();
	const showPastDueBanner = orgStatus === "PAST_DUE";
	const showTrialBanner =
		orgStatus === "TRIALING" && !!trialEndsAt && !trialExpired;
	const showFreePlanBanner =
		orgPlan === "FREE" &&
		(orgStatus !== "TRIALING" || trialExpired || !trialEndsAt);

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
