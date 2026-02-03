import { getUnreadNotificationCount } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyOrganizationMembership } from "../../organizations/lib/membership";
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
			organizationId: z.string(),
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

		const count = await getUnreadNotificationCount(
			input.organizationId,
			context.user.id,
		);

		return { count };
	});
