import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { logBusinessEvent } from "@repo/logs";

/**
 * Subscription middleware — checks if the active organization has a valid
 * subscription before allowing write operations.
 *
 * Bypasses:
 * - Super admins (user.role === "admin")
 * - Organizations with isFreeOverride === true
 */

type OrgSubscription = {
	status: string;
	plan: string;
	isFreeOverride: boolean;
	trialEndsAt: Date | null;
} | null;

// Process-local 30s cache: this query ran on EVERY write RPC (~20-30ms
// Dubai↔Mumbai each). Same tradeoffs as lib/permissions/permission-cache.ts —
// per-instance only, so cross-instance changes (e.g. Stripe webhooks) converge
// within one TTL; in-process plan changes call invalidateSubscriptionCache.
const SUBSCRIPTION_TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;
const subscriptionCache = new Map<
	string,
	{ value: OrgSubscription; expires: number }
>();
// Single-flight: parallel write RPCs from one page all missing the cache at
// once must share a single DB query instead of stampeding.
const subscriptionInflight = new Map<string, Promise<OrgSubscription>>();

export function invalidateSubscriptionCache(organizationId?: string): void {
	if (organizationId) {
		subscriptionCache.delete(organizationId);
		subscriptionInflight.delete(organizationId);
		return;
	}
	subscriptionCache.clear();
	subscriptionInflight.clear();
}

async function getOrgSubscription(orgId: string): Promise<OrgSubscription> {
	const hit = subscriptionCache.get(orgId);
	if (hit && hit.expires > Date.now()) {
		return hit.value;
	}

	const pending = subscriptionInflight.get(orgId);
	if (pending) {
		return pending;
	}

	const promise = db.organization
		.findUnique({
			where: { id: orgId },
			select: {
				status: true,
				plan: true,
				isFreeOverride: true,
				trialEndsAt: true,
			},
		})
		.then((org) => {
			if (subscriptionCache.size >= MAX_ENTRIES) {
				subscriptionCache.clear();
			}
			subscriptionCache.set(orgId, {
				value: org,
				expires: Date.now() + SUBSCRIPTION_TTL_MS,
			});
			return org;
		})
		.finally(() => {
			subscriptionInflight.delete(orgId);
		});

	subscriptionInflight.set(orgId, promise);
	return promise;
}

export async function checkSubscription(context: {
	user: { id: string; role?: string | null };
	session: { activeOrganizationId?: string | null };
}) {
	// Super admins bypass all checks
	if (context.user.role === "admin") return;

	const orgId = context.session.activeOrganizationId;
	if (!orgId) return;

	const org = await getOrgSubscription(orgId);

	if (!org) return;

	// Free override bypasses all checks
	if (org.isFreeOverride) return;

	// Check org status
	if (org.status === "SUSPENDED" || org.status === "CANCELLED") {
		throw new ORPCError("FORBIDDEN", {
			message: "subscription_required",
		});
	}

	// Check trial expiration — lazy update to FREE
	if (
		org.status === "TRIALING" &&
		org.trialEndsAt &&
		new Date() > org.trialEndsAt
	) {
		await db.organization.update({
			where: { id: orgId },
			data: { status: "ACTIVE", plan: "FREE" },
		});
		invalidateSubscriptionCache(orgId);
		logBusinessEvent({
			type: "subscription.expired",
			userId: context.user.id,
			organizationId: orgId,
			metadata: { trialEndsAt: org.trialEndsAt.toISOString() },
			severity: "info",
		});
		throw new ORPCError("FORBIDDEN", {
			message:
				"انتهت الفترة التجريبية. يرجى ترقية اشتراكك للمتابعة.",
			data: { code: "UPGRADE_REQUIRED" },
		});
	}

	// Block FREE plan from write operations
	if (org.plan === "FREE") {
		logBusinessEvent({
			type: "subscription.limit_hit",
			userId: context.user.id,
			organizationId: orgId,
			metadata: { plan: "FREE" },
			severity: "info",
		});
		throw new ORPCError("FORBIDDEN", {
			message:
				"هذه الميزة متاحة في الخطة الاحترافية فقط. يرجى ترقية اشتراكك.",
			data: { code: "UPGRADE_REQUIRED" },
		});
	}
}
