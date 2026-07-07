import { z } from "zod";
import {
	getCachedUserRoleType,
	verifyOrganizationAccess,
} from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

/**
 * Return the caller's EFFECTIVE permissions within an organization
 * (role permissions merged with User.customPermissions), plus the role type.
 *
 * This is a UX-layer endpoint: the client uses it to hide menu items, pages
 * and widgets the member cannot access. It never replaces server-side
 * authorization — every procedure still runs verifyOrganizationAccess.
 */
export const getMine = protectedProcedure
	.route({
		method: "GET",
		path: "/permissions/mine",
		tags: ["Permissions"],
		summary: "Get my effective permissions in an organization",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input: { organizationId }, context }) => {
		// Membership check + effective permissions (cached, cross-tenant guarded)
		const { permissions } = await verifyOrganizationAccess(
			organizationId,
			context.user.id,
		);

		const roleType = await getCachedUserRoleType(
			context.user.id,
			organizationId,
		);

		return {
			permissions,
			roleType,
			isOwner: roleType === "OWNER",
		};
	});
