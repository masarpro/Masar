import { ORPCError } from "@orpc/server";
import { revokeShareLink } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const revokeShareLinkProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/shares/revoke",
		tags: ["Shares"],
		summary: "Revoke a share link",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			token: z.string(),
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
