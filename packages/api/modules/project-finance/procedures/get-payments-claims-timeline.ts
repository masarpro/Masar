import { getPaymentsClaimsTimeline } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString, searchQuery, paginationLimit, paginationOffset, MAX_CODE } from "../../../lib/validation-constants";

export const getPaymentsClaimsTimelineProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/finance/payments-claims-timeline",
		tags: ["Project Finance"],
		summary: "Get unified payments and claims timeline",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			type: z.enum(["all", "payment", "claim"]).optional(),
			status: z.string().trim().max(MAX_CODE).optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			query: searchQuery(),
			sortBy: z.enum(["date", "amount"]).optional(),
			sortOrder: z.enum(["asc", "desc"]).optional(),
			limit: paginationLimit(),
			offset: paginationOffset(),
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
