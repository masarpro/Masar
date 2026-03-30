import { getOwnerSummary } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { resolveOwnerContext, throwOwnerTokenError } from "../helpers";

export const getOwnerSummaryProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/summary",
		tags: ["Owner Portal"],
		summary: "Get project summary for owner portal",
	})
	.input(
		z.object({
			token: z.string().trim().min(1).max(200).optional(),
			sessionToken: z.string().trim().min(1).max(200).optional(),
		}).refine((d) => d.token || d.sessionToken, {
			message: "token or sessionToken is required",
		}),
	)
	.handler(async ({ input }) => {
		// Rate limit before any DB work to throttle brute-force and spam
		await rateLimitToken(input.token || input.sessionToken!, "getOwnerSummary");

		// Validate token or session
		const result = await resolveOwnerContext(input);

		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		// Get summary
		const summary = await getOwnerSummary(
			result.organizationId,
			result.projectId,
		);

		return {
			...summary,
			organization: result.project.organization,
		};
	});
