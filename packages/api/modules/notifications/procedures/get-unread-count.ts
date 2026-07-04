import { getUnreadNotificationCount } from "@repo/database";
import { z } from "zod";
import { getCachedUserPermissions } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
import { getExcludedNotificationTypes } from "../lib/notification-permissions";
import { ORPCError } from "@orpc/server";

export const getUnreadCountProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications/unread-count",
		tags: ["Notifications"],
		summary: "Get unread notification count",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership
		const membership = await verifyOrganizationMembership(
			input.organizationId,
			context.user.id,
		);

		if (!membership) {
			throw new ORPCError("FORBIDDEN", {
				message: "ليس لديك صلاحية الوصول لهذه المنظمة",
			});
		}

		const permissions = await getCachedUserPermissions(
			context.user.id,
			input.organizationId,
		);

		const count = await getUnreadNotificationCount(
			input.organizationId,
			context.user.id,
			{
				// نفس تصفية القراءة في list-notifications كي يتطابق العدّاد
				excludeTypes: getExcludedNotificationTypes(permissions),
			},
		);

		return { count };
	});
