import { ORPCError } from "@orpc/server";
import { toggleUserActive as toggleUserActiveQuery } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { notifyEvent } from "../../notifications/lib/notify";

export const toggleUserActive = subscriptionProcedure
	.route({
		method: "POST",
		path: "/org-users/{id}/toggle-active",
		tags: ["Organization Users"],
		summary: "Toggle user active status",
	})
	.input(
		z.object({
			id: z.string().trim().max(100),
			organizationId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "settings", action: "users" },
		);

		try {
			const user = await toggleUserActiveQuery(
				input.id,
				input.organizationId,
			);

			if (!user.isActive) {
				await notifyEvent({
					event: "org.userDeactivated",
					organizationId: input.organizationId,
					actorId: context.user.id,
					entity: { type: "user", id: user.id },
					data: { userName: user.name },
				});
			}

			return { user };
		} catch (error) {
			if (error instanceof Error) {
				throw new ORPCError("BAD_REQUEST", {
					message: error.message,
				});
			}
			throw error;
		}
	});
