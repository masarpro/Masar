import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getNextProjectNoProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/next-no",
		tags: ["Projects"],
		summary: "Get next project number for an organization",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ input }) => {
		try {
			const count = await db.project.count({
				where: { organizationId: input.organizationId },
			});
			const nextNum = count + 1;
			return { projectNo: `PRJ-${String(nextNum).padStart(3, "0")}` };
		} catch (err) {
			console.error("[getNextProjectNo] Error:", err);
			return { projectNo: "PRJ-001" };
		}
	});
