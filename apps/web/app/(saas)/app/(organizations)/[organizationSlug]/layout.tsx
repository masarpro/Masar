import { config } from "@repo/config";
import { getActiveOrganization, getSession } from "@saas/auth/lib/server";
import { OnboardingOverlayWrapper } from "@saas/onboarding/components/OnboardingOverlayWrapper";
import { activeOrganizationQueryKey } from "@saas/organizations/lib/api";
import { SubscriptionGuard } from "@saas/payments/components/SubscriptionGuard";
import { AppWrapper } from "@saas/shared/components/AppWrapper";
import { AssistantWrapper } from "@saas/shared/components/ai-assistant/AssistantWrapper";
import {
	cachedGetMemberRole,
	cachedGetMyPermissions,
	cachedGetOrganizationSubscription,
	cachedListPurchases,
} from "@shared/lib/cached-queries";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

export default async function OrganizationLayout({
	children,
	params,
}: PropsWithChildren<{
	params: Promise<{
		organizationSlug: string;
	}>;
}>) {
	const layoutStart = performance.now();
	const { organizationSlug } = await params;

	// Fetch organization and session in parallel (both are independent)
	const [organization, session] = await Promise.all([
		getActiveOrganization(organizationSlug),
		getSession(),
	]);

	if (!organization) {
		return notFound();
	}

	const queryClient = getServerQueryClient();

	// Build prefetch promises (only depends on organization from Stage 1)
	const prefetchPromises: Promise<void>[] = [
		queryClient.prefetchQuery({
			queryKey: activeOrganizationQueryKey(organizationSlug),
			queryFn: () => organization,
		}),
	];

	if (config.users.enableBilling) {
		prefetchPromises.push(
			queryClient.prefetchQuery({
				queryKey: orpc.payments.listPurchases.queryKey({
					input: {
						organizationId: organization.id,
					},
				}),
				// Direct DB read (React-cached) — avoids a self-HTTP call to /api/rpc
				queryFn: () => cachedListPurchases(organization.id),
			}),
		);
	}

	if (session) {
		// Effective permissions of the current member — hydrated so the sidebar
		// and permission gates render correctly on the very first paint.
		prefetchPromises.push(
			queryClient.prefetchQuery({
				queryKey: orpc.permissions.getMine.queryKey({
					input: { organizationId: organization.id },
				}),
				queryFn: () => cachedGetMyPermissions(organization.id),
			}),
		);
	}

	// Stage 2+3 merged: subscription + role + prefetch ALL in parallel
	let orgSubscription: Awaited<ReturnType<typeof cachedGetOrganizationSubscription>> | null = null;
	let memberRole: Awaited<ReturnType<typeof cachedGetMemberRole>> | null = null;
	try {
		[orgSubscription, memberRole] = await Promise.all([
			cachedGetOrganizationSubscription(organization.id),
			config.users.enableOnboarding &&
			session &&
			!session.user.onboardingComplete
				? cachedGetMemberRole(organization.id, session.user.id)
				: Promise.resolve(null),
			...prefetchPromises,
		]);
	} catch (error) {
		console.error("[LAYOUT] Error fetching org data:", error);
	}

	const shouldShowOnboarding = memberRole?.role === "owner";

	// Redirect cancelled orgs to choose-plan
	if (orgSubscription?.status === "CANCELLED") {
		redirect("/choose-plan");
	}

	if (process.env.NODE_ENV === "development") {
		console.log(`[PERF] [organizationSlug]/layout.tsx: ${Math.round(performance.now() - layoutStart)}ms`);
	}

	return (
		// Own HydrationBoundary: the parent (saas) layout dehydrates before this
		// layout's prefetches run, so without it the getMine permissions query
		// would never reach the client on pages without their own boundary.
		<HydrationBoundary state={dehydrate(queryClient)}>
			<AssistantWrapper organizationName={organization.name}>
				<AppWrapper>
					<SubscriptionGuard
						orgStatus={orgSubscription?.status ?? "ACTIVE"}
						orgPlan={orgSubscription?.plan ?? null}
						trialEndsAt={orgSubscription?.trialEndsAt?.toISOString() ?? null}
					>
						<OnboardingOverlayWrapper
							shouldShow={shouldShowOnboarding}
							organizationId={organization.id}
							organizationSlug={organizationSlug}
							organizationName={organization.name}
						>
							{children}
						</OnboardingOverlayWrapper>
					</SubscriptionGuard>
				</AppWrapper>
			</AssistantWrapper>
		</HydrationBoundary>
	);
}
