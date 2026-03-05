import { getOwnerContextByToken, getOwnerSchedule } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { throwOwnerTokenError } from "../helpers";

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
		const result = await getOwnerContextByToken(input.token);

		if (!result.ok) {
			throwOwnerTokenError(result.reason);
		}

		// Get schedule
		const milestones = await getOwnerSchedule(
			result.organizationId,
			result.projectId,
		);

		return {
			projectName: result.project.name,
			startDate: result.project.startDate,
			endDate: result.project.endDate,
			milestones,
		};
	});
