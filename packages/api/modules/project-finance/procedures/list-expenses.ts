import { getProjectExpenses } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { verifyProjectAccess } from "../../../lib/permissions";

export const listExpenses = protectedProcedure
	.route({
		method: "GET",
		path: "/projects/{projectId}/finance/expenses",
		tags: ["Project Finance"],
		summary: "List project expenses (unified from FinanceExpense + SubcontractPayment)",
	})
	.input(
		z.object({
			organizationId: z.string(),
			projectId: z.string(),
			category: z
				.enum([
					"MATERIALS",
					"LABOR",
					"EQUIPMENT",
					"SUBCONTRACTOR",
					"TRANSPORT",
					"MISC",
				])
				.optional(),
			dateFrom: z.coerce.date().optional(),
			dateTo: z.coerce.date().optional(),
			limit: z.number().min(1).max(100).optional(),
			offset: z.number().min(0).optional(),
		}),
	)
	.handler(async ({ input, context }) => {
		await verifyProjectAccess(
			input.projectId,
			input.organizationId,
			context.user.id,
			{ section: "projects", action: "viewFinance" },
		);

		const result = await getProjectExpenses(
			input.organizationId,
			input.projectId,
			{
				category: input.category,
				dateFrom: input.dateFrom,
				dateTo: input.dateTo,
				limit: input.limit,
				offset: input.offset,
			},
		);

		return {
			expenses: result.expenses.map((expense) => ({
				...expense,
				amount: Number(expense.amount),
			})),
			total: result.total,
		};
	});
