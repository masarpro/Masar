import { ORPCError } from "@orpc/server";
import { revokeShareLink } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const revokeShareLinkProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/shares/revoke",
		tags: ["Shares"],
		summary: "Revoke a share link",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			token: z.string().trim().max(200),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "manageTeam" },
		);

		try {
			await revokeShareLink(
				input.token,
				input.organizationId,
				input.projectId,
			);

			return { success: true };
		} catch (error) {
			throw new ORPCError("NOT_FOUND", { message: "Share link not found" });
		}
	});
