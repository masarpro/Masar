import { ORPCError } from "@orpc/server";
import {
	getRoleById,
	updateRole as updateRoleQuery,
	type Permissions,
} from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const updateRole = subscriptionProcedure
	.route({
		method: "POST",
		path: "/roles/{id}",
		tags: ["Roles"],
		summary: "Update a role",
	})
	.input(
		z.object({
			id: z.string().trim().max(100),
			organizationId: z.string().trim().max(100),
			name: z.string().trim().min(1).max(200).optional(),
			nameEn: z.string().trim().max(200).optional(),
			description: z.string().trim().max(2000).optional(),
			permissions: z.record(z.string().max(50), z.record(z.string().max(50), z.boolean())).refine(obj => Object.keys(obj).length <= 20, "Too many permission sections").optional(),
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
			permissions: input.permissions as unknown as Permissions | undefined,
		});

		return { role };
	});
