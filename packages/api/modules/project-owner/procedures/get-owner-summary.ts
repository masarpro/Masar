import { ORPCError } from "@orpc/server";
import { getOwnerContextByToken, getOwnerSummary } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";

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
		const context = await getOwnerContextByToken(input.token);

		if (!context) {
			throw new ORPCError("FORBIDDEN", { message: "رابط الوصول غير صالح أو منتهي الصلاحية" });
		}

		// Get summary
		const summary = await getOwnerSummary(
			context.organizationId,
			context.projectId,
		);

		return {
			...summary,
			organization: context.project.organization,
		};
	});
