import "server-only";
import {
	db,
	getPurchasesByOrganizationId,
	getPurchasesByUserId,
} from "@repo/database";
import { getSession } from "@saas/auth/lib/server";
import { cache } from "react";

/**
 * Request-level cached query for listing purchases.
 * Hits the database directly instead of a self-HTTP round-trip to /api/rpc
 * (the old orpcClient path re-authenticated the request on every layout).
 *
 * Security: callers must pass an organizationId that the current user is a
 * member of — layouts resolve it from the session's activeOrganizationId or
 * from getActiveOrganization(slug), both of which are membership-scoped.
 */
export const cachedListPurchases = cache(
	async (organizationId?: string | null) => {
		if (organizationId) {
			const purchases = await getPurchasesByOrganizationId(organizationId);
			return { purchases };
		}

		const session = await getSession();
		if (!session) {
			return { purchases: [] };
		}

		const purchases = await getPurchasesByUserId(session.user.id);
		return { purchases };
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
