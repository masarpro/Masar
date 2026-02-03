import { generateWeeklyDigest } from "@repo/database";
import { z } from "zod";
import { verifyOrganizationAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getWeeklyDigest = protectedProcedure
	.route({
		method: "GET",
		path: "/digests/weekly",
		tags: ["Digests"],
		summary: "Get weekly digest summary for the user",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string().optional(),
			weekStart: z.coerce.date().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyOrganizationAccess(
			input.organizationId,
			context.user.id,
		);

		const digest = await generateWeeklyDigest(
			input.organizationId,
			context.user.id,
			{
				projectId: input.projectId,
				weekStart: input.weekStart,
			},
		);

		return digest;
	});
