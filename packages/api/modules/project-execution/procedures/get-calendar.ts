import { getCalendar } from "@repo/database";
import { z } from "zod";
import { verifyProjectAccess } from "../../../lib/permissions";
import { protectedProcedure } from "../../../orpc/procedures";

export const getCalendarProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-execution/calendar",
		tags: ["Project Execution"],
		summary: "Get project calendar",
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
			{ section: "projects", action: "view" },
		);

		const calendar = await getCalendar(
			input.organizationId,
			input.projectId,
		);

		return { calendar };
	});
