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
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100).optional(),
			weekStart: z.coerce.date().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		const { permissions } = await verifyOrganizationAccess(
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

		// Claim amounts are financial data — strip them server-side for members
		// without finance.view instead of relying on the UI to hide them.
		if (!(permissions.finance?.view ?? false)) {
			return {
				...digest,
				summary: { ...digest.summary, upcomingPaymentsCount: 0 },
				upcomingPayments: [],
			};
		}

		return digest;
	});
