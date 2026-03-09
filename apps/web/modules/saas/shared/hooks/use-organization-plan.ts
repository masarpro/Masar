"use client";

import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";
import { orpc } from "@shared/lib/orpc-query-utils";
import { STALE_TIMES } from "@shared/lib/query-stale-times";
import { useQuery } from "@tanstack/react-query";

export function useOrganizationPlan() {
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const { data, isLoading } = useQuery(
		orpc.organizations.getPlan.queryOptions({
			input: organizationId
				? { organizationId }
				: undefined as any,
			enabled: !!organizationId,
			staleTime: STALE_TIMES.SUBSCRIPTION,
		}),
	);

	const effectivePlan = data?.effectivePlan ?? "FREE";

	return {
		plan: data?.plan ?? "FREE",
		status: data?.status ?? "TRIALING",
		effectivePlan,
		isTrialActive: effectivePlan === "TRIAL",
		isFree: effectivePlan === "FREE",
		isPro: effectivePlan === "PRO",
		trialDaysRemaining: data?.trialDaysRemaining ?? 0,
		trialEndsAt: data?.trialEndsAt ?? null,
		limits: data?.limits ?? {
			projects: { used: 0, max: 1 },
			members: { used: 0, max: 2 },
			aiChats: { used: 0, max: 10 },
		},
		isLoading,
	};
}
