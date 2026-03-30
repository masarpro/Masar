import { ORPCError } from "@orpc/server";
import { deleteOrgUser as deleteOrgUserQuery } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const deleteOrgUser = subscriptionProcedure
	.route({
		method: "POST",
		path: "/org-users/{id}/delete",
		tags: ["Organization Users"],
		summary: "Delete organization user",
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
			await deleteOrgUserQuery(input.id, input.organizationId);
			return { success: true };
		} catch (error) {
			if (error instanceof Error) {
				throw new ORPCError("BAD_REQUEST", {
					message: error.message,
				});
			}
			throw error;
		}
	});
