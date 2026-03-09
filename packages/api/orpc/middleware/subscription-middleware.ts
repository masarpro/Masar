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
