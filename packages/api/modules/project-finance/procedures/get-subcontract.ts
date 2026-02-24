import { ORPCError } from "@orpc/server";
import { getSubcontractById } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getSubcontract = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/finance/subcontracts/{contractId}",
		tags: ["Project Finance"],
		summary: "Get a subcontract contract by ID",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			contractId: z.string(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "viewFinance" },
		);

		const contract = await getSubcontractById(
			input.contractId,
			input.organizationId,
			input.projectId,
		);

		if (!contract) {
			throw new ORPCError("NOT_FOUND", {
				message: "العقد غير موجود",
			});
		}

		return contract;
	});
