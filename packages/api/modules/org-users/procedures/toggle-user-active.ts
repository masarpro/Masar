import { ORPCError } from "@orpc/server";
import { toggleUserActive as toggleUserActiveQuery } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const toggleUserActive = protectedProcedure
	.route({
		method: "POST",
		path: "/org-users/{id}/toggle-active",
		tags: ["Organization Users"],
		summary: "Toggle user active status",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
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
