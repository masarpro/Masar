import { getOwnerMessages } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { resolveOwnerContext, throwOwnerTokenError } from "../helpers";

export const listOwnerMessagesProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/messages",
		tags: ["Owner Portal"],
		summary: "List messages in owner channel for portal",
	})
	.input(
		z.object({
			token: z.string().min(1).optional(),
			sessionToken: z.string().min(1).optional(),
			page: z.number().int().positive().optional().default(1),
			pageSize: z.number().int().positive().max(100).optional().default(50),
		}).refine((d) => d.token || d.sessionToken, {
			message: "token or sessionToken is required",
		}),
	)
	.handler(async ({ input }) => {
		await rateLimitToken(input.token || input.sessionToken!, "listOwnerMessages");

		const result = await resolveOwnerContext(input);

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
