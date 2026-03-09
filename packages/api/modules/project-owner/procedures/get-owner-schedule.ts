import { getOwnerSchedule } from "@repo/database";
import { z } from "zod";
import { publicProcedure } from "../../../orpc/procedures";
import { rateLimitToken } from "../../../lib/rate-limit";
import { resolveOwnerContext, throwOwnerTokenError } from "../helpers";

export const getOwnerScheduleProcedure = publicProcedure
	.route({
		method: "GET",
		path: "/owner-portal/schedule",
		tags: ["Owner Portal"],
		summary: "Get project schedule/milestones for owner portal",
	})
	.input(
		z.object({
			token: z.string().min(1).optional(),
			sessionToken: z.string().min(1).optional(),
		}).refine((d) => d.token || d.sessionToken, {
			message: "token or sessionToken is required",
		}),
	)
	.handler(async ({ input }) => {
		await rateLimitToken(input.token || input.sessionToken!, "getOwnerSchedule");

		const result = await resolveOwnerContext(input);

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
