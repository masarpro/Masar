import { acknowledgeAlert } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { subscriptionProcedure } from "../../../orpc/procedures";

export const acknowledgeAlertProcedure = subscriptionProcedure
	.route({
		method: "POST",
		path: "/projects/:projectId/insights/:alertId/acknowledge",
		tags: ["Project Insights"],
		summary: "Acknowledge a project alert",
	})
	.input(
		z.object({
			organizationId: z.string().trim().max(100),
			projectId: z.string().trim().max(100),
			alertId: z.string().trim().max(100),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const alert = await acknowledgeAlert(
			input.alertId,
			input.organizationId,
			input.projectId,
			context.user.id,
		);

		return {
			success: true,
			alert,
		};
	});
