import { listChangeOrders, getChangeOrderStats } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const listChangeOrdersProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-change-orders/list",
		tags: ["Project Change Orders"],
		summary: "List change orders for a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			status: z
				.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "IMPLEMENTED"])
				.optional(),
			search: z.string().optional(),
			page: z.number().int().positive().optional(),
			pageSize: z.number().int().positive().max(100).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const result = await listChangeOrders(
			input.organizationId,
			input.projectId,
			{
				status: input.status,
				search: input.search,
				page: input.page,
				pageSize: input.pageSize,
			},
		);

		return result;
	});

export const getChangeOrderStatsProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/project-change-orders/stats",
		tags: ["Project Change Orders"],
		summary: "Get change order statistics for a project",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "view" },
		);

		const stats = await getChangeOrderStats(
			input.organizationId,
			input.projectId,
		);

		return stats;
	});
