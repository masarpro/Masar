import { generateContractNo } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getNextContractNo = protectedProcedure
	.route({
		method: "GET",
		path: "/contracts/next-no",
		tags: ["Project Contract"],
		summary: "Get next contract number for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input }) => {
		try {
			const contractNo = await generateContractNo(input.organizationId);
			return { contractNo };
		} catch (err) {
			console.error("[getNextContractNo] Error:", err);
			return { contractNo: "CON-001" };
		}
	});
