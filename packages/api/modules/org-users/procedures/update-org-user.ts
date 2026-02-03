import { ORPCError } from "@orpc/server";
import { updateOrgUser as updateOrgUserQuery } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const updateOrgUser = protectedProcedure
	.route({
		method: "POST",
		path: "/org-users/{id}",
		tags: ["Organization Users"],
		summary: "Update organization user",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
			name: z.string().min(1).optional(),
			organizationRoleId: z.string().optional(),
			isActive: z.boolean().optional(),
			customPermissions: z.record(z.string(), z.any()).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "settings", action: "users" },
		);

		try {
			const user = await updateOrgUserQuery(
				input.id,
				input.organizationId,
				{
					name: input.name,
					organizationRoleId: input.organizationRoleId,
					isActive: input.isActive,
					customPermissions: input.customPermissions,
				},
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
