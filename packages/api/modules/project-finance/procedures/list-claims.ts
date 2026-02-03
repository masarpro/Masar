import { getProjectClaims } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const listClaims = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/finance/claims",
		tags: ["Project Finance"],
		summary: "List project claims",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			status: z
				.enum(["DRAFT", "SUBMITTED", "APPROVED", "PAID", "REJECTED"])
				.optional(),
			limit: z.number().min(1).max(100).optional(),
			offset: z.number().min(0).optional(),
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
