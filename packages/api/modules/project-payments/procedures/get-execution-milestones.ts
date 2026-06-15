import { db } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getExecutionMilestonesForPaymentsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/payments/execution-milestones",
		tags: ["Project Payments"],
		summary:
			"List execution milestones (title + dates) for the copy-to-payment-terms dialog",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "viewFinance" },
		);

		const milestones = await db.projectMilestone.findMany({
			where: {
				organizationId: input.organizationId,
				projectId: input.projectId,
			},
			orderBy: { orderIndex: "asc" },
			select: {
				id: true,
				title: true,
				plannedStart: true,
				plannedEnd: true,
				status: true,
			},
		});

		return milestones;
	});
