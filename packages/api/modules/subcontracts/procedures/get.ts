import { getSubcontractById } from "@repo/database";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const getSubcontract = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/subcontracts/{contractId}",
		tags: ["Subcontracts"],
		summary: "Get subcontract contract details",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
			contractId: idString(),
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
				message: "عقد الباطن غير موجود",
			});
		}

		return contract;
	});
