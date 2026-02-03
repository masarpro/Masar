import { ORPCError } from "@orpc/server";
import {
	getRoleById,
	updateRole as updateRoleQuery,
	type Permissions,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const updateRole = protectedProcedure
	.route({
		method: "POST",
		path: "/roles/{id}",
		tags: ["Roles"],
		summary: "Update a role",
	})
	.input(
		z.object({
			id: z.string(),
			organizationId: z.string(),
			name: z.string().min(1).optional(),
			nameEn: z.string().optional(),
			description: z.string().optional(),
			permissions: z.record(z.string(), z.any()).optional(),
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

		const role = await updateRoleQuery(input.id, {
			name: input.name,
			nameEn: input.nameEn,
			description: input.description,
			permissions: input.permissions as Permissions | undefined,
		});

		return { role };
	});
