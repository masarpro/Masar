import { getProjectContract } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const getContract = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/contract",
		tags: ["Project Contract"],
		summary: "Get project contract with payment terms",
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
			{ section: "projects", action: "viewFinance" },
		);

		return getProjectContract(input.organizationId, input.projectId);
	});
