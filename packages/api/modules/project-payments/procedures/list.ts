import { listProjectPayments } from "@repo/database";
import { z } from "zod";
import { subscriptionProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const listProjectPaymentsProcedure = subscriptionProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/payments",
		tags: ["Project Payments"],
		summary: "List project payments",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractTermId: z.string().optional(),
			type: z.enum(["term", "free"]).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "viewFinance" },
		);

		return listProjectPayments(input.organizationId, input.projectId, {
			contractTermId: input.contractTermId,
			type: input.type,
		});
	});
