import { getOwnerContextByToken, getOwnerPortalOfficialUpdates } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { throwOwnerTokenError } from "../helpers";

export const listOfficialUpdatesProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/updates",
		tags: ["Owner Portal"],
		summary: "List official updates for owner portal",
	})
	.input(
		z.object({
			token: z.string().min(1, "رمز الوصول مطلوب"),
			limit: z.number().int().positive().max(50).optional().default(10),
		}),
	)
	.handler(async ({ input }) => {
		// Rate limit before any DB work
		await rateLimitToken(input.token, "listOfficialUpdates");

		// Validate token
		const result = await getOwnerContextByToken(input.token);

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
