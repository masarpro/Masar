import { ORPCError } from "@orpc/server";
import { getOwnerContextByToken, getOwnerMessages } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";

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
		// Validate token
		const context = await getOwnerContextByToken(input.token);

		if (!context) {
			throw new ORPCError("FORBIDDEN", { message: "رابط الوصول غير صالح أو منتهي الصلاحية" });
		}

		// Get messages
		const messages = await getOwnerMessages(
			context.organizationId,
			context.projectId,
			{
				page: input.page,
				pageSize: input.pageSize,
			},
		);

		return {
			projectName: context.project.name,
			...messages,
		};
	});
