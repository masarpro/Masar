import { config } from "@repo/config";
import { db } from "@repo/database";
import { getActiveOrganization } from "@saas/auth/lib/server";
import { activeOrganizationQueryKey } from "@saas/organizations/lib/api";
import { SubscriptionGuard } from "@saas/payments/components/SubscriptionGuard";
import { AppWrapper } from "@saas/shared/components/AppWrapper";
import { orpc } from "@shared/lib/orpc-query-utils";
import { getServerQueryClient } from "@shared/lib/server";
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
	const { organizationSlug } = await params;

	const organization = await getActiveOrganization(organizationSlug);

	if (!organization) {
		return notFound();
	}

	const queryClient = getServerQueryClient();

	await queryClient.prefetchQuery({
		queryKey: activeOrganizationQueryKey(organizationSlug),
		queryFn: () => organization,
	});

	if (config.users.enableBilling) {
		await queryClient.prefetchQuery(
			orpc.payments.listPurchases.queryOptions({
				input: {
					organizationId: organization.id,
				},
			}),
		);
	}

	// Fetch subscription status + plan
	const orgSubscription = await db.organization.findUnique({
		where: { id: organization.id },
		select: { status: true, plan: true, trialEndsAt: true },
	});

	// Redirect cancelled orgs to choose-plan
	if (orgSubscription?.status === "CANCELLED") {
		redirect("/choose-plan");
	}

	return (
		<AppWrapper>
			<SubscriptionGuard
				orgStatus={orgSubscription?.status ?? "ACTIVE"}
				orgPlan={orgSubscription?.plan ?? null}
				trialEndsAt={orgSubscription?.trialEndsAt?.toISOString() ?? null}
			>
				{children}
			</SubscriptionGuard>
		</AppWrapper>
	);
}
