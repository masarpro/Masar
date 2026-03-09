import { getOwnerPortalOfficialUpdates } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { resolveOwnerContext, throwOwnerTokenError } from "../helpers";

export const listOfficialUpdatesProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/updates",
		tags: ["Owner Portal"],
		summary: "List official updates for owner portal",
	})
	.input(
		z.object({
			token: z.string().min(1).optional(),
			sessionToken: z.string().min(1).optional(),
			limit: z.number().int().positive().max(50).optional().default(10),
		}).refine((d) => d.token || d.sessionToken, {
			message: "token or sessionToken is required",
		}),
	)
	.handler(async ({ input }) => {
		await rateLimitToken(input.token || input.sessionToken!, "listOfficialUpdates");

		const result = await resolveOwnerContext(input);

		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		// Get official updates
		const updates = await getOwnerPortalOfficialUpdates(
			result.organizationId,
			result.projectId,
			{ limit: input.limit },
		);

		return {
			projectName: result.project.name,
			updates,
		};
	});
