import "server-only";
import { db } from "@repo/database";
import { orpcClient } from "./orpc-client";
import { cache } from "react";

/**
 * Request-level cached query for listing purchases.
 * Ensures listPurchases is only called once per request even if
 * multiple layouts/pages invoke it.
 */
export const cachedListPurchases = cache(
	async (organizationId?: string | null) => {
		return orpcClient.payments.listPurchases({
			organizationId: organizationId ?? undefined,
		});
	},
);

/**
 * Request-level cached query for organization subscription status.
 */
export const cachedGetOrganizationSubscription = cache(
	async (organizationId: string) => {
		return db.organization.findUnique({
			where: { id: organizationId },
			select: { status: true, plan: true, trialEndsAt: true },
		});
	},
);

/**
 * Request-level cached query for member role lookup.
 */
export const cachedGetMemberRole = cache(
	async (organizationId: string, userId: string) => {
		return db.member.findFirst({
			where: { organizationId, userId },
			select: { role: true },
		});
	},
);
