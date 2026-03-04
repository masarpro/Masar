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
		// Lazy update: mark as FREE instead of blocking
		await db.organization.update({
			where: { id: orgId },
			data: { status: "ACTIVE", plan: "FREE" },
		});
		// Don't block — per-feature gates will handle limits
	}

	// NOTE: Blanket FREE plan block removed.
	// Per-feature gates (feature-gate.ts) now handle granular access control.
}
