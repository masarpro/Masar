import { generateSubcontractNo } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const generateSubcontractNoProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/subcontracts/next-no",
		tags: ["Subcontracts"],
		summary: "Generate next subcontract number",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input }) => {
		const contractNo = await generateSubcontractNo(input.organizationId);
		return { contractNo };
	});
