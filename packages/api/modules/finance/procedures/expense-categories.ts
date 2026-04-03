import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { EXPENSE_CATEGORIES, searchCategories } from "@repo/utils";

export const listExpenseCategories = protectedProcedure
	.route({
		method: "GET",
		path: "/finance/expense-categories",
		tags: ["Finance", "Expenses"],
		summary: "List hierarchical expense categories",
	})
	.input(z.object({ search: z.string().optional() }))
	.handler(async ({ input }) => {
		if (input.search) {
			return searchCategories(input.search);
		}
		return EXPENSE_CATEGORIES;
	});
