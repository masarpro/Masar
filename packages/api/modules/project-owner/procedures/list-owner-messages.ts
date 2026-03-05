import { getOwnerContextByToken, getOwnerMessages } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { throwOwnerTokenError } from "../helpers";

export const listOwnerMessagesProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/messages",
		tags: ["Owner Portal"],
		summary: "List messages in owner channel for portal",
	})
	.input(
		z.object({
			token: z.string().min(1, "رمز الوصول مطلوب"),
			page: z.number().int().positive().optional().default(1),
			pageSize: z.number().int().positive().max(100).optional().default(50),
		}),
	)
	.handler(async ({ input }) => {
		// Rate limit before any DB work to throttle brute-force and spam
		await rateLimitToken(input.token, "listOwnerMessages");

		// Validate token
		const result = await getOwnerContextByToken(input.token);

		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		// Get messages
		const messages = await getOwnerMessages(
			result.organizationId,
			result.projectId,
			{
				page: input.page,
				pageSize: input.pageSize,
			},
		);

		return {
			projectName: result.project.name,
			...messages,
		};
	});
