import { getOrganizationUsers } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const listOrgUsers = protectedProcedure
	.route({
		method: "GET",
		path: "/org-users",
		tags: ["Organization Users"],
		summary: "List organization users",
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
			{ section: "settings", action: "users" },
		);

		const users = await getOrganizationUsers(organizationId);
		return { users };
	});
