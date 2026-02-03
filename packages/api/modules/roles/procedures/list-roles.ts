import { getOrganizationRoles } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const listRoles = protectedProcedure
	.route({
		method: "GET",
		path: "/roles",
		tags: ["Roles"],
		summary: "List organization roles",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input: { organizationId }, context }) => {
		await verifyOrganizationAccess(
			organizationId,
			context.user.id,
			{ section: "settings", action: "roles" },
		);

		const roles = await getOrganizationRoles(organizationId);
		return { roles };
	});
