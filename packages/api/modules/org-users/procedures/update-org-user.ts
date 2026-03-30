import { ORPCError } from "@orpc/server";
import { updateOrgUser as updateOrgUserQuery } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const updateOrgUser = subscriptionProcedure
	.route({
		method: "POST",
		path: "/org-users/{id}",
		tags: ["Organization Users"],
		summary: "Update organization user",
	})
	.input(
		z.object({
			id: z.string().trim().max(100),
			organizationId: z.string().trim().max(100),
			name: z.string().trim().min(1).max(200).optional(),
			organizationRoleId: z.string().trim().max(100).optional(),
			isActive: z.boolean().optional(),
			customPermissions: z.record(z.string().max(50), z.record(z.string().max(50), z.boolean())).refine(obj => Object.keys(obj).length <= 20, "Too many permission sections").optional(),
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
