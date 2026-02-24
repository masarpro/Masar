import { getPaymentsClaimsTimeline } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getPaymentsClaimsTimelineProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/finance/payments-claims-timeline",
		tags: ["Project Finance"],
		summary: "Get unified payments and claims timeline",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			type: z.enum(["all", "payment", "claim"]).optional(),
			status: z.string().optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			query: z.string().optional(),
			sortBy: z.enum(["date", "amount"]).optional(),
			sortOrder: z.enum(["asc", "desc"]).optional(),
			limit: z.number().min(1).max(100).optional(),
			offset: z.number().min(0).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "viewFinance" },
		);

		return getPaymentsClaimsTimeline(
			input.organizationId,
			input.projectId,
			{
				type: input.type,
				status: input.status,
				dateFrom: input.dateFrom,
				dateTo: input.dateTo,
				query: input.query,
				sortBy: input.sortBy,
				sortOrder: input.sortOrder,
				limit: input.limit,
				offset: input.offset,
			},
		);
	});
