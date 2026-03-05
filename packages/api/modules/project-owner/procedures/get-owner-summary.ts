import { getOwnerContextByToken, getOwnerSummary } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { throwOwnerTokenError } from "../helpers";

export const getOwnerSummaryProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/summary",
		tags: ["Owner Portal"],
		summary: "Get project summary for owner portal",
	})
	.input(
		z.object({
			token: z.string().min(1, "رمز الوصول مطلوب"),
		}),
	)
	.handler(async ({ input }) => {
		// Rate limit before any DB work to throttle brute-force and spam
		await rateLimitToken(input.token, "getOwnerSummary");

		// Validate token
		const result = await getOwnerContextByToken(input.token);

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
