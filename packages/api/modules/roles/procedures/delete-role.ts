import { ORPCError } from "@orpc/server";
import { getRoleById, deleteRole as deleteRoleQuery } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const deleteRole = protectedProcedure
	.route({
		method: "POST",
		path: "/roles/{id}/delete",
		tags: ["Roles"],
		summary: "Delete a role",
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
			{ section: "settings", action: "roles" },
		);

		const existingRole = await getRoleById(input.id);
		if (!existingRole || existingRole.organizationId !== input.organizationId) {
			throw new ORPCError("NOT_FOUND");
		}

		if (existingRole.isSystem) {
			throw new ORPCError("BAD_REQUEST", {
				message: "لا يمكن حذف دور النظام",
			});
		}

		await deleteRoleQuery(input.id);

		return { success: true };
	});
