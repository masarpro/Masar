import { ORPCError } from "@orpc/server";
import { getOwnerContextByToken, getOwnerSchedule } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";

export const getOwnerScheduleProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/schedule",
		tags: ["Owner Portal"],
		summary: "Get project schedule/milestones for owner portal",
	})
	.input(
		z.object({
			token: z.string().min(1, "رمز الوصول مطلوب"),
		}),
	)
	.handler(async ({ input }) => {
		// Rate limit before any DB work to throttle brute-force and spam
		await rateLimitToken(input.token, "getOwnerSchedule");

		// Validate token
		const context = await getOwnerContextByToken(input.token);

		if (!context) {
			throw new ORPCError("FORBIDDEN", { message: "رابط الوصول غير صالح أو منتهي الصلاحية" });
		}

		// Get schedule
		const milestones = await getOwnerSchedule(
			context.organizationId,
			context.projectId,
		);

		return {
			projectName: context.project.name,
			startDate: context.project.startDate,
			endDate: context.project.endDate,
			milestones,
		};
	});
