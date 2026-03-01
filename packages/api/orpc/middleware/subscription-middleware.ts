import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";

/**
 * Subscription middleware — checks if the active organization has a valid
 * subscription before allowing write operations.
 *
 * Bypasses:
 * - Super admins (user.role === "admin")
 * - Organizations with isFreeOverride === true
 */
export async function checkSubscription(context: {
	user: { id: string; role?: string | null };
	session: { activeOrganizationId?: string | null };
}) {
	// Super admins bypass all checks
	if (context.user.role === "admin") return;

	const orgId = context.session.activeOrganizationId;
	if (!orgId) return;

	const org = await db.organization.findUnique({
		where: { id: orgId },
		select: {
			status: true,
			plan: true,
			isFreeOverride: true,
			trialEndsAt: true,
		},
	});

	if (!org) return;

	// Free override bypasses all checks
	if (org.isFreeOverride) return;

	// Check org status
	if (org.status === "SUSPENDED" || org.status === "CANCELLED") {
		throw new ORPCError("FORBIDDEN", {
			message: "subscription_required",
		});
	}

	// Check trial expiration
	if (
		org.status === "TRIALING" &&
		org.trialEndsAt &&
		new Date() > org.trialEndsAt
	) {
		throw new ORPCError("FORBIDDEN", {
			message: "trial_expired",
		});
	}

	// FREE plan is read-only — block write operations
	if (org.plan === "FREE") {
		throw new ORPCError("FORBIDDEN", {
			message: "free_plan_read_only",
		});
	}
}
