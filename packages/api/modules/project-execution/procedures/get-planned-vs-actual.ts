import { getPlannedVsActual } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getPlannedVsActualProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-execution/planned-vs-actual",
		tags: ["Project Execution"],
		summary: "Get planned vs actual comparison",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			baselineId: z.string().optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const data = await getPlannedVsActual(
			input.organizationId,
			input.projectId,
			input.baselineId,
		);

		return data;
	});
