import { getProjectClaims } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString, paginationLimit, paginationOffset } from "../../../lib/validation-constants";

export const listClaims = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/finance/claims",
		tags: ["Project Finance"],
		summary: "List project claims",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			status: z
				.enum(["DRAFT", "SUBMITTED", "APPROVED", "PAID", "REJECTED"])
				.optional(),
			limit: paginationLimit(),
			offset: paginationOffset(),
		}),
	)
	.handler(async ({ input, context }) => {
		// Verify membership, project access, and permission to view finance
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "viewFinance" },
		);

		const result = await getProjectClaims(
			input.organizationId,
			input.projectId,
			{
				status: input.status,
				limit: input.limit,
				offset: input.offset,
			},
		);

		return {
			claims: result.claims.map((claim) => ({
				...claim,
				amount: Number(claim.amount),
			})),
			total: result.total,
		};
	});
