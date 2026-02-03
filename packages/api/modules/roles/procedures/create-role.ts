import { createRole as createRoleQuery } from "@repo/database";
import type { Permissions } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const createRole = protectedProcedure
	.route({
		method: "POST",
		path: "/roles",
		tags: ["Roles"],
		summary: "Create a new role",
	})
	.input(
		z.object({
			organizationId: z.string(),
			name: z.string().min(1),
			nameEn: z.string().optional(),
			description: z.string().optional(),
			type: z.enum([
				"OWNER",
				"PROJECT_MANAGER",
				"ACCOUNTANT",
				"ENGINEER",
				"SUPERVISOR",
				"CUSTOM",
			]),
			permissions: z.record(z.string(), z.any()),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
			{ section: "settings", action: "roles" },
		);

		const role = await createRoleQuery({
			name: input.name,
			nameEn: input.nameEn,
			description: input.description,
			type: input.type,
			permissions: input.permissions as Permissions,
			organizationId: input.organizationId,
		});

		return { role };
	});
