import { getExpensesByCategory } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";
import { idString } from "../../../lib/validation-constants";

export const getExpensesByCategoryProcedure = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/finance/expenses-by-category",
		tags: ["Project Finance"],
		summary: "Get expenses grouped by category for chart",
	})
	.input(
		z.object({
			organizationId: idString(),
			projectId: idString(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "viewFinance" },
		);

		return getExpensesByCategory(input.organizationId, input.projectId);
	});
