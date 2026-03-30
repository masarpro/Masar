import { createRole as createRoleQuery } from "@repo/database";
import type { Permissions } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const createRole = subscriptionProcedure
	.route({
		method: "POST",
		path: "/roles",
		tags: ["Roles"],
		summary: "Create a new role",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			name: z.string().trim().min(1).max(200),
			nameEn: z.string().trim().max(200).optional(),
			description: z.string().trim().max(2000).optional(),
			type: z.enum([
				"OWNER",
				"PROJECT_MANAGER",
				"ACCOUNTANT",
				"ENGINEER",
				"SUPERVISOR",
				"CUSTOM",
			]),
			permissions: z.record(z.string().max(50), z.record(z.string().max(50), z.boolean())).refine(obj => Object.keys(obj).length <= 20, "Too many permission sections"),
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
			permissions: input.permissions as unknown as Permissions,
			organizationId: input.organizationId,
		});

		return { role };
	});
