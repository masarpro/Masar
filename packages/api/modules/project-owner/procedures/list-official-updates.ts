import { ORPCError } from "@orpc/server";
import { getOwnerContextByToken, getOwnerPortalOfficialUpdates } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";

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
		// Validate token
		const context = await getOwnerContextByToken(input.token);

		if (!context) {
			throw new ORPCError("FORBIDDEN", { message: "رابط الوصول غير صالح أو منتهي الصلاحية" });
		}

		// Get official updates
		const updates = await getOwnerPortalOfficialUpdates(
			context.organizationId,
			context.projectId,
			{ limit: input.limit },
		);

		return {
			projectName: context.project.name,
			updates,
		};
	});
