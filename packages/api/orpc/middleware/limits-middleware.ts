import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";

/**
 * Checks if the organization has reached its user limit.
 */
export async function checkUserLimit(context: {
	user: { id: string; role?: string | null };
	session: { activeOrganizationId?: string | null };
}) {
	if (context.user.role === "admin") return;

	const orgId = context.session.activeOrganizationId;
	if (!orgId) return;

	const org = await db.organization.findUnique({
		where: { id: orgId },
		select: {
			maxUsers: true,
			isFreeOverride: true,
			_count: { select: { members: true } },
		},
	});

	if (!org || org.isFreeOverride) return;

	if (org._count.members >= org.maxUsers) {
		throw new ORPCError("FORBIDDEN", {
			message: "user_limit_reached",
		});
	}
}

/**
 * Checks if the organization has reached its project limit.
 */
export async function checkProjectLimit(context: {
	user: { id: string; role?: string | null };
	session: { activeOrganizationId?: string | null };
}) {
	if (context.user.role === "admin") return;

	const orgId = context.session.activeOrganizationId;
	if (!orgId) return;

	const org = await db.organization.findUnique({
		where: { id: orgId },
		select: {
			maxProjects: true,
			isFreeOverride: true,
			_count: { select: { projects: true } },
		},
	});

	if (!org || org.isFreeOverride) return;

	if (org._count.projects >= org.maxProjects) {
		throw new ORPCError("FORBIDDEN", {
			message: "project_limit_reached",
		});
	}
}
